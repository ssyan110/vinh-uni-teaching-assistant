import "./styles.css";
import {
  chooseSoloAiMove,
  countClaims,
  createLegacyBoardVocabulary,
  cycleManualOwner,
  detectWinner,
  fillFunctionPrompts,
  functionPromptsForScope,
  LEGACY_BOARD_SIDE,
  LEGACY_WIN_LENGTH,
  seededShuffle,
  splitIntoLegacyRounds,
  sentencesForScope,
  vocabularyForScope
} from "./game";
import { parseContent, validatePack } from "./importer";
import { loadCommittedSeed, resolveContentSource } from "./content-source";
import { clearPack, loadPack, savePack } from "./storage";
import type {
  CellOwner,
  ContentPack,
  FunctionPrompt,
  ImportPreview,
  LegacySubmode,
  ScopeSelection,
  Team,
  VocabularyItem
} from "./types";

type View = "home" | "import" | "setup" | "game";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("找不到游戏显示区域。");
const app: HTMLDivElement = appElement;

let pack: ContentPack | null = null;
let preview: ImportPreview | null = null;
let view: View = "home";
let selectedLessonId = "lesson-01-listening-1";
let promptTimerId: number | null = null;
let rounds: VocabularyItem[][] = [];
let roundIndex = 0;
let boardVocabulary: Array<VocabularyItem | undefined> = [];
let owners: CellOwner[] = [];
let winner: Team | null = null;
let scores: Record<Team, number> = { red: 0, blue: 0 };
let boardSeed = Date.now();
let liveMessage = "";
let contentError = "";
let legacySubmode: LegacySubmode = "classroom";
let availablePrompts: FunctionPrompt[] = [];
let functionCells = new Map<number, FunctionPrompt>();
let activePrompt: FunctionPrompt | null = null;
let promptCellIndex: number | null = null;
let promptRemaining = 0;
let pendingWinner: Team | null = null;

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function teamName(team: Team): string {
  return team === "red" ? "红队" : "蓝队";
}

function promptKindLabel(kind: FunctionPrompt["kind"]): string {
  if (kind === "dialogue-pattern") return "对话";
  if (kind === "sentence-rewrite") return "改写";
  return "造句";
}

function promptKindTitle(kind: FunctionPrompt["kind"]): string {
  if (kind === "dialogue-pattern") return "用句式回答，再造一句";
  if (kind === "sentence-rewrite") return "用句式改写";
  return "读句式，用它造句";
}

function boardPromptPoolForScope(
  content: ContentPack,
  selection: ScopeSelection,
  requiredCount: number
): FunctionPrompt[] {
  const prompts = functionPromptsForScope(content, selection);
  if (prompts.length >= requiredCount || sentencesForScope(content, selection).length === 0) return prompts;

  // Some imported lesson packs keep textbook sentences in `sentences` but do
  // not expand them into function exercises. Use those source sentences only
  // when the board still needs more practice content, then rotate the pool if
  // the lesson remains shorter than 81 cells.
  const promptTexts = new Set(prompts.map((prompt) => `${prompt.kind}\u0000${prompt.prompt}`));
  const sentencePrompts = sentencesForScope(content, selection)
    .filter((item) => !promptTexts.has(`pattern-make\u0000${item.sentence}`))
    .map((item): FunctionPrompt => ({
      kind: "pattern-make",
      prompt: item.sentence,
      support: "读课本句子，用本课句式或词语再造一句。",
      seconds: 30,
      sourceItemId: `sentence-${item.item_id}`
    }));
  return [...prompts, ...sentencePrompts];
}

function shell(content: string, options: { compact?: boolean } = {}): string {
  const contentSummary = pack
    ? `<span>${escapeHtml(pack.class_name)}</span><span>${pack.lessons.length} 个内容段</span>`
    : `<span>还没有内容</span>`;
  return `
    <div class="app-shell ${options.compact ? "app-shell--compact" : ""}">
      <div class="ambient ambient-a" aria-hidden="true"></div>
      <div class="ambient ambient-b" aria-hidden="true"></div>
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="返回首页">
          <span class="brand-mark" aria-hidden="true">字</span>
          <span><strong>第一课词语连线</strong><small>听说 · 9 × 9 课堂游戏</small></span>
        </button>
        <div class="content-chip" aria-label="当前内容">${contentSummary}</div>
      </header>
      <main id="main-content" tabindex="-1">${content}</main>
      <div class="sr-only" aria-live="polite">${escapeHtml(liveMessage)}</div>
    </div>`;
}

