#!/usr/bin/env node
/* Rendered OpenSlide QA. Measures every visible glyph, image, and painted box.
 * Reports are versioned, source-bound, and reverified in-browser before sync.
 */
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {pathToFileURL} = require('url');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CANVAS = {width: 1920, height: 1080};
const POLICY = {
  body_inset_px: 96,
  image_inset_px: 64,
  footer_clearance_px: 64,
  minimum_text_font_px: 80 / 3,
  critical_text_font_px: 45,
  known_role_minimums_px: {
    h1: 45, h2: 40, lesson_tag: 40, activity_label: 30,
    route_range: 30, report_example_label: 40, page_footer: 80 / 3,
    question_number: 80 / 3
  }
};
const REQUIRED_NEGATIVE_NAMES = [
  'footer-clearance',
  'orphan-line',
  'arbitrary-offcanvas-content',
  'arbitrary-offcanvas-painted-box',
  'tiny-critical-text',
  'transformed-tiny-critical-text',
  'wrong-font-family',
  'missing-footer',
  'missing-required-structure'
];
const PROTECTED_OUTPUT_SEGMENTS = new Set(['00-source', '20-approved', '30-qa', '40-release', '90-archive', 'archive']);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function projectRelative(filePath) {
  const resolved = path.resolve(filePath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('Path must be inside the project: ' + filePath);
  }
  return relative.split(path.sep).join('/');
}

function existingRealPathInsideProject(filePath) {
  const resolved = path.resolve(filePath);
  projectRelative(resolved);
  const real = fs.realpathSync(resolved);
  projectRelative(real);
  return real;
}

function assertAllowedOutputPath(dir) {
  const relative = path.relative(PROJECT_ROOT, dir);
  const segments = relative.split(path.sep).filter(Boolean);
  if (segments.some(segment => PROTECTED_OUTPUT_SEGMENTS.has(segment))) {
    throw new Error('Rendered-layout output cannot be written under protected project paths: ' + dir);
  }
  const agentRun = segments[0] === '.agent' && segments[1] === 'runs' && segments.length >= 3;
  const designIndex = segments.indexOf('10-design');
  const lessonDesign = segments[0] === 'lessons' && designIndex >= 3 && designIndex < segments.length - 1;
  if (!agentRun && !lessonDesign) {
    throw new Error('Rendered-layout output must be under .agent/runs/ or a lesson 10-design descendant: ' + dir);
  }
}

function safeOutputDirectory(dir) {
  const resolved = path.resolve(dir);
  projectRelative(resolved);
  assertAllowedOutputPath(resolved);
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('Cannot resolve output directory');
    ancestor = parent;
  }
  const realAncestor = existingRealPathInsideProject(ancestor);
  const realTarget = path.resolve(realAncestor, path.relative(ancestor, resolved));
  projectRelative(realTarget);
  assertAllowedOutputPath(realTarget);
  if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
    throw new Error('Expected an output directory: ' + dir);
  }
  return resolved;
}

function safeOutputFile(filePath) {
  const resolved = path.resolve(filePath);
  projectRelative(resolved);
  existingRealPathInsideProject(resolved);
  if (!fs.statSync(resolved).isFile()) throw new Error('Expected a file: ' + filePath);
  return resolved;
}

function normalizeContract(value, rawHash) {
  if (value === undefined) return {contract: null, hash: null};
  if (!value || typeof value !== 'object' || !Array.isArray(value.pages)) {
    throw new Error('Contract must be a JSON object with a pages array');
  }
  const seen = new Set();
  const allowedRoles = new Set(['cover', 'route', 'comic', 'discussion', 'discussion_question', 'discussion_support', 'report', 'activity', 'content']);
  const pages = value.pages.map((item, index) => {
    if (!item || typeof item.id !== 'string' || !item.id || typeof item.role !== 'string' || !item.role) {
      throw new Error('Contract page ' + index + ' needs non-empty id and role');
    }
    if (!allowedRoles.has(item.role)) throw new Error('Unknown contract role at page ' + index + ': ' + item.role);
    if (seen.has(item.id)) throw new Error('Duplicate contract page id: ' + item.id);
    seen.add(item.id);
    if (!Object.prototype.hasOwnProperty.call(item, 'expected_text')) {
      throw new Error('Contract page ' + index + ' must include expected_text');
    }
    const expectedText = item.expected_text;
    if (typeof expectedText === 'string') {
      if (!expectedText.trim()) throw new Error('Contract expected_text string must be non-empty');
    } else if (!Array.isArray(expectedText) || !expectedText.length || expectedText.some(text => typeof text !== 'string' || !text)) {
      throw new Error('Contract expected_text must be a non-empty string or an array of non-empty strings');
    }
    if (item.footer_exempt !== undefined && typeof item.footer_exempt !== 'boolean') {
      throw new Error('Contract footer_exempt must be boolean');
    }
    return {
      id: item.id,
      role: item.role,
      expected_text: expectedText,
      footer_exempt: item.footer_exempt === true
    };
  });
  return {contract: {pages}, hash: rawHash || null};
}

function readContract(filePath) {
  if (!filePath) return normalizeContract(undefined);
  const file = safeOutputFile(filePath);
  const raw = fs.readFileSync(file);
  const parsed = JSON.parse(raw.toString('utf8'));
  return normalizeContract(parsed, sha256(raw));
}

function extractAssetReferences(html) {
  const found = new Set();
  for (const match of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi)) {
    found.add(match[2].trim());
  }
  for (const match of html.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/gi)) {
    const value = (match[2] || match[3] || '').trim();
    if (value && !value.startsWith('#')) found.add(value);
  }
  return [...found].sort();
}

function dataUriBytes(uri) {
  const match = uri.match(/^data:([^,]*?),(.*)$/s);
  if (!match) throw new Error('Invalid data image URI');
  const metadata = match[1];
  const payload = match[2];
  return /;base64(?:;|$)/i.test(metadata)
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');
}

