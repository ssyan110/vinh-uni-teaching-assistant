#!/usr/bin/env node
import { access, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';

const DEFAULT_CONFIG = {
  skillRoots: ['skills', '.codex/skills'],
  skillFileNames: ['SKILL.md', 'skill.md'],
  evalDirectory: '.eval',
  defaults: {
    tier: 'read-only',
    tokenBudget: {
      maxTokens: 2200,
      maxRolloutTokens: 2200,
    },
    status: 'not-started',
  },
  budgets: {
    maxSkillTokens: 2200,
    maxContextTokens: 50000,
    requiredGoldenCases: 0,
    requiredAdversarialCases: 0,
  },
  llmJudge: {
    enabled: false,
    swapReferenceActual: true,
    note: 'Swap expected/actual before feeding to peer-rankers to reduce ordering bias.',
  },
};

const TRAJECTORY_MODES = new Set(['EXACT', 'IN_ORDER', 'ANY_ORDER']);
const TIERS = new Set(['read-only', 'draft-only', 'action-allowed']);

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const projectRoot = path.resolve(process.cwd(), args.projectRoot || process.cwd());

(async () => {
  const config = await loadConfig(projectRoot, args.config);
  const mode = args.mode || 'audit';

  if (!['audit', 'score', 'init'].includes(mode)) {
    console.error(`[agent-skill-eval] unsupported mode: ${mode}`);
    process.exit(2);
  }

  if (mode === 'init') {
    const initResult = await initialize(projectRoot, config);
    printInitResult(initResult);
    process.exit(0);
  }

  const skills = await collectSkills(projectRoot, config);
  const results = await evaluateSkills(projectRoot, config, skills, {
    strict: !!args.strict,
    actualRunsPath: args.actualRuns,
  });

  if (mode === 'score' && args.actualRuns) {
    const scored = await scoreRunsWithCases(projectRoot, config, results, args.actualRuns);
    printScoreSummary(scored);
  }

  printAuditSummary(results, args.json);

  const hasError = results.findings.some((r) => r.errors.length > 0);
  const hasWarning = results.findings.some((r) => r.warnings.length > 0);
  if (hasError || (args.strict && hasWarning)) {
    process.exit(1);
  }
})();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      continue;
    }

    const keyRaw = item.slice(2);
    const key = keyRaw.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (key === 'help' || key === 'h') {
      out.help = true;
      continue;
    }

    if (key === 'strict' || key === 'json') {
      out[key] = true;
      continue;
    }

    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
      continue;
    }

    out[key] = next;
    i += 1;
  }

  return out;
}

function printHelp() {
  console.log(`agent-skill-eval\n\nUsage:\n  node scripts/agent-skill-eval/run.mjs --mode <audit|score|init> --project-root <path> [options]\n\nModes:\n  audit  Validate skill markdown + eval contracts (default)\n  score  Compare recorded runs against eval cases\n  init   Bootstrap .eval manifests for discovered skills\n\nOptions:\n  --project-root       project root (default: current folder)\n  --config             path to custom config JSON\n  --mode               audit, score, or init\n  --strict             fail on warnings\n  --json               print machine-readable summary\n  --actual-runs        path to JSONL run data for score mode\n`);
}

async function pathExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadJson(filePath, fallback = null) {
  const body = await readFile(filePath, 'utf8').catch(() => null);
  if (!body) return fallback;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`invalid JSON in ${filePath}: ${error.message}`);
  }
}

async function loadConfig(projectRoot, customPath) {
  const cfgPath = customPath
    ? path.resolve(projectRoot, customPath)
    : path.join(projectRoot, 'scripts', 'agent-skill-eval', 'config.json');

  const userCfg = await loadJson(cfgPath, {});
  return {
    ...DEFAULT_CONFIG,
    ...userCfg,
    budgets: {
      ...DEFAULT_CONFIG.budgets,
      ...(userCfg.budgets || {}),
    },
    defaults: {
      ...DEFAULT_CONFIG.defaults,
      ...(userCfg.defaults || {}),
      tokenBudget: {
        ...DEFAULT_CONFIG.defaults.tokenBudget,
        ...(userCfg.defaults ? userCfg.defaults.tokenBudget : {}),
      },
    },
    llmJudge: {
      ...DEFAULT_CONFIG.llmJudge,
      ...(userCfg.llmJudge || {}),
    },
  };
}