function renderHome(): void {
  const hasContent = Boolean(pack && (pack.vocabulary.length || pack.exercises.length));
  const lessonCount = pack?.lessons.length ?? 0;
  const contentCard = hasContent && pack
    ? `<section class="content-status" aria-label="当前内容">
        <div><span class="eyebrow">内容包</span><h2>${escapeHtml(pack.class_name)}</h2></div>
        <dl>
          <div><dt>可选内容</dt><dd>${lessonCount}</dd></div>
          <div><dt>词语</dt><dd>${pack.vocabulary.length}</dd></div>
          <div><dt>功能格</dt><dd>${pack.exercises.length}</dd></div>
        </dl>
      </section>`
    : `<section class="empty-note" aria-label="空白状态">
        <span aria-hidden="true">＋</span>
        <div><strong>还没有课堂内容</strong><p>请导入包含词语和功能题的 JSON 文件。</p></div>
      </section>`;

  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">第一课 · 听说</span>
        <h1>看内容，<br><em>说出来。</em></h1>
        <p class="hero-lead">固定 9 × 9 棋盘。一般格练词汇，功能格练造句、对话和改写；教师确认完成后，队伍占格连线。</p>
        <div class="hero-actions">
          <button class="button button--primary" data-action="setup" ${hasContent ? "" : "disabled"}>
            <span>开始游戏</span><span aria-hidden="true">→</span>
          </button>
          <button class="button button--secondary" data-action="import">
            ${hasContent ? "更新内容" : "导入内容"}
          </button>
        </div>
      </div>
      <div class="hero-board" aria-hidden="true">
        <span class="board-stamp">连成一线</span>
        <div class="sample-grid">
          ${["起名儿", "惊讶", "造句", "琢磨", "改写", "别扭", "低调", "对话", "游戏"].map((word, index) =>
            `<span class="sample-cell ${[0, 4, 8].includes(index) ? "sample-cell--marked" : ""}">${word}</span>`
          ).join("")}
        </div>
        <p>9 × 9 <small>五格连成一线</small></p>
      </div>
    </section>
    ${contentError ? `<section class="content-error" role="alert"><strong>内容无法使用</strong><p>${escapeHtml(contentError)}</p></section>` : ""}
    ${contentCard}
    <footer class="home-footer"><span>课堂投影 · 词语、句式、口语互动</span><span>离线可用</span></footer>
  `);
  bindCommonActions();
}

function renderImport(): void {
  const previewPanel = preview
    ? `<section class="preview-panel">
        <div class="preview-heading">
          <div><span class="eyebrow">导入前检查</span><h2>${escapeHtml(preview.fileName)}</h2></div>
          <span class="status-pill status-pill--ok">可以导入</span>
        </div>
        <div class="preview-stats">
          <div><strong>${preview.pack.vocabulary.length}</strong><span>词语</span></div>
          <div><strong>${preview.pack.exercises.length}</strong><span>功能题</span></div>
          <div><strong>${preview.pack.lessons.length}</strong><span>内容段</span></div>
          <div><strong>${preview.pack.content_revision}</strong><span>版本</span></div>
        </div>
        ${preview.warnings.length ? `<ul class="warning-list">${preview.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}
        <div class="character-preview" aria-label="将要导入的词语">
          ${preview.pack.vocabulary.slice(0, 60).map((item) => `<span>${escapeHtml(item.word)}</span>`).join("")}
          ${preview.pack.vocabulary.length > 60 ? `<span class="more">+${preview.pack.vocabulary.length - 60}</span>` : ""}
        </div>
        <div class="form-actions">
          <button class="button button--secondary" data-action="cancel-preview">重新选择</button>
          <button class="button button--primary" data-action="confirm-import">替换并保存</button>
        </div>
        <p class="replace-note">新内容会替换当前浏览器中的临时内容。</p>
      </section>`
    : `<section class="upload-panel">
        <div class="upload-icon" aria-hidden="true">↑</div>
        <span class="eyebrow">课堂内容</span>
        <h1>导入练习内容</h1>
        <p>选择完整的 JSON 内容包。保存前会先显示词语和功能题数量。</p>
        <label class="file-picker">
          <span>选择 JSON 文件</span>
          <input id="content-file" type="file" accept=".json,application/json" />
        </label>
        <div class="format-guide">
          <div><strong>词语</strong><span>显示在一般格</span></div>
          <div><strong>造句 · 对话 · 改写</strong><span>自动放进功能格</span></div>
          <div><strong>固定 30 秒</strong><span>教师确认后占格</span></div>
        </div>
        <p id="import-error" class="form-error" role="alert"></p>
      </section>`;

  app.innerHTML = shell(`
    <div class="page-heading">
      <button class="back-button" data-action="home">← 返回首页</button>
    </div>
    ${previewPanel}
  `);
  bindCommonActions();
  document.querySelector<HTMLInputElement>("#content-file")?.addEventListener("change", handleFileSelect);
}

function renderSetup(): void {
  if (!pack) return renderHome();
  const activeLessons = pack.lessons.filter((lesson) => lesson.active !== false).sort((a, b) => a.order - b.order);
  if (!activeLessons.some((lesson) => lesson.lesson_id === selectedLessonId)) {
    selectedLessonId = activeLessons[0]?.lesson_id ?? "";
  }
  const currentSelection = getScopeSelection();
  const chosen = vocabularyForScope(pack, currentSelection);
  const roundPlan = splitIntoLegacyRounds(chosen);
  const firstRoundWordCount = roundPlan[0]?.length ?? 0;
  const firstRoundFunctionCount = Math.max(0, LEGACY_BOARD_SIDE ** 2 - firstRoundWordCount);
  const scopedPrompts = boardPromptPoolForScope(pack, currentSelection, firstRoundFunctionCount);
  const needsFunctionPrompts = roundPlan.length === 0 || roundPlan.some((round) => round.length < LEGACY_BOARD_SIDE ** 2);
  const canStart = !needsFunctionPrompts || scopedPrompts.length > 0;
  const selectedLesson = activeLessons.find((lesson) => lesson.lesson_id === selectedLessonId);

  app.innerHTML = shell(`
    <div class="page-heading">
      <button class="back-button" data-action="home">← 返回首页</button>
      <span class="step-label">游戏设置 · 固定棋盘</span>
    </div>
    <section class="setup-layout">
      <div class="setup-main">
        <span class="eyebrow">本轮内容</span>
        <h1>选一段，<br><em>马上开玩。</em></h1>
        <p class="setup-lead">所有回合都是 9 × 9。词语每个只出现一次，不足的格子用课本练习补满。</p>
        <div class="setup-card">
          <label class="field field--large"><span>选择本轮内容</span>
            <select id="lesson-select" aria-label="选择本轮内容">
              ${activeLessons.map((lesson) => `<option value="${escapeHtml(lesson.lesson_id)}" ${lesson.lesson_id === selectedLessonId ? "selected" : ""}>${escapeHtml(lesson.lesson_name)}</option>`).join("")}
            </select>
          </label>
          <div class="legacy-settings">
            <fieldset><legend>课堂操作方式</legend>
              <label><input type="radio" name="legacy-submode" value="classroom" ${legacySubmode === "classroom" ? "checked" : ""}/><span><b>课堂分队</b><small>点击：空白 → 蓝队 → 红队 → 空白。</small></span></label>
              <label><input type="radio" name="legacy-submode" value="solo" ${legacySubmode === "solo" ? "checked" : ""}/><span><b>学生对战电脑</b><small>学生用蓝队，电脑用红队。</small></span></label>
            </fieldset>
            <div class="function-note"><strong>功能格固定 30 秒</strong><span>造句 · 对话 · 改写</span></div>
          </div>
        </div>
      </div>
      <aside class="board-plan" aria-live="polite">
        <span class="eyebrow">9 × 9 棋盘</span>
        <h2>${escapeHtml(selectedLesson?.lesson_name ?? "选择内容")}</h2>
        <strong>${chosen.length}</strong><span>个不重复词语</span>
        ${chosen.length
          ? `<div class="plan-line"><b>81</b><span>${firstRoundWordCount} 个词语 + ${firstRoundFunctionCount} 个功能格 · ${roundPlan.length} 轮</span></div>`
          : `<div class="plan-line"><b>81</b><span>格 · 全部使用课本练习</span></div>`}
        <div class="plan-functions"><span>课本练习题池</span><strong>${scopedPrompts.length}</strong><small>${firstRoundFunctionCount ? "不足时按题目轮换补满" : "本轮无需补入功能格"}</small></div>
        <button class="button button--primary button--wide" data-action="start-game" ${canStart ? "" : "disabled"}>开始游戏 <span aria-hidden="true">→</span></button>
      </aside>
    </section>
  `);
  bindCommonActions();
  bindSetupActions();
}

function renderGame(): void {
  const side = LEGACY_BOARD_SIDE;
  const required = LEGACY_WIN_LENGTH;
  const isManual = legacySubmode === "classroom";
  const claims = countClaims(owners);
  const isDraw = !isManual && !winner && owners.length > 0 && owners.every(Boolean);
  const result = winner || isDraw
    ? `<div class="result-banner" role="status"><strong>${winner ? `${teamName(winner)}获胜！` : "本轮平局！"}</strong><span>${winner ? `已经连成 ${required} 格。` : "所有格子都已选择。"}</span></div>`
    : "";
  const selectedLessonName = pack?.lessons.find((lesson) => lesson.lesson_id === selectedLessonId)?.lesson_name ?? "第一课";
  app.innerHTML = shell(`
    <section class="game-header">
      <div class="game-header__left">
        <button class="back-button back-button--light" data-action="setup">← 结束</button>
        <div><span class="eyebrow">9 × 9 · ${escapeHtml(selectedLessonName)} · 第 ${roundIndex + 1} / ${rounds.length} 轮</span><h1>连成 ${required} 格就获胜</h1></div>
      </div>
      <div class="scoreboard" aria-label="已占格数">
        <div class="team-score team-score--red"><span>${legacySubmode === "solo" ? "电脑 · 红" : "红队"}</span><strong>${claims.red}</strong></div>
        <div class="turn-timer"><span>已占格</span><strong>${claims.red + claims.blue}</strong></div>
        <div class="team-score team-score--blue"><span>${legacySubmode === "solo" ? "学生 · 蓝" : "蓝队"}</span><strong>${claims.blue}</strong></div>
      </div>
      <div class="game-actions"><button class="icon-button" data-action="new-board">重排</button></div>
    </section>
    ${result}
    <section class="board-stage">
      <div class="board" style="--board-side:${side}" role="grid" aria-label="9 × 9 棋盘">
        ${Array.from({ length: side * side }, (_, index) => {
          const item = boardVocabulary[index];
          const prompt = functionCells.get(index);
          const promptLabel = prompt ? promptKindLabel(prompt.kind) : "";
          const disabled = Boolean(winner || isDraw || (!isManual && owners[index]));
          const aria = prompt ? `${promptLabel}功能格` : item?.word ?? "空白格";
          return `<button class="board-cell ${prompt ? "board-cell--function" : "board-cell--word"} ${owners[index] ? `claimed claimed--${owners[index]}` : ""}" role="gridcell" data-cell="${index}" aria-label="${escapeHtml(aria)}${owners[index] ? `，已由${teamName(owners[index] as Team)}选择` : ""}" ${disabled ? "disabled" : ""}><span>${prompt ? promptLabel : escapeHtml(item?.word ?? "")}</span>${prompt ? `<small>30 秒</small>` : ""}</button>`;
        }).join("")}
      </div>
    </section>
    <section class="game-footer">
      <p><strong>${winner || isDraw ? "本轮结束" : (isManual ? "教师控制棋盘" : "请蓝队选择一格")}</strong><span> · ${isManual ? "一般格读词语；功能格完成造句、对话或改写。" : "电脑红队会自动选择。"}</span></p>
      <div>${winner || isDraw ? `<button class="button button--primary" data-action="next-round">${roundIndex < rounds.length - 1 ? "下一轮" : "再玩一次"} →</button>` : `<button class="text-button" data-action="reset-round">清空选择</button>`}</div>
    </section>
    ${activePrompt ? `<div class="modal-backdrop" role="presentation"><section class="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-title">
      <span class="eyebrow">${promptKindLabel(activePrompt.kind)}练习 · ${activePrompt.seconds} 秒</span>
      <h2 id="task-title">${promptKindTitle(activePrompt.kind)}</h2>
      <p class="task-prompt" lang="zh">${escapeHtml(activePrompt.prompt)}</p>
      ${activePrompt.support ? `<p class="task-support">${escapeHtml(activePrompt.support)}</p>` : ""}
      <div class="prompt-countdown" aria-live="polite"><strong id="prompt-timer">${promptRemaining}</strong><span>秒</span></div>
      <div class="form-actions"><button class="button button--secondary" data-action="skip-prompt">跳过</button><button class="button button--primary" data-action="complete-prompt">完成并占格</button></div>
    </section></div>` : ""}
    ${pendingWinner && !winner ? `<div class="modal-backdrop" role="presentation"><section class="task-modal" role="alertdialog" aria-modal="true" aria-labelledby="win-title">
      <span class="eyebrow">检测到五格连线</span><h2 id="win-title">${teamName(pendingWinner)}可能已经获胜</h2>
      <p>请教师检查口语任务和连线，再确认结果。</p>
      <div class="form-actions"><button class="button button--secondary" data-action="continue-win">继续调整</button><button class="button button--primary" data-action="confirm-win">确认获胜</button></div>
    </section></div>` : ""}
  `, { compact: true });
  bindCommonActions();
  bindGameActions();
  if (activePrompt) startPromptTimer();
}

function getScopeSelection(): ScopeSelection {
  return { mode: "single", lessonIds: selectedLessonId ? [selectedLessonId] : [] };
}

function bindCommonActions(): void {
  document.querySelectorAll<HTMLElement>("[data-action='home']").forEach((button) => button.addEventListener("click", () => navigate("home")));
  document.querySelector<HTMLElement>("[data-action='import']")?.addEventListener("click", () => navigate("import"));
  document.querySelector<HTMLElement>("[data-action='setup']")?.addEventListener("click", () => navigate("setup"));
  document.querySelector<HTMLElement>("[data-action='export']")?.addEventListener("click", exportPack);
  document.querySelector<HTMLElement>("[data-action='reset-content']")?.addEventListener("click", resetContent);
  document.querySelector<HTMLElement>("[data-action='cancel-preview']")?.addEventListener("click", () => { preview = null; renderImport(); });
  document.querySelector<HTMLElement>("[data-action='confirm-import']")?.addEventListener("click", confirmImport);
}

function bindSetupActions(): void {
  document.querySelector<HTMLSelectElement>("#lesson-select")?.addEventListener("change", (event) => {
    selectedLessonId = (event.currentTarget as HTMLSelectElement).value;
    renderSetup();
  });
  document.querySelectorAll<HTMLInputElement>("input[name='legacy-submode']").forEach((input) => input.addEventListener("change", () => {
    legacySubmode = input.value as LegacySubmode;
    renderSetup();
  }));
  document.querySelector<HTMLElement>("[data-action='start-game']")?.addEventListener("click", beginGame);
}

function bindGameActions(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((cell) => cell.addEventListener("click", () => claimCell(Number(cell.dataset.cell))));
  document.querySelector<HTMLElement>("[data-action='new-board']")?.addEventListener("click", () => resetRound(true));
  document.querySelector<HTMLElement>("[data-action='reset-round']")?.addEventListener("click", () => resetRound(false));
  document.querySelector<HTMLElement>("[data-action='next-round']")?.addEventListener("click", nextRound);
  document.querySelector<HTMLElement>("[data-action='complete-prompt']")?.addEventListener("click", completePrompt);
  document.querySelector<HTMLElement>("[data-action='skip-prompt']")?.addEventListener("click", cancelPrompt);
  document.querySelector<HTMLElement>("[data-action='confirm-win']")?.addEventListener("click", confirmLegacyWinner);
  document.querySelector<HTMLElement>("[data-action='continue-win']")?.addEventListener("click", continueLegacyGame);
}

function navigate(next: View): void {
  stopPromptTimer();
  activePrompt = null;
  promptCellIndex = null;
  view = next;
  liveMessage = "";
  if (view === "home") renderHome();
  else if (view === "import") renderImport();
  else if (view === "setup") renderSetup();
  else renderGame();
}

async function handleFileSelect(event: Event): Promise<void> {
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  if (!file) return;
  const error = document.querySelector<HTMLElement>("#import-error");
  try {
    preview = parseContent(await file.text(), file.name);
    const errors = validatePack(preview.pack);
    if (errors.length) throw new Error(errors.join(" "));
    renderImport();
  } catch (reason) {
    if (error) error.textContent = reason instanceof Error ? reason.message : "无法读取文件。";
  }
}

async function confirmImport(): Promise<void> {
  if (!preview) return;
  await savePack(preview.pack);
  pack = preview.pack;
  contentError = "";
  selectedLessonId = pack.lessons.find((lesson) => lesson.active !== false)?.lesson_id ?? "";
  liveMessage = `已为${pack.class_name}保存 ${pack.vocabulary.length} 个词语。`;
  preview = null;
  view = "home";
  renderHome();
}

function exportPack(): void {
  if (!pack) return;
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${pack.class_id || "class"}-content.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function resetContent(): Promise<void> {
  if (!confirm("要清除浏览器中的临时内容并恢复项目内容吗？")) return;
  await clearPack();
  const seed = await loadCommittedSeed();
  pack = seed.pack;
  contentError = seed.error;
  if (pack) selectedLessonId = pack.lessons.find((lesson) => lesson.active !== false)?.lesson_id ?? "";
  else selectedLessonId = "";
  liveMessage = pack ? "已清除临时内容，并重新载入项目内容。" : "已清除临时内容；项目中没有可用的课堂内容。";
  renderHome();
}

function beginGame(): void {
  if (!pack) return;
  const selection = getScopeSelection();
  const chosen = vocabularyForScope(pack, selection);
  const prompts = boardPromptPoolForScope(pack, selection, LEGACY_BOARD_SIDE ** 2);
  rounds = chosen.length ? splitIntoLegacyRounds(chosen) : [[]];
  if (rounds.some((round) => round.length < LEGACY_BOARD_SIDE ** 2) && !prompts.length) return;
  availablePrompts = prompts;
  roundIndex = 0;
  scores = { red: 0, blue: 0 };
  setupRound();
  view = "game";
  renderGame();
}

function setupRound(incrementSeed = true): void {
  if (incrementSeed) boardSeed += 1;
  const round = rounds[roundIndex] ?? [];
  const words = createLegacyBoardVocabulary(round, boardSeed);
  const cellSlots = seededShuffle(
    Array.from({ length: LEGACY_BOARD_SIDE ** 2 }, (_, index) => index),
    boardSeed ^ 0x51f15e
  );
  boardVocabulary = Array<VocabularyItem | undefined>(LEGACY_BOARD_SIDE ** 2).fill(undefined);
  words.forEach((item, index) => {
    boardVocabulary[cellSlots[index]] = item;
  });
  owners = Array(LEGACY_BOARD_SIDE ** 2).fill(null);
  winner = null;
  pendingWinner = null;
  activePrompt = null;
  promptCellIndex = null;
  stopPromptTimer();
  functionCells = new Map();
  const functionCount = Math.max(0, LEGACY_BOARD_SIDE ** 2 - words.length);
  fillFunctionPrompts(availablePrompts, functionCount, boardSeed ^ 0xf00d).forEach((prompt, index) => {
    functionCells.set(cellSlots[words.length + index], prompt);
  });
}

function claimCell(index: number): void {
  if (index < 0 || index >= LEGACY_BOARD_SIDE ** 2 || winner || pendingWinner) return;
  const prompt = functionCells.get(index);
  if (prompt && owners[index] === null) {
    activePrompt = prompt;
    promptCellIndex = index;
    promptRemaining = prompt.seconds;
    renderGame();
    return;
  }
  applyLegacyClaim(index);
}

function applyLegacyClaim(index: number): void {
  if (legacySubmode === "classroom") {
    owners[index] = cycleManualOwner(owners[index]);
    pendingWinner = detectWinner(owners, LEGACY_BOARD_SIDE, LEGACY_WIN_LENGTH);
    liveMessage = owners[index]
      ? `第 ${index + 1} 格属于${teamName(owners[index] as Team)}。`
      : `第 ${index + 1} 格已恢复为空白。`;
    renderGame();
    return;
  }
  if (owners[index]) return;
  owners[index] = "blue";
  pendingWinner = detectWinner(owners, LEGACY_BOARD_SIDE, LEGACY_WIN_LENGTH);
  if (!pendingWinner) {
    const aiIndex = chooseSoloAiMove(owners, LEGACY_BOARD_SIDE, boardSeed + owners.filter(Boolean).length, "red");
    if (aiIndex !== null) {
      owners[aiIndex] = "red";
      pendingWinner = detectWinner(owners, LEGACY_BOARD_SIDE, LEGACY_WIN_LENGTH);
      liveMessage = `电脑红队选择了第 ${aiIndex + 1} 格。`;
    }
  }
  renderGame();
}

function completePrompt(): void {
  const index = promptCellIndex;
  stopPromptTimer();
  activePrompt = null;
  promptCellIndex = null;
  if (index !== null) applyLegacyClaim(index);
}

function cancelPrompt(): void {
  stopPromptTimer();
  activePrompt = null;
  promptCellIndex = null;
  liveMessage = "已跳过功能格，格子仍为空白。";
  renderGame();
}

function confirmLegacyWinner(): void {
  if (!pendingWinner) return;
  winner = pendingWinner;
  pendingWinner = null;
  scores[winner] += 1;
  liveMessage = `教师已确认${teamName(winner)}获胜。`;
  renderGame();
}

function continueLegacyGame(): void {
  pendingWinner = null;
  liveMessage = "暂不确认获胜，继续调整棋盘。";
  renderGame();
}

function resetRound(shuffle: boolean): void {
  if (shuffle) boardSeed += 1;
  setupRound(false);
  liveMessage = shuffle ? "棋盘已经重新排列。" : "已经清空所有选择。";
  renderGame();
}

function nextRound(): void {
  if (roundIndex < rounds.length - 1) roundIndex += 1;
  else {
    roundIndex = 0;
    scores = { red: 0, blue: 0 };
  }
  setupRound();
  renderGame();
}

function startPromptTimer(): void {
  stopPromptTimer();
  if (!activePrompt || promptRemaining <= 0) return;
  promptTimerId = window.setInterval(() => {
    promptRemaining = Math.max(0, promptRemaining - 1);
    const display = document.querySelector<HTMLElement>("#prompt-timer");
    if (display) display.textContent = String(promptRemaining);
    if (promptRemaining === 0) {
      stopPromptTimer();
      liveMessage = "功能格时间已到。";
    }
  }, 1000);
}

function stopPromptTimer(): void {
  if (promptTimerId !== null) window.clearInterval(promptTimerId);
  promptTimerId = null;
}

async function initialize(): Promise<void> {
  renderHome();
  try {
    const isOfflineBuild = Boolean((globalThis as typeof globalThis & { __OFFLINE_SEED_ONLY__?: boolean }).__OFFLINE_SEED_ONLY__);
    const resolution = isOfflineBuild
      ? { ...(await loadCommittedSeed()), source: "project" as const }
      : await resolveContentSource(loadPack);
    pack = resolution.pack;
    contentError = resolution.error;
    if (pack) selectedLessonId = pack.lessons.find((lesson) => lesson.active !== false)?.lesson_id ?? "";
  } catch {
    const seed = await loadCommittedSeed();
    pack = seed.pack;
    contentError = seed.error;
    liveMessage = "无法读取浏览器中的临时内容，已经改用项目内容。";
  }
  renderHome();
}

void initialize();