function assetManifest(deckPath, html) {
  const base = path.dirname(deckPath);
  const assets = [];
  for (const source of extractAssetReferences(html)) {
    if (/^data:/i.test(source)) {
      const bytes = dataUriBytes(source);
      assets.push({path: 'data:' + sha256(bytes), bytes: bytes.length, sha256: sha256(bytes)});
      continue;
    }
    if (/^(?:https?:|blob:|javascript:)/i.test(source)) {
      throw new Error('Visual assets must be project-local: ' + source);
    }
    let filePath;
    if (/^file:/i.test(source)) {
      filePath = new URL(source).pathname;
    } else {
      const pathname = decodeURIComponent(source.split(/[?#]/, 1)[0]);
      filePath = path.isAbsolute(pathname) ? pathname : path.resolve(base, pathname);
    }
    const real = existingRealPathInsideProject(filePath);
    const bytes = fs.readFileSync(real);
    assets.push({
      path: path.relative(base, real).split(path.sep).join('/'),
      bytes: bytes.length,
      sha256: sha256(bytes)
    });
  }
  assets.sort((a, b) => a.path.localeCompare(b.path));
  return assets;
}

/* This function is serializable by Playwright and can also be passed to iframe.evaluate(). */
function measure(policy) {
  policy = policy || {};
  const issues = [];
  const issue = (kind, details) => issues.push(Object.assign({kind}, details || {}));
  const round = n => Math.round(n * 1000) / 1000;
  const finite = n => Number.isFinite(n);
  const rawFrame = document.querySelector('.os-frame');
  const frameRect = rawFrame ? rawFrame.getBoundingClientRect() : null;
  const scale = frameRect && frameRect.width / 1920;
  const pageElements = [...document.querySelectorAll('.os-page')];
  const visible = element => {
    if (!element || !element.getBoundingClientRect) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (Number.parseFloat(style.opacity || '1') <= 0) return false;
    }
    return true;
  };
  const visibleTextStyle = element => {
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (Number.parseFloat(style.opacity || '1') <= 0 || style.contentVisibility === 'hidden') return false;
    }
    return true;
  };
  const textTransformScale = element => {
    let factor = 1;
    for (let node = element; node && node !== rawFrame; node = node.parentElement) {
      const style = getComputedStyle(node);
      const zoom = Number.parseFloat(style.zoom);
      if (Number.isFinite(zoom) && zoom > 0) factor *= zoom;
      if (style.transform && style.transform !== 'none') {
        try {
          const matrix = new DOMMatrixReadOnly(style.transform);
          const scale = Math.min(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
          if (Number.isFinite(scale) && scale > 0) factor *= scale;
        } catch (_) {
          return 0;
        }
      }
    }
    return factor;
  };
  const activePages = pageElements.filter(visible);
  const requestedPage = policy.page_id
    ? pageElements.find(candidate => candidate.getAttribute('data-osd-stable-id') === policy.page_id)
    : null;
  const page = policy.pageElement || requestedPage || activePages[0] || null;
  if (!rawFrame || !frameRect || !finite(scale) || scale <= 0) {
    issue('missing-structure', {element: '.os-frame'});
  }
  if (!page) {
    issue('missing-structure', {element: '.os-page'});
    return {
      index: null, page: null, id: null, role: policy.role || 'unknown',
      structure: {frame: !!rawFrame, page: false, visible_page_count: activePages.length},
      coverage: {visible_element_count: 0, painted_box_count: 0, text_run_count: 0, glyph_count: 0, image_count: 0, loaded_image_count: 0, finite: false, footer: null, content_bottom: null, minimum_footer_gap: null},
      text_runs: [], painted_boxes: [], images: [], issues
    };
  }

  const index = Number.parseInt(page.getAttribute('data-idx') || '', 10);
  const id = page.getAttribute('data-osd-stable-id') || '';
  const sourceClasses = new Set(String(page.className || '').split(/\s+/));
  const inferredRole = sourceClasses.has('comic-page') ? 'comic'
    : sourceClasses.has('discussion') ? 'discussion'
      : page.querySelector('.route') ? 'route'
        : page.querySelector('.report-phrase') ? 'report'
          : sourceClasses.has('activity') ? 'activity'
            : index === 0 ? 'cover' : 'content';
  const role = policy.role || inferredRole;
  const allowedRoles = new Set(['cover', 'route', 'comic', 'discussion', 'discussion_question', 'discussion_support', 'report', 'activity', 'content']);
  if (!allowedRoles.has(role)) issue('unknown-role', {role});
  const structuralRole = role === 'discussion_question' || role === 'discussion_support' ? 'discussion' : role;
  if (policy.role && structuralRole !== inferredRole) issue('role-mismatch', {expected: policy.role, inferred: inferredRole});
  const frameX = frameRect ? frameRect.x : 0;
  const frameY = frameRect ? frameRect.y : 0;
  const toCanvasRect = element => {
    const rect = element.getBoundingClientRect();
    return {
      x: round((rect.left - frameX) / scale),
      y: round((rect.top - frameY) / scale),
      right: round((rect.right - frameX) / scale),
      bottom: round((rect.bottom - frameY) / scale),
      width: round(rect.width / scale),
      height: round(rect.height / scale)
    };
  };
  const pageText = (page.innerText || page.textContent || '').replace(/\s+/g, ' ').trim();
  const bodyInset = Number.isFinite(policy.body_inset_px) ? policy.body_inset_px : 96;
  const imageInset = Number.isFinite(policy.image_inset_px) ? policy.image_inset_px : 64;
  const footerClearance = Number.isFinite(policy.footer_clearance_px) ? policy.footer_clearance_px : 64;
  const minTextFont = Number.isFinite(policy.minimum_text_font_px) ? policy.minimum_text_font_px : 80 / 3;
  const criticalFont = Number.isFinite(policy.critical_text_font_px) ? policy.critical_text_font_px : 45;
  const criticalSelectors = [
    '.question', '.party-prompt', '.question-card', '.listen-strong',
    '.paired-card strong', '.activity-instruction', '.party-close',
    '.report-phrase p', '.level p', '.clothes-profile'
  ];
  const roleMinimums = Object.assign({
    h1: 45, h2: 40, lesson_tag: 40, activity_label: 30,
    route_range: 30, report_example_label: 40, page_footer: 80 / 3,
    question_number: 80 / 3
  }, policy.known_role_minimums_px || {});
  const hasSelector = (element, selector) => {
    try { return element.matches(selector) || !!element.closest(selector); } catch (_) { return false; }
  };
  const isFooterSemantic = element => element.matches('footer,.page-footer,[data-osd-footer]');
  let footerCandidates = [...page.querySelectorAll('footer,.page-footer,[data-osd-footer]')].filter(visible);
  let footer = footerCandidates[0] || null;
  let footerKind = footer ? 'semantic' : null;
  if (footerCandidates.length > 1) issue('duplicate-footer', {count: footerCandidates.length});
  if (!footer) {
    footer = [...page.querySelectorAll('div')].find(element => {
      if (!visible(element) || element.children.length < 2) return false;
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      const rect = toCanvasRect(element);
      return text.includes('博雅汉语') && /\b\d+\s*\/\s*\d+\b/.test(text) && rect.y > 840 && rect.height < 160;
    }) || null;
    if (footer) footerKind = 'brand-page-counter';
  }
  let footerTop = footer ? toCanvasRect(footer).y : null;
  let syntheticFooter = false;
  const routeExempt = role === 'route' && (policy.footer_exempt !== false);
  if (!footer && routeExempt) {
    footerTop = 1009;
    footerKind = 'route-bottom-reserve';
    syntheticFooter = true;
  }
  if (!footer && !routeExempt) issue('missing-footer', {role});
  const footerRect = footer ? toCanvasRect(footer) : null;
  const inFooter = element => !!footer && (footer === element || footer.contains(element));
  if (footer && footerRect && (!finite(footerRect.y) || !finite(footerRect.bottom) || footerRect.y < 0 || footerRect.bottom > 1080)) {
    issue('footer-bounds', {rect: footerRect});
  }
  if (activePages.length !== 1 || activePages[0] !== page) {
    issue('visible-page-count', {count: activePages.length, active_id: activePages[0] && activePages[0].dataset.osdStableId});
  }
  if (!Number.isInteger(index) || index < 0) issue('page-index', {value: page.getAttribute('data-idx')});
  if (!id) issue('page-id', {});
  if (pageText.length === 0) issue('missing-coverage', {what: 'visible page text'});
  const frameAspect = frameRect ? frameRect.width / frameRect.height : NaN;
  if (!finite(frameAspect) || Math.abs(frameAspect - (1920 / 1080)) > 0.002) {
    issue('canvas-size', {width: frameRect && round(frameRect.width), height: frameRect && round(frameRect.height)});
  }

  const visibleElements = [...page.querySelectorAll('*')].filter(visible);
  const allGlyphs = [];
  const textRuns = [];
  const blockGlyphs = new Map();
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, {granularity: 'grapheme'})
    : null;
  const candidateSelector = 'p,h1,h2,.question-card,.listen-strong,.paired-card strong,.activity-instruction,.party-close,.report-phrase,.level,.clothes-profile,.route-range,.lesson-tag,.activity-label,.page-footer,footer';
  const getSegments = text => segmenter
    ? [...segmenter.segment(text)].map(item => ({segment: item.segment, index: item.index}))
    : Array.from(text).map((segment, index) => ({segment, index}));
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    const text = textNode.textContent || '';
    if (!text.trim()) continue;
    const parent = textNode.parentElement;
    if (!parent || !visibleTextStyle(parent)) continue;
    const style = getComputedStyle(parent);
    const fontPx = Number.parseFloat(style.fontSize);
    const effectiveFontPx = fontPx * textTransformScale(parent);
    if (!finite(fontPx) || !finite(effectiveFontPx)) issue('non-finite-font', {text: text.slice(0, 80)});
    const runGlyphs = [];
    let actualGlyphCount = 0;
    const range = document.createRange();
    for (const part of getSegments(text)) {
      if (!part.segment || /^\s+$/u.test(part.segment) || /^\p{Cf}+$/u.test(part.segment)) continue;
      const start = part.index;
      const end = start + part.segment.length;
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
      if (!rects.length) continue;
      actualGlyphCount += 1;
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const rect of rects) {
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
      }
      const glyph = {
        text: part.segment,
        x: round((left - frameX) / scale),
        y: round((top - frameY) / scale),
        right: round((right - frameX) / scale),
        bottom: round((bottom - frameY) / scale)
      };
      runGlyphs.push(glyph);
      allGlyphs.push(Object.assign({element: parent}, glyph));
    }
    if (!runGlyphs.length) {
      issue('unmeasured-visible-text', {text: text.slice(0, 80), tag: parent.tagName.toLowerCase()});
      continue;
    }
    let bounds = {
      x: Math.min(...runGlyphs.map(g => g.x)),
      y: Math.min(...runGlyphs.map(g => g.y)),
      right: Math.max(...runGlyphs.map(g => g.right)),
      bottom: Math.max(...runGlyphs.map(g => g.bottom))
    };
    bounds.width = round(bounds.right - bounds.x);
    bounds.height = round(bounds.bottom - bounds.y);
    const classes = (parent.className && parent.className.baseVal !== undefined)
      ? parent.className.baseVal : (parent.className || '');
    const run = {
      text: text.replace(/\s+/g, ' ').trim(),
      tag: parent.tagName.toLowerCase(),
      classes: String(classes).trim(),
      glyph_count: actualGlyphCount,
      bounds,
      font_px: round(fontPx),
      effective_font_px: round(effectiveFontPx),
      font_family: style.fontFamily,
      color: style.color,
      weight: style.fontWeight
    };
    textRuns.push(run);
    const isQuestionNumber = hasSelector(parent, '.q-mark');
    const candidate = isQuestionNumber ? null : parent.closest(candidateSelector);
    if (candidate) {
      if (!blockGlyphs.has(candidate)) blockGlyphs.set(candidate, []);
      blockGlyphs.get(candidate).push(...runGlyphs);
    }

    const symbolOnly = !/[\p{Script=Han}A-Za-z0-9]/u.test(text);
    const familyParts = style.fontFamily.split(',').map(value => value.trim().toLowerCase().replace(/["']/g, ''));
    const family = familyParts.join(',');
    const hasHan = /[\p{Script=Han}]/u.test(text);
    const hasLatinOrDigits = /[A-Za-z0-9]/.test(text);
    const knownRequestedFamily = /^(?:kai\s*ti|stkaiti|楷体|times new roman)$/i.test(familyParts[0] || '');
    if (!symbolOnly && !knownRequestedFamily) {
      issue('font-family', {text: run.text.slice(0, 80), family: style.fontFamily, expected: 'KaiTi or Times New Roman as first project family'});
    }
    if (!symbolOnly && hasHan && !/(?:kai\s*ti|stkaiti|楷体)/i.test(family)) {
      issue('font-family', {text: run.text.slice(0, 80), family: style.fontFamily, expected: 'KaiTi'});
    }
    if (!symbolOnly && hasLatinOrDigits && !/times\s*new\s*roman/i.test(family)) {
      issue('font-family', {text: run.text.slice(0, 80), family: style.fontFamily, expected: 'Times New Roman'});
    }
    let minimum = minTextFont;
    if (hasSelector(parent, 'h1')) minimum = Math.max(minimum, roleMinimums.h1);
    if (hasSelector(parent, 'h2')) minimum = Math.max(minimum, roleMinimums.h2);
    if (hasSelector(parent, '.lesson-tag')) minimum = Math.max(minimum, roleMinimums.lesson_tag);
    if (hasSelector(parent, '.activity-label')) minimum = Math.max(minimum, roleMinimums.activity_label);
    if (hasSelector(parent, '.route-range')) minimum = Math.max(minimum, roleMinimums.route_range);
    if (hasSelector(parent, '.report-example-label')) minimum = Math.max(minimum, roleMinimums.report_example_label);
    if (hasSelector(parent, '.page-footer,footer')) minimum = Math.max(minimum, roleMinimums.page_footer);
    if (isQuestionNumber) minimum = Math.max(minimum, roleMinimums.question_number);
    if (!isQuestionNumber && criticalSelectors.some(selector => hasSelector(parent, selector))) minimum = Math.max(minimum, criticalFont);
    if (effectiveFontPx < minimum) issue('font-size', {text: run.text.slice(0, 80), font_px: round(fontPx), effective_font_px: round(effectiveFontPx), minimum_px: round(minimum), tag: run.tag, classes: run.classes});

    for (const glyph of runGlyphs) {
      for (const [key, value] of Object.entries(glyph)) {
        if (key === 'text') continue;
        if (!finite(value)) issue('non-finite-geometry', {what: 'glyph', key, text: run.text.slice(0, 80)});
      }
      if (glyph.x < -1 || glyph.y < -1 || glyph.right > 1921 || glyph.bottom > 1081) {
        issue('canvas-bounds', {what: 'text', text: run.text.slice(0, 60), glyph});
      }
      if (!inFooter(parent) && (glyph.x < bodyInset - 2 || glyph.right > 1920 - bodyInset + 2)) {
        issue('body-bounds', {what: 'text', text: run.text.slice(0, 60), glyph});
      }
    }
  }

  for (const [block, glyphs] of blockGlyphs.entries()) {
    const lines = [];
    for (const glyph of glyphs) {
      let line = lines.find(item => Math.abs(item.y - glyph.y) < 10);
      if (!line) {
        line = {y: glyph.y, glyphs: []};
        lines.push(line);
      }
      line.glyphs.push(glyph);
    }
    lines.sort((a, b) => a.y - b.y);
    for (const line of lines) {
      line.glyphs.sort((a, b) => a.x - b.x);
      line.text = line.glyphs.map(g => g.text).join('');
      if (lines.length > 1) {
        if (line.text.length <= 2 || /^[/／_。，、？！；：]+$/.test(line.text)) {
          issue('orphan-line', {text: line.text, block: (block.innerText || block.textContent || '').slice(0, 100)});
        }
        if (/^[，。、？！；：/／]/.test(line.text)) issue('leading-punctuation', {text: line.text});
      }
    }
    const fullText = lines.map(line => line.text).join('');
    for (const token of ['越南盾','为什么','地点','复述','衣服','生日','餐厅/咖啡馆/地方']) {
      const at = fullText.indexOf(token);
      if (at >= 0) {
        const glyphsInText = lines.flatMap(line => line.glyphs);
        const tokenGlyphs = glyphsInText.slice(at, at + token.length);
        if (tokenGlyphs.length === token.length && Math.max(...tokenGlyphs.map(g => g.y)) - Math.min(...tokenGlyphs.map(g => g.y)) > 5) {
          issue('split-word', {token, block: fullText.slice(0, 100)});
        }
      }
    }
  }

  const imageElements = [...page.querySelectorAll('img')].filter(visible);
  const imageEntries = imageElements.map(element => {
    const rect = toCanvasRect(element);
    const item = {
      src: element.getAttribute('src') || '',
      alt: element.getAttribute('alt') || '',
      loaded: element.complete && element.naturalWidth > 0,
      natural_width: element.naturalWidth,
      natural_height: element.naturalHeight,
      rect
    };
    if (!item.loaded) issue('missing-image', {src: item.src, alt: item.alt});
    if (rect.x < -1 || rect.y < -1 || rect.right > 1921 || rect.bottom > 1081) {
      issue('canvas-bounds', {what: 'image', src: item.src, rect});
    }
    if (rect.x < imageInset - 2 || rect.right > 1920 - imageInset + 2) {
      issue('body-bounds', {what: 'image', src: item.src, rect});
    }
    return {element, item};
  });
  const images = imageEntries.map(entry => entry.item);

  const isTransparent = color => {
    if (!color || color === 'transparent') return true;
    const match = color.match(/rgba?\((.*)\)/i);
    if (!match) return false;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean);
    const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
    return Number.isFinite(alpha) && alpha <= 0;
  };
  const isPainted = element => {
    const style = getComputedStyle(element);
    if (!isTransparent(style.backgroundColor) || style.backgroundImage !== 'none' || style.boxShadow !== 'none') return true;
    for (const side of ['Top','Right','Bottom','Left']) {
      const width = Number.parseFloat(style['border' + side + 'Width'] || '0');
      const color = style['border' + side + 'Color'];
      if (width > 0 && !isTransparent(color)) return true;
    }
    const outlineWidth = Number.parseFloat(style.outlineWidth || '0');
    if (outlineWidth > 0 && style.outlineStyle !== 'none' && !isTransparent(style.outlineColor)) return true;
    if (element.namespaceURI === 'http://www.w3.org/2000/svg') {
      const fill = style.fill || 'none';
      const stroke = style.stroke || 'none';
      const strokeWidth = Number.parseFloat(style.strokeWidth || '0');
      if (fill !== 'none' && !isTransparent(fill)) return true;
      if (stroke !== 'none' && strokeWidth > 0 && !isTransparent(stroke)) return true;
    }
    return ['CANVAS','VIDEO','IFRAME','OBJECT','EMBED'].includes(element.tagName);
  };
  const structuralBoxes = new Set([page, rawFrame, document.body, document.documentElement]);
  const paintedBoxes = [];
  const paintedBoxEntries = [];
  for (const element of visibleElements) {
    if (element.tagName === 'IMG' || structuralBoxes.has(element) || element.classList.contains('route') || element.classList.contains('activity')) continue;
    if (!isPainted(element)) continue;
    const rect = toCanvasRect(element);
    const classes = (element.className && element.className.baseVal !== undefined)
      ? element.className.baseVal : (element.className || '');
    const box = {
      tag: element.tagName.toLowerCase(),
      classes: String(classes).trim(),
      rect,
      background_color: getComputedStyle(element).backgroundColor,
      background_image: getComputedStyle(element).backgroundImage,
      border_radius: getComputedStyle(element).borderRadius,
      box_shadow: getComputedStyle(element).boxShadow
    };
    paintedBoxes.push(box);
    paintedBoxEntries.push({element, box});
    const isFullCanvasBackground = Math.abs(rect.x) <= 1 && Math.abs(rect.y) <= 1 &&
      Math.abs(rect.right - 1920) <= 1 && Math.abs(rect.bottom - 1080) <= 1 &&
      !isTransparent(getComputedStyle(element).backgroundColor);
    if ([rect.x, rect.y, rect.right, rect.bottom, rect.width, rect.height].some(value => !finite(value))) {
      issue('non-finite-geometry', {what: 'painted-box', tag: box.tag, classes: box.classes});
    }
    if (rect.x < -1 || rect.y < -1 || rect.right > 1921 || rect.bottom > 1081) {
      issue('canvas-bounds', {what: 'painted-box', tag: box.tag, classes: box.classes, rect});
    }
    if (!isFullCanvasBackground && !inFooter(element) && (rect.bottom > 0) && (rect.x < -1 || rect.right > 1921)) {
      issue('body-bounds', {what: 'painted-box', tag: box.tag, classes: box.classes, rect});
    }
    if (!isFullCanvasBackground && !inFooter(element) && (rect.x < bodyInset - 2 || rect.right > 1920 - bodyInset + 2)) {
      issue('body-bounds', {what: 'painted-box-inset', tag: box.tag, classes: box.classes, rect});
    }
    if (isFullCanvasBackground) paintedBoxEntries.pop();
  }
  const pseudoContentBottoms = [];
  for (const element of visibleElements) {
    for (const pseudo of ['::before','::after','::marker']) {
      const style = getComputedStyle(element, pseudo);
      const content = style.content;
      if (!content || content === 'none' || content === 'normal') continue;
      const textContent = content.replace(/^(["'])(.*)\1$/, '$2').trim();
      const hasPaint = !isTransparent(style.backgroundColor) || style.backgroundImage !== 'none' ||
        style.boxShadow !== 'none' || ['Top','Right','Bottom','Left'].some(side => {
          const width = Number.parseFloat(style['border' + side + 'Width'] || '0');
          return width > 0 && style['border' + side + 'Style'] !== 'none' && !isTransparent(style['border' + side + 'Color']);
        });
      if (!textContent && !hasPaint) continue;
      const rect = toCanvasRect(element);
      const classes = (element.className && element.className.baseVal !== undefined)
        ? element.className.baseVal : (element.className || '');
      paintedBoxes.push({tag: element.tagName.toLowerCase(), classes: String(classes).trim(), pseudo, rect,
        background_color: style.backgroundColor, background_image: style.backgroundImage,
        border_radius: style.borderRadius, box_shadow: style.boxShadow});
      if (textContent || style.position === 'absolute' || style.position === 'fixed') {
        issue('unmeasured-generated-content', {pseudo, text: textContent.slice(0,80), tag: element.tagName.toLowerCase()});
      }
      if ([rect.x, rect.y, rect.right, rect.bottom, rect.width, rect.height].some(value => !finite(value))) {
        issue('non-finite-geometry', {what: 'pseudo-painted-box', pseudo, tag: element.tagName.toLowerCase()});
      }
      if (rect.x < -1 || rect.y < -1 || rect.right > 1921 || rect.bottom > 1081) {
        issue('canvas-bounds', {what: 'pseudo-painted-box', pseudo, tag: element.tagName.toLowerCase(), rect});
      }
      if (!inFooter(element)) pseudoContentBottoms.push(rect.bottom);
      if (!inFooter(element) && (rect.x < bodyInset - 2 || rect.right > 1920 - bodyInset + 2)) {
        issue('body-bounds', {what: 'pseudo-painted-box-inset', pseudo, tag: element.tagName.toLowerCase(), rect});
      }
    }
  }

  const contentGlyphs = allGlyphs.filter(glyph => !inFooter(glyph.element));
  const contentImages = imageEntries.filter(entry => !inFooter(entry.element)).map(entry => entry.item);
  const contentBoxes = paintedBoxEntries.filter(entry => !inFooter(entry.element)).map(entry => entry.box);
  let contentBottomValues = contentGlyphs.map(glyph => glyph.bottom)
    .concat(contentImages.map(image => image.rect.bottom))
    .concat(contentBoxes.map(box => box.rect.bottom))
    .concat(pseudoContentBottoms);
  contentBottomValues = contentBottomValues.filter(value => finite(value));
  const contentBottom = contentBottomValues.length ? round(Math.max(...contentBottomValues)) : null;
  let minimumFooterGap = footerTop !== null && contentBottom !== null ? round(footerTop - contentBottom) : null;
  if (!finite(footerTop) || !finite(minimumFooterGap) || contentBottom === null) {
    issue('incomplete-coverage', {footer_top: footerTop, content_bottom: contentBottom, minimum_footer_gap: minimumFooterGap});
  } else if (minimumFooterGap < footerClearance) {
    issue('footer-clearance', {footer_top: footerTop, content_bottom: contentBottom, gap: minimumFooterGap, required: footerClearance});
  }

  const header = page.querySelector('header,.page-header,[data-osd-header]');
  const main = page.querySelector('main,[data-osd-main]');
  const heading = page.querySelector('h1');
  const route = page.querySelector('.route');
  const bodyCandidates = [...page.children].filter(element => element !== footer && !element.matches('header,.page-header,[data-osd-header]'));
  const visibleBody = bodyCandidates.some(element => visible(element) && ((element.innerText || element.textContent || '').trim() || element.querySelector('img')));
  const structure = {
    frame: !!rawFrame,
    page: true,
    visible_page_count: activePages.length,
    heading: !!heading && visible(heading),
    header: !!header && visible(header),
    main: !!main && visible(main),
    visible_body: visibleBody,
    footer: !!footer,
    footer_kind: footerKind,
    footer_top: footerTop,
    synthetic_footer: syntheticFooter
  };
  const requireStructure = (condition, element) => {
    if (!condition) issue('missing-structure', {role, element});
  };
  requireStructure(!!rawFrame, '.os-frame');
  requireStructure(activePages.length === 1 && activePages[0] === page, 'one visible .os-page');
  requireStructure(id.length > 0, 'data-osd-stable-id');
  requireStructure(Number.isInteger(index) && index >= 0, 'data-idx');
  requireStructure(pageText.length > 0, 'visible text');
  if (role === 'cover') {
    requireStructure(!!heading && visible(heading), 'cover h1');
    requireStructure(!!footer, 'cover footer');
  } else if (role === 'route') {
    requireStructure(!!route && !!route.querySelector('h1') && route.querySelectorAll('.route-card').length > 0, '.route h1 and .route-card');
  } else if (role === 'comic') {
    requireStructure(!!page.querySelector('header') && !!page.querySelector('main') && !!footer && imageElements.length === 1, 'comic header/main/footer and one image');
  } else if (structuralRole === 'discussion') {
    requireStructure(!!page.querySelector('header') && !!page.querySelector('main') && !!footer, 'discussion header/main/footer');
  } else if (role === 'report') {
    requireStructure(!!page.querySelector('header') && !!page.querySelector('.report-phrase') && !!footer, 'report header/model/footer');
  } else {
    requireStructure(!!heading || !!header, 'content header or h1');
    requireStructure(visibleBody, 'visible content body');
    requireStructure(!!footer, 'content footer');
  }
  const expectedText = policy.expected_text;
  const compactText = text => String(text).normalize('NFC').replace(/\s+/g, '');
  if (typeof expectedText === 'string') {
    if (compactText(pageText) !== compactText(expectedText)) {
      issue('expected-text', {mode: 'exact-normalized-page-text', expected: expectedText, actual: pageText});
    }
  } else {
    let searchStart = 0;
    for (const expected of expectedText || []) {
      const expectedCompact = compactText(expected);
      const foundAt = compactText(pageText).indexOf(expectedCompact, searchStart);
      if (foundAt < 0) issue('expected-text', {missing: expected, mode: 'ordered-fragments'});
      else searchStart = foundAt + expectedCompact.length;
    }
  }

  const coverage = {
    visible_element_count: visibleElements.length,
    painted_box_count: paintedBoxes.length,
    text_run_count: textRuns.length,
    glyph_count: allGlyphs.length,
    image_count: images.length,
    loaded_image_count: images.filter(image => image.loaded).length,
    finite: true,
    footer: footerTop === null ? null : {kind: footerKind, top: round(footerTop), synthetic: syntheticFooter},
    content_bottom: contentBottom,
    minimum_footer_gap: minimumFooterGap
  };
  const numericValues = [
    footerTop, contentBottom, minimumFooterGap,
    ...allGlyphs.flatMap(glyph => [glyph.x,glyph.y,glyph.right,glyph.bottom]),
    ...images.flatMap(image => [image.rect.x,image.rect.y,image.rect.right,image.rect.bottom]),
    ...paintedBoxes.flatMap(box => [box.rect.x,box.rect.y,box.rect.right,box.rect.bottom])
  ];
  coverage.finite = numericValues.length > 0 && numericValues.every(finite);
  if (!coverage.finite) issue('incomplete-coverage', {what: 'finite measurements'});
  if (coverage.glyph_count === 0 && coverage.image_count === 0) issue('missing-coverage', {what: 'visible glyphs or images'});
  return {
    index: Number.isInteger(index) ? index : null,
    page: Number.isInteger(index) ? index + 1 : null,
    id,
    role,
    structure,
    coverage,
    text_runs: textRuns,
    painted_boxes: paintedBoxes,
    images,
    issues
  };
}

function measurementHash(measurement) {
  return sha256(Buffer.from(JSON.stringify(measurement)));
}

function sourcePageMetadata(html) {
  const pages = [];
  const matches = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*\bclass\s*=\s*(["'])[^"']*\bos-page\b[^"']*\3[^>]*)>/gi)];
  for (const match of matches) {
    const attrs = match[2];
    const id = (attrs.match(/\bdata-osd-stable-id\s*=\s*(["'])(.*?)\1/i) || [])[2] || '';
    const rawIndex = (attrs.match(/\bdata-idx\s*=\s*(["'])(.*?)\1/i) || [])[2] || '';
    const classes = (attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i) || [])[2] || '';
    pages.push({index: Number.parseInt(rawIndex, 10), id, classes});
  }
  return pages;
}

function validatePageMetadata(pages, contract) {
  const issues = [];
  if (!pages.length) issues.push('No .os-page slides found');
  const ids = pages.map(page => page.id);
  const indices = pages.map(page => page.index);
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) issues.push('Every .os-page needs a unique data-osd-stable-id');
  if (indices.some((index, position) => index !== position)) issues.push('data-idx values must be contiguous from 0 in DOM order');
  if (contract) {
    if (contract.pages.length !== pages.length) issues.push('Contract page count does not match the deck');
    for (let i = 0; i < Math.min(contract.pages.length, pages.length); i++) {
      if (contract.pages[i].id !== pages[i].id) issues.push('Contract page ID mismatch at index ' + i);
    }
  }
  return issues;
}

function parseArgs(args) {
  const values = new Map();
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) throw new Error('Unexpected argument: ' + args[i]);
    if (args[i] === '--self-test') {
      values.set(args[i], true);
      continue;
    }
    if (i + 1 >= args.length || args[i + 1].startsWith('--')) throw new Error('Missing value for ' + args[i]);
    values.set(args[i], args[++i]);
  }
  return {values};
}

function ensureAssetManifestMatch(expected, current) {
  return JSON.stringify(expected) === JSON.stringify(current);
}

function compareReport(report, current, reportPath, currentContractHash) {
  const failures = [];
  if (!report || report.schema_version !== 2) failures.push('report schema_version must be 2');
  if (!Array.isArray(report.errors) || report.errors.length) failures.push('report errors must be an empty array');
  if (JSON.stringify(report.policy) !== JSON.stringify(POLICY)) failures.push('report policy mismatch');
  if (report.footerClearance !== POLICY.footer_clearance_px) failures.push('report footerClearance mismatch');
  if (report.deck_sha256 !== current.deck_sha256) failures.push('deck_sha256 mismatch');
  if (report.checker_sha256 !== current.checker_sha256) failures.push('checker_sha256 mismatch');
  if ((report.contract_sha256 || null) !== (currentContractHash || null)) failures.push('contract_sha256 mismatch');
  if (JSON.stringify(report.canvas) !== JSON.stringify(CANVAS)) failures.push('canvas mismatch');
  if (!ensureAssetManifestMatch(report.asset_manifest, current.asset_manifest)) failures.push('asset_manifest mismatch');
  if (report.asset_manifest_sha256 !== current.asset_manifest_sha256) failures.push('asset_manifest_sha256 mismatch');
  if (!Array.isArray(report.pages) || report.pages.length !== current.pages.length) {
    failures.push('report page count mismatch');
  } else {
    for (let i = 0; i < current.pages.length; i++) {
      const oldPage = report.pages[i];
      const now = current.pages[i];
      if (!oldPage || oldPage.index !== now.index || oldPage.id !== now.id || oldPage.role !== now.role) {
        failures.push('page identity mismatch at index ' + i);
        continue;
      }
      if (!oldPage.structure || !oldPage.coverage || !Array.isArray(oldPage.text_runs) ||
          !Array.isArray(oldPage.painted_boxes) || !Array.isArray(oldPage.images) ||
          !Array.isArray(oldPage.issues) || !oldPage.measurement_sha256 || !oldPage.screenshot) {
        failures.push('page report is incomplete at index ' + i);
        continue;
      }
      const oldMeasurement = {
        index: oldPage.index,
        page: oldPage.page,
        id: oldPage.id,
        role: oldPage.role,
        structure: oldPage.structure,
        coverage: oldPage.coverage,
        text_runs: oldPage.text_runs,
        painted_boxes: oldPage.painted_boxes,
        images: oldPage.images,
        issues: oldPage.issues
      };
      if (oldPage.measurement_sha256 !== measurementHash(oldMeasurement)) {
        failures.push('page measurement hash does not bind report contents: ' + now.id);
      }
      if (oldPage.issues.length || now.issues.length) failures.push('page has layout issues: ' + now.id);
      if (oldPage.measurement_sha256 !== now.measurement_sha256) failures.push('page measurement changed: ' + now.id);
      const screenshotName = 'slide-' + String(i + 1).padStart(2, '0') + '.png';
      if (oldPage.screenshot.file !== screenshotName || !/^[a-f0-9]{64}$/.test(oldPage.screenshot.sha256 || '') ||
          typeof oldPage.screenshot.stable !== 'boolean' || !Number.isInteger(oldPage.screenshot.attempts) || oldPage.screenshot.attempts < 1) {
        failures.push('page screenshot record is invalid: ' + now.id);
      } else {
        const screenshotPath = path.resolve(path.dirname(reportPath), oldPage.screenshot.file);
        try {
          const actualFile = safeOutputFile(screenshotPath);
          if (sha256(fs.readFileSync(actualFile)) !== oldPage.screenshot.sha256) {
            failures.push('saved screenshot hash mismatch: ' + now.id);
          }
        } catch (error) {
          failures.push('saved screenshot unavailable: ' + now.id + ' (' + error.message + ')');
        }
      }
      const requiredCounts = ['visible_element_count','text_run_count','glyph_count','image_count','loaded_image_count','painted_box_count'];
      for (const key of requiredCounts) {
        if (!Number.isFinite(oldPage.coverage[key]) || oldPage.coverage[key] < 0) failures.push('invalid coverage ' + key + ': ' + now.id);
      }
      if (oldPage.coverage.finite !== true || !Number.isFinite(oldPage.coverage.content_bottom) ||
          !Number.isFinite(oldPage.coverage.minimum_footer_gap) || oldPage.coverage.minimum_footer_gap < 64) {
        failures.push('non-finite or insufficient page coverage: ' + now.id);
      }
    }
  }
  const requiredNegative = new Map((current.negative || []).map(item => [item.name, item.pass]));
  const reportNegative = Array.isArray(report.negative) ? report.negative : [];
  if (reportNegative.length !== REQUIRED_NEGATIVE_NAMES.length ||
      REQUIRED_NEGATIVE_NAMES.some(name => !reportNegative.some(item => item.name === name && item.pass === true)) ||
      REQUIRED_NEGATIVE_NAMES.some(name => requiredNegative.get(name) !== true)) {
    failures.push('named negative browser cases are incomplete or failed');
  }
  return failures;
}

const FIXTURE_HTML = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>' +
  '*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:"Times New Roman",KaiTi,serif;color:#102a43}' +
  '.os-frame{width:1920px;height:1080px;position:relative;background:#fff;overflow:hidden}' +
  '.os-page{position:absolute;inset:0;width:1920px;height:1080px;padding:74px 96px 68px;background:#fff}' +
  'header{height:110px}h1{font-size:60px;line-height:1.15;margin:0}main{margin-top:24px;width:1600px;min-height:200px}' +
  '.question{font-size:50px;line-height:1.25;margin:0}.page-footer{position:absolute;left:96px;right:96px;bottom:38px;height:34px;font-size:30px;display:flex;justify-content:space-between}' +
  '</style><div class="os-frame"><section class="os-page activity" data-idx="0" data-osd-stable-id="fixture-activity">' +
  '<header><h1>小型课堂测试</h1></header><main><p class="question">请完成口语任务。</p></main>' +
  '<footer class="page-footer"><span>博雅汉语 · 测试课</span><span>01 / 01</span></footer></section></div>' +
  '<script>window.__classroomDeck={index:function(){return 0},go:function(){return 0}}</script></html>';

async function runNegativeTests(browser) {
  const cases = [
    {
      name: 'footer-clearance',
      expected: 'footer-clearance',
      mutate: () => {
        const p = document.createElement('p');
        p.className = 'question';
        p.textContent = '挤到页脚的任务内容';
        p.style.cssText = 'position:absolute;left:96px;top:1000px;margin:0';
        document.querySelector('.os-page').appendChild(p);
      }
    },
    {
      name: 'orphan-line',
      expected: 'orphan-line',
      mutate: () => { document.querySelector('.question').innerHTML = '地点<br>点'; }
    },
    {
      name: 'arbitrary-offcanvas-content',
      expected: 'canvas-bounds',
      mutate: () => {
        const node = document.createElement('div');
        node.className = 'unregistered-widget';
        node.style.cssText = 'position:absolute;left:-150px;top:300px;font-size:48px';
        node.textContent = '未经登记的画布外说明';
        document.querySelector('.os-page').appendChild(node);
      }
    },
    {
      name: 'arbitrary-offcanvas-painted-box',
      expected: 'canvas-bounds',
      mutate: () => {
        const node = document.createElement('div');
        node.className = 'unregistered-decoration';
        node.style.cssText = 'position:absolute;left:-150px;top:300px;width:200px;height:80px;background:#123456';
        document.querySelector('.os-page').appendChild(node);
      }
    },
    {
      name: 'tiny-critical-text',
      expected: 'font-size',
      mutate: () => { document.querySelector('.question').style.fontSize = '4px'; }
    },
    {
      name: 'transformed-tiny-critical-text',
      expected: 'font-size',
      mutate: () => { document.querySelector('.question').style.transform = 'scale(.1)'; }
    },
    {
      name: 'wrong-font-family',
      expected: 'font-family',
      mutate: () => { document.querySelector('.question').style.fontFamily = 'monospace'; }
    },
    {
      name: 'missing-footer',
      expected: 'missing-footer',
      mutate: () => { document.querySelector('footer').remove(); }
    },
    {
      name: 'missing-required-structure',
      expected: 'missing-structure',
      mutate: () => { document.querySelector('main').remove(); }
    }
  ];
  const page = await browser.newPage({viewport: CANVAS});
  await page.emulateMedia({reducedMotion: 'reduce'});
  const results = [];
  try {
    for (const test of cases) {
      await page.setContent(FIXTURE_HTML, {waitUntil: 'load'});
      await page.evaluate(test.mutate);
      const result = await page.evaluate(measure, {});
      results.push({
        name: test.name,
        pass: result.issues.some(item => item.kind === test.expected &&
          (test.name !== 'arbitrary-offcanvas-painted-box' || item.what === 'painted-box')),
        expected_issue: test.expected,
        observed_issues: [...new Set(result.issues.map(item => item.kind))],
        painted_box_count: result.painted_boxes.length
      });
    }
  } finally {
    await page.close();
  }
  return results;
}

async function waitForStableFrame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function captureStableScreenshot(capture, settle, delay, options = {}) {
  const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 13;
  const intervalMs = Number.isFinite(options.intervalMs) ? options.intervalMs : 80;
  const stableCount = Number.isInteger(options.stableCount) ? options.stableCount : 2;
  let previousHash = null;
  let consecutive = 0;
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (settle) await settle();
    const buffer = await capture();
    const currentHash = sha256(buffer);
    consecutive = currentHash === previousHash ? consecutive + 1 : 1;
    previousHash = currentHash;
    last = {buffer, hash: currentHash, attempts: attempt, stable: consecutive >= stableCount};
    if (last.stable) return last;
    if (attempt < maxAttempts && delay) await delay(intervalMs);
  }
  return last;
}

async function renderDeck(browser, deckPath, contract, capturePaths) {
  const source = fs.readFileSync(deckPath, 'utf8');
  const metadata = sourcePageMetadata(source);
  const preflight = validatePageMetadata(metadata, contract);
  const page = await browser.newPage({viewport: CANVAS});
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.emulateMedia({reducedMotion: 'reduce'});
  const pages = [];
  try {
    // Third-party media can keep the window `load` event pending indefinitely.
    // The deck's own assets are awaited below per active slide, so layout QA
    // only needs its local DOM before continuing to fonts and visible images.
    await page.goto(pathToFileURL(deckPath).href, {waitUntil: 'domcontentloaded'});
    await page.addStyleTag({content: '*{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'});
    await page.evaluate(() => document.fonts.ready);
    const domMetadata = await page.evaluate(() => [...document.querySelectorAll('.os-page')].map((node, index) => ({
      index: Number.parseInt(node.getAttribute('data-idx') || '', 10),
      id: node.getAttribute('data-osd-stable-id') || '',
      dom_index: index
    })));
    if (domMetadata.length !== metadata.length) preflight.push('Browser page count differs from source page count');
    for (let i = 0; i < Math.min(domMetadata.length, metadata.length); i++) {
      if (domMetadata[i].index !== i || domMetadata[i].dom_index !== i || domMetadata[i].id !== metadata[i].id) {
        preflight.push('Browser page identity/order mismatch at index ' + i);
      }
    }
    for (let i = 0; i < domMetadata.length; i++) {
      const nav = await page.evaluate(i => {
        if (!window.__classroomDeck || typeof window.__classroomDeck.go !== 'function') return {ok: false, index: null};
        window.__classroomDeck.go(i);
        return {ok: true, index: window.__classroomDeck.index()};
      }, i);
      if (!nav.ok || nav.index !== i) preflight.push('Deck navigation failed at page ' + (i + 1));
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.os-page:not([hidden]) img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
      await page.waitForTimeout(80);
      const stableScreenshot = await captureStableScreenshot(
        () => page.screenshot({type: 'png'}),
        () => waitForStableFrame(page),
        milliseconds => page.waitForTimeout(milliseconds),
        {stableCount: 3}
      );
      if (capturePaths) fs.writeFileSync(capturePaths[i], stableScreenshot.buffer);
      const policyPage = contract && contract.pages[i] ? contract.pages[i] : {};
      const measured = await page.evaluate(measure, policyPage);
      if (measured.id !== metadata[i].id || measured.index !== i) {
        measured.issues.push({kind: 'page-identity', expected: metadata[i].id, actual: measured.id});
      }
      pages.push({
        ...measured,
        measurement_sha256: measurementHash(measured),
        screenshot: {
          file: 'slide-' + String(i + 1).padStart(2, '0') + '.png',
          sha256: stableScreenshot.hash,
          stable: stableScreenshot.stable,
          attempts: stableScreenshot.attempts
        }
      });
    }
  } finally {
    await page.close();
  }
  return {pages, errors: browserErrors, preflight};
}

function validateReportShape(report) {
  if (!report || report.schema_version !== 2) throw new Error('Only rendered-layout schema v2 reports are supported');
  if (!Array.isArray(report.pages) || !Array.isArray(report.asset_manifest) || !Array.isArray(report.negative)) {
    throw new Error('Report requires pages, asset_manifest, and negative arrays');
  }
}

async function runVerify(reportPath, deckPath, contractInfo, browser) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  validateReportShape(report);
  const deckReal = existingRealPathInsideProject(deckPath);
  const html = fs.readFileSync(deckReal, 'utf8');
  const manifest = assetManifest(deckReal, html);
  const manifestHash = sha256(Buffer.from(JSON.stringify(manifest)));
  const rendered = await renderDeck(browser, deckReal, contractInfo.contract, null);
  const negatives = await runNegativeTests(browser);
  const current = {
    deck: projectRelative(deckReal),
    deck_sha256: sha256(fs.readFileSync(deckReal)),
    checker_sha256: sha256(fs.readFileSync(__filename)),
    asset_manifest: manifest,
    asset_manifest_sha256: manifestHash,
    pages: rendered.pages,
    negative: negatives
  };
  const failures = compareReport(report, current, reportPath, contractInfo.hash);
  if (report.deck !== current.deck) failures.push('deck path mismatch');
  if (rendered.errors.length) failures.push('browser runtime errors: ' + rendered.errors.join(' | '));
  failures.push(...rendered.preflight);
  if (negatives.some(item => !item.pass)) failures.push('one or more fresh negative browser cases failed');
  const summary = {
    ok: failures.length === 0,
    schema_version: 2,
    page_count: rendered.pages.length,
    deck_sha256: current.deck_sha256,
    errors: failures,
    raster_diagnostics: failures.length === 0 ? report.pages.flatMap((oldPage, index) => {
      const fresh = rendered.pages[index];
      return oldPage.screenshot.sha256 !== fresh.screenshot.sha256 ? [{
        page_id: fresh.id,
        stored_sha256: oldPage.screenshot.sha256,
        fresh_sha256: fresh.screenshot.sha256,
        reason: 'Chrome raster pixels differ while the current source, assets, and measured layout match'
      }] : [];
    }) : []
  };
  process.stdout.write(JSON.stringify(summary) + '\n');
  return failures.length ? 1 : 0;
}

async function runCreate(deckPath, outputDirectory, contractInfo, browser) {
  const deckReal = existingRealPathInsideProject(deckPath);
  const html = fs.readFileSync(deckReal, 'utf8');
  const output = safeOutputDirectory(outputDirectory);
  fs.mkdirSync(output, {recursive: true});
  const metadata = sourcePageMetadata(html);
  const screenshotPaths = metadata.map((_, index) => path.join(output, 'slide-' + String(index + 1).padStart(2, '0') + '.png'));
  for (const screenshotPath of screenshotPaths) projectRelative(screenshotPath);
  const rendered = await renderDeck(browser, deckReal, contractInfo.contract, screenshotPaths);
  const negatives = await runNegativeTests(browser);
  const manifest = assetManifest(deckReal, html);
  const report = {
    schema_version: 2,
    deck: projectRelative(deckReal),
    deck_sha256: sha256(fs.readFileSync(deckReal)),
    checker_sha256: sha256(fs.readFileSync(__filename)),
    contract_sha256: contractInfo.hash,
    canvas: CANVAS,
    policy: POLICY,
    asset_manifest: manifest,
    asset_manifest_sha256: sha256(Buffer.from(JSON.stringify(manifest))),
    footerClearance: POLICY.footer_clearance_px,
    errors: [...rendered.errors, ...rendered.preflight],
    pages: rendered.pages,
    negative: negatives
  };
  const reportPath = path.join(output, 'rendered-layout.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  const failures = report.pages.filter(page => page.issues.length);
  const summary = {
    schema_version: 2,
    pages: report.pages.length,
    errors: report.errors,
    issues: failures.map(page => ({page: page.page, id: page.id, issues: page.issues})),
    negative: report.negative
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  if (report.errors.length || failures.length || negatives.some(item => !item.pass)) return 1;
  return 0;
}

async function main() {
  const {values} = parseArgs(process.argv.slice(2));
  const verifyPath = values.get('--verify-report');
  const deckValue = values.get('--deck');
  const outputValue = values.get('--output-dir');
  const contractValue = values.get('--contract');
  if (!deckValue) throw new Error('--deck <HTML> is required');
  const deckPath = existingRealPathInsideProject(deckValue);
  const contractInfo = readContract(contractValue);
  if (verifyPath) {
    if (outputValue) throw new Error('--verify-report is read-only and cannot use --output-dir');
    const reportPath = safeOutputFile(verifyPath);
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    try {
      return await runVerify(reportPath, deckPath, contractInfo, browser);
    } finally {
      await browser.close();
    }
  }
  if (!outputValue) throw new Error('--output-dir <project-local QA directory> is required');
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    return await runCreate(deckPath, outputValue, contractInfo, browser);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    process.stderr.write((error && error.stack) || String(error));
    process.stderr.write('\n');
    process.exitCode = 1;
  });
}

module.exports = {measure, runNegativeTests, renderDeck, compareReport, measurementHash, normalizeContract, captureStableScreenshot, safeOutputDirectory, assertAllowedOutputPath, parseArgs};