function parseFrontMatter(fileText) {
  const fmMatch = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    return { frontMatter: {}, body: fileText };
  }

  const fmLines = fmMatch[1].split(/\r?\n/);
  const frontMatter = {};
  for (const line of fmLines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const colon = line.indexOf(':');
    if (colon === -1) {
      continue;
    }

    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (!key || value === undefined) {
      continue;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontMatter[key] = value;
  }

  return {
    frontMatter,
    body: fileText.slice(fmMatch[0].length + (fileText[fmMatch[0].length] === '\n' ? 0 : 0)),
  };
}

function stripBodyMarkdown(skillText) {
  const stripped = parseFrontMatter(skillText).body;
  return stripped;
}

function estimateTokens(text) {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 0;
  const words = cleaned.split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
}

async function collectSkills(projectRoot, config) {
  const discovered = [];
  const seen = new Set();

  for (const rootName of config.skillRoots) {
    const absRoot = path.join(projectRoot, rootName);
    if (!(await pathExists(absRoot))) {
      continue;
    }

    const dirs = await readdir(absRoot, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory() && !dir.isSymbolicLink()) {
        continue;
      }

      const skillDir = path.join(absRoot, dir.name);
      const fileName = await resolveSkillFile(skillDir, config.skillFileNames);
      if (!fileName) {
        continue;
      }

      const key = await resolveSkillId(skillDir, fileName);
      if (!seen.has(key)) {
        discovered.push({ skillDir, skillFile: fileName, id: key });
        seen.add(key);
      }
    }
  }

  return discovered;
}

async function resolveSkillFile(skillDir, names) {
  for (const name of names) {
    const p = path.join(skillDir, name);
    if (await pathExists(p)) {
      return p;
    }
  }
  return null;
}

async function resolveSkillId(skillDir, skillFile) {
  const content = await readFile(skillFile, 'utf8');
  const front = parseFrontMatter(content).frontMatter;
  if (front.name) {
    return front.name;
  }
  return path.basename(skillDir);
}

function parseJsonl(fileText) {
  const lines = fileText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = [];
  const errors = [];
  lines.forEach((line, idx) => {
    try {
      parsed.push({ line: idx + 1, value: JSON.parse(line) });
    } catch (error) {
      errors.push({ line: idx + 1, message: String(error.message) });
    }
  });

  return { parsed, errors };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function compareToolTrajectory(expectedTools, actualTools, mode) {
  const expected = ensureArray(expectedTools).map((x) => String(x));
  const actual = ensureArray(actualTools).map((x) => String(x));

  if (!expected.length && !actual.length) {
    return true;
  }

  if (mode === 'ANY_ORDER') {
    const e = [...expected].sort();
    const a = [...actual].sort();
    return e.length === a.length && e.every((value, idx) => value === a[idx]);
  }

  if (mode === 'IN_ORDER' || mode === 'EXACT') {
    return expected.length === actual.length && expected.every((value, idx) => value === actual[idx]);
  }

  return false;
}

async function readFileOrNull(filePath) {
  if (!(await pathExists(filePath))) {
    return null;
  }
  return readFile(filePath, 'utf8');
}

async function initialize(projectRoot, config) {
  const skills = await collectSkills(projectRoot, config);
  const created = {
    manifests: [],
    skipped: [],
    errors: [],
    total: skills.length,
  };

  for (const item of skills) {
    const evalDir = path.join(item.skillDir, config.evalDirectory);
    try {
      await mkdir(evalDir, { recursive: true });
      const manifestPath = path.join(evalDir, 'manifest.json');
      if (await pathExists(manifestPath)) {
        created.skipped.push(item.id);
        continue;
      }

      const manifest = {
        skillId: item.id,
        tier: config.defaults.tier,
        status: config.defaults.status,
        triggerSignals: [],
        tokenBudget: {
          maxTokens: config.defaults.tokenBudget.maxTokens,
          note: `Override when running ` +
            `agent-skill-eval if this skill requires a larger context envelope.`,
        },
        rollout: {
          enabled: false,
          canaryPercent: 0,
        },
        judge: {
          enabled: false,
          method: 'llm-as-judge',
          biasSwapRequested: config.llmJudge.swapReferenceActual,
        },
      };

      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      created.manifests.push(item.id);
    } catch (error) {
      created.errors.push({ id: item.id, message: error.message });
    }
  }

  return created;
}

async function evaluateSkills(projectRoot, config, skills) {
  const findings = [];
  const triggerMap = new Map();

  for (const skill of skills) {
    const finding = {
      skillId: skill.id,
      skillDir: path.relative(projectRoot, skill.skillDir),
      tokens: 0,
      warnings: [],
      errors: [],
      coverage: {
        golden: { cases: 0 },
        adversarial: { cases: 0 },
        trajectory: { cases: 0 },
      },
      tier: config.defaults.tier,
    };

    const content = await readFile(skill.skillFile, 'utf8');
    const body = stripBodyMarkdown(content);
    const frontMatter = parseFrontMatter(content).frontMatter;
    finding.tokens += estimateTokens(body);

    const evalDir = path.join(skill.skillDir, config.evalDirectory);
    const manifestPath = path.join(evalDir, 'manifest.json');

    if (!(await pathExists(evalDir))) {
      finding.warnings.push('missing .eval directory');
    }

    const manifest = await loadJson(manifestPath, null);
    if (!manifest) {
      finding.warnings.push(`missing eval manifest: ${path.join(config.evalDirectory, 'manifest.json')}`);
    } else {
      if (manifest.skillId && manifest.skillId !== skill.id) {
        finding.warnings.push(`manifest skillId (${manifest.skillId}) does not match discovered skill id (${skill.id})`);
      }

      if (!TIERS.has(manifest.tier)) {
        finding.errors.push(`invalid tier: ${manifest.tier}`);
      } else {
        finding.tier = manifest.tier;
      }

      const tokenBudget = Number(manifest.tokenBudget?.maxTokens || config.budgets.maxSkillTokens);
      if (!Number.isFinite(tokenBudget) || tokenBudget <= 0) {
        finding.errors.push('tokenBudget.maxTokens must be a positive number');
      } else if (finding.tokens > tokenBudget) {
        finding.errors.push(`context budget failure: ${finding.tokens} > ${tokenBudget}`);
      }

      const triggerSignals = ensureArray(manifest.triggerSignals);
      for (const sig of triggerSignals) {
        const key = String(sig).trim().toLowerCase();
        if (!key) continue;
        const hits = triggerMap.get(key) || [];
        hits.push(skill.id);
        triggerMap.set(key, hits);
      }

      if (!triggerSignals.length && finding.tier !== 'read-only') {
        finding.warnings.push('no triggerSignals declared for draft/action tier; routing confidence may be weak');
      }

      if (manifest.rollout?.enabled && manifest.tier !== 'action-allowed') {
        finding.warnings.push('rollout settings are usually for action-allowed skills');
      }

      if (manifest.judge?.enabled && typeof manifest.judge.biasSwapRequested === 'boolean') {
        if (!manifest.judge.biasSwapRequested) {
          finding.warnings.push('judge.biasSwapRequested is false; keep bias swap on to avoid order bias');
        }
      }
    }

    const goldenPath = path.join(evalDir, 'golden.jsonl');
    const adversarialPath = path.join(evalDir, 'adversarial.jsonl');
    const trajectoryPath = path.join(evalDir, 'trajectory.jsonl');

    const goldenRaw = await readFileOrNull(goldenPath);
    const adversarialRaw = await readFileOrNull(adversarialPath);
    const trajectoryRaw = await readFileOrNull(trajectoryPath);

    if (goldenRaw === null) {
      finding.warnings.push(`missing ${path.join(config.evalDirectory, 'golden.jsonl')}`);
    } else {
      const { parsed, errors } = parseJsonl(goldenRaw);
      finding.coverage.golden.cases = parsed.length;
      if (errors.length) {
        finding.errors.push(`golden.jsonl parse error(s): ${errors.map((x) => `#${x.line}: ${x.message}`).join('; ')}`);
      }
      for (const rec of parsed) {
        validateCaseRecord(rec.value, finding, 'golden', 'expected');
        if (rec.value.value?.trajectoryMode) {
          const mode = rec.value.value.trajectoryMode;
          if (mode && !TRAJECTORY_MODES.has(mode)) {
            finding.errors.push(`golden case ${rec.value.id}: invalid trajectoryMode ${mode}`);
          }
        }
      }
      if (finding.coverage.golden.cases < config.budgets.requiredGoldenCases) {
        finding.warnings.push(`low golden coverage: ${finding.coverage.golden.cases} cases`);
      }
    }

    if (adversarialRaw === null) {
      finding.warnings.push(`missing ${path.join(config.evalDirectory, 'adversarial.jsonl')}`);
    } else {
      const { parsed, errors } = parseJsonl(adversarialRaw);
      finding.coverage.adversarial.cases = parsed.length;
      if (errors.length) {
        finding.errors.push(`adversarial.jsonl parse error(s): ${errors.map((x) => `#${x.line}: ${x.message}`).join('; ')}`);
      }
      for (const rec of parsed) {
        validateCaseRecord(rec.value, finding, 'adversarial', 'expected');
      }
      if (finding.coverage.adversarial.cases < config.budgets.requiredAdversarialCases) {
        finding.warnings.push(`low adversarial coverage: ${finding.coverage.adversarial.cases} cases`);
      }
    }

    if (trajectoryRaw === null) {
      if (finding.tier === 'action-allowed') {
        finding.warnings.push(`missing ${path.join(config.evalDirectory, 'trajectory.jsonl')}`);
      }
    } else {
      const { parsed, errors } = parseJsonl(trajectoryRaw);
      finding.coverage.trajectory.cases = parsed.length;
      if (errors.length) {
        finding.errors.push(`trajectory.jsonl parse error(s): ${errors.map((x) => `#${x.line}: ${x.message}`).join('; ')}`);
      }
      for (const rec of parsed) {
        const value = rec.value;
        validateCaseRecord(value, finding, 'trajectory', 'expected');
        if (!TRAJECTORY_MODES.has(value.trajectoryMode || '')) {
          finding.errors.push(`trajectory case ${value.id}: trajectoryMode must be EXACT, IN_ORDER, or ANY_ORDER`);
        }
        const expectedTools = ensureArray(value.expectedTools);
        if (!expectedTools.length) {
          finding.errors.push(`trajectory case ${value.id}: expectedTools missing`);
        }
      }
    }

    if (frontMatter.description) {
      finding.tokens += estimateTokens(frontMatter.description);
    }

    if (finding.tokens > config.budgets.maxContextTokens) {
      finding.errors.push(`token-budget failure: skill + metadata = ${finding.tokens}`);
    }

    findings.push(finding);
  }

  const routingRisks = [];
  for (const [trigger, ids] of triggerMap.entries()) {
    if (ids.length > 1) {
      routingRisks.push(`trigger overlap: "${trigger}" shared by ${ids.join(', ')}`);
    }
  }

  return {
    findings,
    projectRoot,
    config,
    routingRisks,
  };
}

function validateCaseRecord(record, finding, kind, _expectedLabel) {
  if (!record || typeof record !== 'object') {
    finding.errors.push(`${kind} record is not a JSON object`);
    return;
  }

  if (!record.id || !String(record.id).trim()) {
    finding.errors.push(`${kind} case is missing id`);
  }

  if (!record.input || typeof record.input !== 'string') {
    finding.warnings.push(`${kind} case ${record.id || '(no id)'} missing input`);
  }

  if (kind === 'golden') {
    const expected = record.expected;
    if (!expected || typeof expected !== 'object') {
      finding.errors.push(`golden case ${record.id || '(no id)'} missing expected`);
      return;
    }
    if (!expected.trigger && !expected.outputContains && !expected.outputRegex && !expected.toolCalls) {
      finding.warnings.push(`golden case ${record.id || '(no id)'} has minimal assertions`);
    }
    return;
  }

  if (kind === 'trajectory') {
    if (record.expectedTools !== undefined && !Array.isArray(record.expectedTools)) {
      finding.errors.push(`trajectory case ${record.id || '(no id)'} expectedTools must be array`);
    }
  }
}

function printAuditSummary(result, wantJson) {
  if (wantJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const total = result.findings.length;
  const errors = result.findings.reduce((acc, item) => acc + item.errors.length, 0);
  const warnings = result.findings.reduce((acc, item) => acc + item.warnings.length, 0);
  const passes = result.findings.filter((item) => item.errors.length === 0).length;

  console.log(`\nAgent Skill Evaluation Audit`);
  console.log(`Project: ${result.projectRoot}`);
  console.log(`Skills: ${total}`);
  console.log(`PASS: ${passes}`);
  console.log(`WARN: ${warnings}`);
  console.log(`FAIL: ${errors}`);

  for (const item of result.findings) {
    const status = item.errors.length ? 'FAIL' : item.warnings.length ? 'WARN' : 'PASS';
    console.log(`\n- ${item.skillId} [${status}]`);
    if (item.warnings.length) {
      for (const warn of item.warnings) {
        console.log(`  ! ${warn}`);
      }
    }
    if (item.errors.length) {
      for (const err of item.errors) {
        console.log(`  x ${err}`);
      }
    }
    console.log(`  tokens=${item.tokens} tier=${item.tier}`);
    console.log(`  coverage=golden:${item.coverage.golden.cases}, adversarial:${item.coverage.adversarial.cases}, trajectory:${item.coverage.trajectory.cases}`);
  }

  if (result.routingRisks.length) {
    console.log('\nRouting risk checks:');
    for (const risk of result.routingRisks) {
      console.log(`  ! ${risk}`);
    }
  }
}

async function scoreRunsWithCases(_projectRoot, _config, auditResults, actualRunsPath) {
  const runsRaw = await readFileOrNull(actualRunsPath);
  if (runsRaw === null) {
    console.error(`[agent-skill-eval] actual-runs file missing: ${actualRunsPath}`);
    return;
  }

  const parsedRuns = parseJsonl(runsRaw).parsed.map((item) => item.value);
  const runsByCase = new Map();
  for (const run of parsedRuns) {
    if (run?.caseId) {
      runsByCase.set(String(run.caseId), run);
    }
  }

  let totalChecks = 0;
  let totalPasses = 0;

  for (const skill of auditResults.findings) {
    const evalDir = path.join(_projectRoot, skill.skillDir, '.eval');
    const filePairs = [
      ['golden.jsonl', 'expected'],
      ['adversarial.jsonl', 'expectedReject'],
      ['trajectory.jsonl', 'expectedTools'],
    ];

    for (const [fileName, checkType] of filePairs) {
      const raw = await readFileOrNull(path.join(_projectRoot, evalDir, fileName));
      if (!raw) continue;
      const parsed = parseJsonl(raw).parsed;

      for (const rec of parsed) {
        const record = rec.value;
        const run = runsByCase.get(record.id);
        if (!run) continue;

        totalChecks += 1;

        if (checkType === 'expected') {
          let pass = true;
          if (record.expected?.trigger && run.triggerSkill) {
            pass = String(run.triggerSkill).trim() === String(record.expected.trigger).trim();
          }
          if (record.expected?.toolCalls) {
            const mode = record.expected?.trajectoryMode || (skill.tier === 'action-allowed' ? 'IN_ORDER' : 'ANY_ORDER');
            pass = pass && compareToolTrajectory(record.expected.toolCalls, run.toolCalls || [], mode);
          }
          if (record.expected?.outputContains && run.output) {
            for (const needle of ensureArray(record.expected.outputContains)) {
              pass = pass && String(run.output).includes(String(needle));
            }
          }
          if (pass) totalPasses += 1;
          continue;
        }

        if (checkType === 'expectedReject') {
          totalChecks += 1;
          const actualTrigger = run.triggerSkill || '';
          const expectReject = !!record.expectedReject;
          const pass = !!(expectReject ? !actualTrigger : actualTrigger);
          if (pass) totalPasses += 1;
          continue;
        }

        if (checkType === 'expectedTools') {
          totalChecks += 1;
          const expectedMode = record.trajectoryMode || 'EXACT';
          const pass = compareToolTrajectory(record.expectedTools, run.toolCalls || [], expectedMode);
          if (pass) totalPasses += 1;
        }
      }
    }
  }

  const score = totalChecks === 0 ? 0 : (totalPasses / totalChecks) * 100;
  console.log(`\nscore=${score.toFixed(1)}% (${totalPasses}/${totalChecks})`);
}

function printInitResult(result) {
  console.log('\nagent-skill-eval init summary');
  console.log(`skills scanned: ${result.total}`);
  console.log(`manifests created: ${result.manifests.length}`);
  if (result.skipped.length) {
    console.log(`manifests existing: ${result.skipped.length}`);
  }
  if (result.errors.length) {
    console.log('errors:');
    for (const item of result.errors) {
      console.log(` - ${item.id}: ${item.message}`);
    }
    process.exit(1);
  }
}
