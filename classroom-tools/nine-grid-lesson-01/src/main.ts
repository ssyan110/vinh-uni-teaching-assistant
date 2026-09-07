import "./styles.css";
import { pugArtwork } from "./pug";
import {
  chooseSoloAiMove,
  boardWordLines,
  countClaims,
  createLegacyBoardVocabulary,
  detectWinner,
  fillFunctionPrompts,
  functionCellPositions,
  winLengthForSide,
  functionPromptsForScope,
  seededShuffle,
  splitVocabularyRounds,
  vocabularyRoundPlan,
  sentencesForScope,
  vocabularyForScope
} from "./game";
import { loadCommittedSeed } from "./content-source";
import type {
  CellOwner,
  ContentPack,
  FunctionPrompt,
  FunctionPromptActivity,
  LegacySubmode,
  ScopeSelection,
  Team,
  VocabularyItem
} from "./types";

type View = "home" | "setup" | "game";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("找不到游戏显示区域。");
const app: HTMLDivElement = appElement;

let pack: ContentPack | null = null;
let view: View = "home";
let selectedLessonIds: string[] = ["boya-quasi-intermediate-i:lesson-01"];
let promptTimerId: number | null = null;
let rounds: VocabularyItem[][] = [];
let roundIndex = 0;
let boardSide = 6;
let boardVocabulary: Array<VocabularyItem | undefined> = [];
let owners: CellOwner[] = [];
let winner: Team | null = null;
let turnTeam: Team = "blue";
let firstTeam: Team = "blue";
let celebrating = false;
let turnHistory: Array<{ owners: CellOwner[]; turn: Team }> = [];
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

function promptActivityLabel(activity: FunctionPromptActivity): string {
  return activity === "translate-vietnamese" ? "读例句·说越南文" : "句式造句";
}

function promptActivityTitle(activity: FunctionPromptActivity): string {
  return activity === "translate-vietnamese" ? "读例句，再说出越南文意思" : "用这个句式造一个新句子";
}

/** Lucide-compatible inline icons keep the game usable in the offline file. */
function promptActivityIcon(activity: FunctionPromptActivity): string {
  return activity === "translate-vietnamese"
    ? `<svg class="function-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"></path></svg>`
    : `<svg class="function-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M13 2v7h7M16 13.5l-4.8 4.8-2.7.4.4-2.7a1.6 1.6 0 0 1 2.3-2.3zM9 6h1M9 10h1"></path></svg>`;
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
      activity: prompts.length % 2 === 0 ? "make-sentence" : "translate-vietnamese",
      support: prompts.length % 2 === 0
        ? "请参考上面的课内句式，用这个句式造一个新的句子。"
        : "请先读出例句，再说出它的越南文意思。",
      seconds: 30,
      sourceItemId: `sentence-${item.item_id}`
    }));
  return [...prompts, ...sentencePrompts];
}

function shell(content: string, options: { compact?: boolean } = {}): string {
  const contentSummary = pack
    ? `<span>${escapeHtml(pack.class_name)}</span><span>${pack.lessons.length} 课</span>`
    : `<span>还没有内容</span>`;
  return `
    <div class="app-shell ${options.compact ? "app-shell--compact" : ""}">
      <div class="ambient ambient-a" aria-hidden="true"></div>
      <div class="ambient ambient-b" aria-hidden="true"></div>
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="返回首页">
          <span class="brand-mark" aria-hidden="true">字</span>
          <span><strong>博雅词语连线</strong><small>词语与句式造句课堂游戏</small></span>
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
        <div><span class="eyebrow">本册内容</span><h2>${escapeHtml(pack.class_name)}</h2></div>
        <dl>
          <div><dt>可选内容</dt><dd>${lessonCount}</dd></div>
          <div><dt>词语</dt><dd>${pack.vocabulary.length}</dd></div>
          <div><dt>功能格</dt><dd>${pack.exercises.length}</dd></div>
        </dl>
      </section>`
    : `<section class="empty-note" aria-label="空白状态">
        <span aria-hidden="true">＋</span>
        <div><strong>还没有课堂内容</strong><p>请重新打开完整的游戏文件。</p></div>
      </section>`;

  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">准中级加速篇 I · 全十二课</span>
        <h1>看内容，<br><em>说出来。</em></h1>
        <p class="hero-lead">两组轮流，每回合换一位同学。先独立读词并解释意思，教师确认后占格；6–8列连四格、9列连五格获胜，由教师给胜组加分。</p>
        <div class="hero-actions">
          <button class="button button--primary" data-action="setup" ${hasContent ? "" : "disabled"}>
            <span>开始游戏</span><span aria-hidden="true">→</span>
          </button>

        </div>
      </div>
      <div class="hero-board" aria-hidden="true">
        <span class="board-stamp">连成一线</span>
        <div class="sample-grid">
          ${["独生女", "照顾", "例句", "压力", "生活", "毕业", "父母", "例句", "照片"].map((word, index) =>
            `<span class="sample-cell ${[0, 4, 8].includes(index) ? "sample-cell--marked" : ""}">${word}</span>`
          ).join("")}
        </div>
        <p>6 × 6 至 9 × 9 <small>句式造句格上下左右不相邻</small></p>
      </div>
    </section>
    ${contentError ? `<section class="content-error" role="alert"><strong>内容无法使用</strong><p>${escapeHtml(contentError)}</p></section>` : ""}
    ${contentCard}
    <footer class="home-footer"><span>课堂投影 · 词语、句式、口语互动</span><span>离线可用</span></footer>
  `);
  bindCommonActions();
}

function renderSetup(): void {
  if (!pack) return renderHome();
  const activeLessons = pack.lessons.filter((lesson) => lesson.active !== false).sort((a, b) => a.order - b.order);
  selectedLessonIds = selectedLessonIds.filter((id) => activeLessons.some((lesson) => lesson.lesson_id === id));
  const currentSelection = getScopeSelection();
  const chosen = vocabularyForScope(pack, currentSelection);
  const roundPlan = splitVocabularyRounds(chosen);
  const firstRoundSide = vocabularyRoundPlan(chosen.length, isFirstLessonOnly()).sides[0] ?? 6;
  const firstRoundWordCount = roundPlan[0]?.length ?? 0;
  const firstRoundFunctionCount = Math.max(0, firstRoundSide ** 2 - firstRoundWordCount);
  const scopedPrompts = boardPromptPoolForScope(pack, currentSelection, firstRoundFunctionCount);
  const needsFunctionPrompts = true;
  const canStart = selectedLessonIds.length > 0 && chosen.length > 0 && (!needsFunctionPrompts || scopedPrompts.length > 0);

  app.innerHTML = shell(`
    <div class="page-heading">
      <button class="back-button" data-action="home">← 返回首页</button>
      <span class="step-label">游戏设置 · 自动调整棋盘</span>
    </div>
    <section class="setup-layout">
      <div class="setup-main">
        <span class="eyebrow">本轮内容</span>
        <h1>选好课次，<br><em>开始对战。</em></h1>
        <p class="setup-lead">第一课用 6 × 6，含31个词语和5个句式造句格。其他选课随词数调整，最多 9 × 9；句式造句格上下左右不相邻，词语混合分轮，不重复。</p>
        <div class="setup-card">
          <fieldset class="lesson-picker"><legend>选择本轮课次（可多选）</legend>
            <div class="lesson-tools"><button class="text-button" data-action="all-lessons">全选十二课</button><button class="text-button" data-action="clear-lessons">清空选择</button></div>
            <div class="lesson-options">${activeLessons.map((lesson) => `<label><input type="checkbox" name="lesson" value="${escapeHtml(lesson.lesson_id)}" ${selectedLessonIds.includes(lesson.lesson_id) ? "checked" : ""}/><span>${escapeHtml(lesson.lesson_name)}<small>${vocabularyForScope(pack!, {mode: "single", lessonIds: [lesson.lesson_id]}).length} 个词语</small></span></label>`).join("")}</div>
          </fieldset>
          <div class="legacy-settings">
            <fieldset><legend>课堂操作方式</legend>
              <label><input type="radio" name="legacy-submode" value="classroom" ${legacySubmode === "classroom" ? "checked" : ""}/><span><b>课堂分队</b><small>首轮蓝队先，之后每轮交换先手；占格后换队。</small></span></label>
              <label><input type="radio" name="legacy-submode" value="solo" ${legacySubmode === "solo" ? "checked" : ""}/><span><b>学生对战电脑</b><small>学生用蓝队，电脑用红队。</small></span></label>
            </fieldset>
            <div class="function-note"><strong>句式造句格固定 30 秒</strong><span>参考所选课 PPT 句式，造一个新句子 · 教师判定</span></div>
          </div>
        </div>
      </div>
      <aside class="board-plan" aria-live="polite">
        <span class="eyebrow">${firstRoundSide} × ${firstRoundSide} 棋盘 · ${winLengthForSide(firstRoundSide)}格连线</span>
        <h2>${escapeHtml(selectedScopeName())}</h2>
        <strong>${chosen.length}</strong><span>个不重复词语</span>
        ${chosen.length
          ? `<div class="plan-line"><b>${firstRoundSide ** 2}</b><span>${firstRoundWordCount} 个词语 + ${firstRoundFunctionCount} 个功能格 · ${roundPlan.length} 轮</span></div>`
          : `<div class="plan-line"><b>${firstRoundSide ** 2}</b><span>格 · 请至少选择一课</span></div>`}
        <div class="plan-functions"><span>所选课句式造句题</span><strong>${scopedPrompts.length}</strong><small>${firstRoundFunctionCount ? "句式题用完后再轮换" : "本轮无需补入功能格"}</small></div>
        <button class="button button--primary button--wide" data-action="start-game" ${canStart ? "" : "disabled"}>开始游戏 <span aria-hidden="true">→</span></button>
      </aside>
    </section>
  `);
  bindCommonActions();
  bindSetupActions();
}

function renderGame(): void {
  if (pendingWinner) {
    winner = pendingWinner;
    pendingWinner = null;
    celebrating = true;
    liveMessage = `${teamName(winner)}已连成${winLengthForSide(boardSide)}格，获胜！`;
  }
  const focusedCell = (document.activeElement as HTMLElement | null)?.dataset.cell;
  const side = boardSide;
  const required = boardSide >= 9 ? 5 : 4;
  const isManual = legacySubmode === "classroom";
  const claims = countClaims(owners);
  const isDraw = !winner && !pendingWinner && owners.length > 0 && owners.every(Boolean);
  const result = winner || isDraw
    ? `<div class="result-banner" role="status"><strong>${winner ? `${teamName(winner)}获胜！` : "本轮平局！"}</strong><span>${winner ? `已经连成 ${required} 格，由教师给胜组加分。` : "所有格子都已选择。"}</span></div>`
    : "";
  const selectedLessonName = selectedScopeName();
  app.innerHTML = shell(`
    <section class="game-header">
      <div class="game-header__left">
        <button class="back-button back-button--light" data-action="setup">← 重新选课</button>
        <div><span class="eyebrow">${side} × ${side} · ${escapeHtml(selectedLessonName)} · 第 ${roundIndex + 1} / ${rounds.length} 轮</span><h1>连成 ${required} 格就获胜</h1><div class="turn-indicator turn-indicator--${turnTeam}" role="status">${winner || isDraw ? "本轮结束" : pendingWinner ? "等待教师确认结果" : `轮到${teamName(turnTeam)} · 请换一位同学`}</div></div>
      </div>
      <div class="scoreboard" aria-label="已占格数">
        <div class="team-score team-score--red"><span>${legacySubmode === "solo" ? "电脑 · 红" : "红队"}</span><strong>${claims.red}</strong></div>
        <div class="turn-timer"><span>已占格</span><strong>${claims.red + claims.blue}</strong></div>
        <div class="team-score team-score--blue"><span>${legacySubmode === "solo" ? "学生 · 蓝" : "蓝队"}</span><strong>${claims.blue}</strong></div>
      </div>
      <div class="game-actions"><div class="pug-companion" role="img" aria-label="八哥犬陪你练习">${pugArtwork()}</div><button class="icon-button" data-action="new-board">重排</button></div>
    </section>
    ${result}
    <p class="board-scroll-hint">小屏幕可左右滑动棋盘，查看完整词语。</p>
    <section class="board-stage" tabindex="0" aria-label="棋盘区域，小屏幕可左右滚动">
      <div class="board" style="--board-side:${side}" role="grid" aria-label="${side} × ${side} 棋盘">
        ${Array.from({ length: side * side }, (_, index) => {
          const item = boardVocabulary[index];
          const prompt = functionCells.get(index);
          const wordLines = boardWordLines(item?.word ?? "");
          const promptLabel = prompt ? promptActivityLabel(prompt.activity) : "";
          const disabled = Boolean(winner || isDraw || owners[index]);
          const aria = prompt ? `${promptLabel}功能格` : item?.word ?? "空白格";
          return `<button class="board-cell ${prompt ? "board-cell--function" : "board-cell--word"} ${owners[index] ? `claimed claimed--${owners[index]}` : ""}" role="gridcell" style="--word-length:${Math.max(2, ...wordLines.map((line) => Array.from(line).length))};--word-lines:${Math.max(1,wordLines.length)}" data-source-item="${escapeHtml(item?.item_id ?? prompt?.sourceItemId ?? "")}" data-cell="${index}" aria-label="${escapeHtml(aria)}${owners[index] ? `，已由${teamName(owners[index] as Team)}选择` : ""}" ${disabled ? "disabled" : ""}><span>${prompt ? promptActivityIcon(prompt.activity) : wordLines.map(escapeHtml).join("<br>")}</span>${prompt ? `<small>30 秒</small>` : ""}</button>`;
        }).join("")}
      </div>
    </section>
    <section class="game-footer">
      <p><strong>${winner || isDraw ? "本轮结束" : (isManual ? "教师确认后点击词语占格" : "请蓝队选择一格")}</strong><span> · ${isManual ? "两组轮流换人，独立读词并解释意思；功能格参考句式造一个新句子。" : "电脑红队会自动选择。"}</span></p>
      <div class="round-controls"><button class="text-button" data-action="undo-turn" ${turnHistory.length ? "" : "disabled"}>撤销上一步</button>${winner || isDraw ? `<button class="button button--primary" data-action="next-round">${roundIndex < rounds.length - 1 ? "下一轮" : "再玩一次"} →</button>` : `<button class="button button--secondary" data-action="pass-turn">未通过，换队</button><button class="text-button" data-action="reset-round">重开本轮</button>`}</div>
    </section>
    ${activePrompt ? `<div class="modal-backdrop" role="presentation"><section class="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-title">
      <span class="eyebrow">${teamName(turnTeam)} · ${promptActivityLabel(activePrompt.activity)} · ${activePrompt.seconds} 秒</span>
      <h2 id="task-title">${promptActivityTitle(activePrompt.activity)}</h2>
      <p class="task-prompt" lang="zh">${escapeHtml(activePrompt.prompt)}</p>
      ${activePrompt.support ? `<p class="task-support">${escapeHtml(activePrompt.support)}</p>` : ""}
      <div class="prompt-countdown" aria-live="polite"><strong id="prompt-timer">${promptRemaining}</strong><span>秒</span></div>
      <div class="form-actions"><button class="button button--secondary" data-action="skip-prompt">返回棋盘</button><button class="button button--secondary" data-action="pass-turn">未通过，换队</button><button class="button button--primary" data-action="complete-prompt">${teamName(turnTeam)}完成并占格</button></div>
    </section></div>` : ""}
    ${celebrating && winner ? `<div class="victory-backdrop"><section class="task-modal victory-modal victory--${winner}" role="dialog" aria-modal="true" aria-labelledby="victory-title">
      <div class="victory-pug">${pugArtwork()}</div><p class="victory-team">${teamName(winner)}获胜！</p><h2 id="victory-title">恭喜你赢了！</h2><p>一起为自己和队友鼓掌吧！</p>
      <div class="form-actions"><button class="button button--primary" data-action="save-result">保存比赛结果图片</button><button class="button button--secondary" data-action="dismiss-celebration">查看棋盘</button></div><p id="export-status" role="status"></p><div id="result-preview"></div>
    </section></div>` : ""}
  `, { compact: true });
  bindCommonActions();
  bindGameActions();
  const modal = document.querySelector<HTMLElement>(".task-modal");
  if (modal) {
    modal.querySelector<HTMLButtonElement>("button")?.focus();
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (celebrating) dismissCelebration();
        else if (activePrompt) cancelPrompt();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const buttons = [...modal.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }
    });
  } else if (focusedCell) {
    document.querySelector<HTMLButtonElement>(`[data-cell="${focusedCell}"]`)?.focus();
  }
  if (activePrompt) startPromptTimer();
}

function selectedScopeName(): string {
  if (selectedLessonIds.length === 12) return "全十二课（第1—12课）";
  if (selectedLessonIds.length > 2) return `第${pack?.lessons.filter((lesson) => selectedLessonIds.includes(lesson.lesson_id)).map((lesson) => lesson.order).join("、")}课`;
  return pack?.lessons.filter((lesson) => selectedLessonIds.includes(lesson.lesson_id)).map((lesson) => lesson.lesson_name).join("、") || "请至少选择一课";
}

function getScopeSelection(): ScopeSelection {
  return { mode: "multiple", lessonIds: [...selectedLessonIds] };
}

function bindCommonActions(): void {
  document.querySelectorAll<HTMLElement>("[data-action='home']").forEach((button) => button.addEventListener("click", () => navigate("home")));
  document.querySelector<HTMLElement>("[data-action='setup']")?.addEventListener("click", () => navigate("setup"));
}

function bindSetupActions(): void {
  document.querySelectorAll<HTMLInputElement>("input[name='lesson']").forEach((input) => input.addEventListener("change", () => {
    selectedLessonIds = [...document.querySelectorAll<HTMLInputElement>("input[name='lesson']:checked")].map((item) => item.value);
    renderSetup();
    document.querySelector<HTMLInputElement>(`input[name='lesson'][value="${input.value}"]`)?.focus();
  }));
  document.querySelector("[data-action='all-lessons']")?.addEventListener("click", () => {
    selectedLessonIds = pack!.lessons.filter((lesson) => lesson.active !== false).map((lesson) => lesson.lesson_id);
    renderSetup();
    document.querySelector<HTMLButtonElement>("[data-action='all-lessons']")?.focus();
  });
  document.querySelector("[data-action='clear-lessons']")?.addEventListener("click", () => {
    selectedLessonIds = [];
    renderSetup();
    document.querySelector<HTMLButtonElement>("[data-action='clear-lessons']")?.focus();
  });
  document.querySelectorAll<HTMLInputElement>("input[name='legacy-submode']").forEach((input) => input.addEventListener("change", () => {
    legacySubmode = input.value as LegacySubmode;
    renderSetup();
  }));
  document.querySelector<HTMLElement>("[data-action='start-game']")?.addEventListener("click", beginGame);
}

function bindGameActions(): void {
  document.querySelector<HTMLButtonElement>("[data-action='save-result']")?.addEventListener("click", saveResultImage);
  document.querySelector<HTMLElement>("[data-action='dismiss-celebration']")?.addEventListener("click", dismissCelebration);
  document.querySelectorAll<HTMLElement>("[data-action='pass-turn']").forEach((button) => button.addEventListener("click", passTurn));
  document.querySelector<HTMLElement>("[data-action='undo-turn']")?.addEventListener("click", undoTurn);
  document.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((cell) => cell.addEventListener("click", () => claimCell(Number(cell.dataset.cell))));
  document.querySelector<HTMLElement>("[data-action='new-board']")?.addEventListener("click", () => resetRound(true));
  document.querySelector<HTMLElement>("[data-action='reset-round']")?.addEventListener("click", () => resetRound(false));
  document.querySelector<HTMLElement>("[data-action='next-round']")?.addEventListener("click", nextRound);
  document.querySelector<HTMLElement>("[data-action='complete-prompt']")?.addEventListener("click", completePrompt);
  document.querySelector<HTMLElement>("[data-action='skip-prompt']")?.addEventListener("click", cancelPrompt);
}

function navigate(next: View): void {
  stopPromptTimer();
  activePrompt = null;
  promptCellIndex = null;
  view = next;
  liveMessage = "";
  if (view === "home") renderHome();
  else if (view === "setup") renderSetup();
  else renderGame();
}

function beginGame(): void {
  if (!pack) return;
  if (selectedLessonIds.length === 0) return;
  const selection = getScopeSelection();
  const chosen = vocabularyForScope(pack, selection);
  const prompts = boardPromptPoolForScope(pack, selection, 81);
  if (!chosen.length) return;
  rounds = splitVocabularyRounds(seededShuffle(chosen, ++boardSeed));
  if (!prompts.length) return;
  availablePrompts = prompts;
  roundIndex = 0;
  firstTeam = "blue";
  setupRound();
  view = "game";
  renderGame();
}

function isFirstLessonOnly(): boolean {
  return selectedLessonIds.length === 1 && selectedLessonIds[0] === "boya-quasi-intermediate-i:lesson-01";
}

function setupRound(incrementSeed = true): void {
  if (incrementSeed) boardSeed += 1;
  const round = rounds[roundIndex] ?? [];
  boardSide = vocabularyRoundPlan(round.length, isFirstLessonOnly()).sides[0] ?? 6;
  const words = createLegacyBoardVocabulary(round, boardSeed);
  const functionCount = boardSide ** 2 - words.length;
  const functionSlots = functionCellPositions(boardSide, functionCount, boardSeed);
  const reserved = new Set(functionSlots);
  const cellSlots = seededShuffle(
    Array.from({ length: boardSide ** 2 }, (_, index) => index).filter(index => !reserved.has(index)),
    boardSeed ^ 0x51f15e
  );
  boardVocabulary = Array<VocabularyItem | undefined>(boardSide ** 2).fill(undefined);
  words.forEach((item, index) => {
    boardVocabulary[cellSlots[index]] = item;
  });
  owners = Array(boardSide ** 2).fill(null);
  turnTeam = legacySubmode === "solo" ? "blue" : firstTeam;
  celebrating = false;
  turnHistory = [];
  winner = null;
  pendingWinner = null;
  activePrompt = null;
  promptCellIndex = null;
  stopPromptTimer();
  functionCells = new Map();
  fillFunctionPrompts(availablePrompts, functionCount, boardSeed ^ 0xf00d).forEach((prompt, index) => {
    functionCells.set(functionSlots[index], prompt);
  });
}

function claimCell(index: number): void {
  if (index < 0 || index >= boardSide ** 2 || winner || pendingWinner || activePrompt || owners[index]) return;
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

function rememberTurn(): void {
  turnHistory.push({owners: [...owners], turn: turnTeam});
}

function playComputerTurn(): void {
  const aiIndex = chooseSoloAiMove(owners, boardSide, boardSeed + owners.filter(Boolean).length, "red");
  if (aiIndex !== null) {
    owners[aiIndex] = "red";
    pendingWinner = detectWinner(owners, boardSide, boardSide >= 9 ? 5 : 4);
  }
  turnTeam = "blue";
}

function applyLegacyClaim(index: number): void {
  if (owners[index]) return;
  rememberTurn();
  owners[index] = turnTeam;
  pendingWinner = detectWinner(owners, boardSide, boardSide >= 9 ? 5 : 4);
  if (!pendingWinner) {
    if (legacySubmode === "solo") playComputerTurn();
    else turnTeam = turnTeam === "blue" ? "red" : "blue";
  }
  liveMessage = `第 ${index + 1} 格属于${teamName(owners[index] as Team)}。`;
  renderGame();
  document.querySelector(".pug-companion")?.classList.add("pug-companion--happy");
  document.querySelector(`[data-cell="${index}"]`)?.classList.add("claim-pop");
}

function passTurn(): void {
  if (winner || pendingWinner || owners.every(Boolean)) return;
  rememberTurn();
  stopPromptTimer();
  activePrompt = null;
  promptCellIndex = null;
  if (legacySubmode === "solo") playComputerTurn();
  else turnTeam = turnTeam === "blue" ? "red" : "blue";
  liveMessage = `本次不占格，轮到${teamName(turnTeam)}。`;
  renderGame();
}

function undoTurn(): void {
  const previous = turnHistory.pop();
  if (!previous) return;
  stopPromptTimer();
  owners = previous.owners;
  turnTeam = previous.turn;
  winner = null;
  pendingWinner = null;
  celebrating = false;
  activePrompt = null;
  promptCellIndex = null;
  liveMessage = `已撤销上一步，轮到${teamName(turnTeam)}。`;
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
  liveMessage = "已返回棋盘，格子和当前队伍不变。";
  renderGame();
}

function dismissCelebration(): void {
  celebrating = false;
  renderGame();
  document.querySelector<HTMLButtonElement>("[data-action='next-round']")?.focus();
}

function saveResultImage(): void {
  if (!winner) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1800;
  const ctx = canvas.getContext("2d");
  const status = document.querySelector<HTMLElement>("#export-status");
  if (!ctx) { if (status) status.textContent = "图片生成失败，请重试。"; return; }
  const resultTeam = teamName(winner);
  const date = new Date();
  const timestamp = date.toLocaleString("zh-CN", { hour12: false });
  const claims = countClaims(owners);
  const font = '"Times New Roman", KaiTi, "Kaiti SC", serif';
  ctx.fillStyle = "#fff6e7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = winner === "blue" ? "#1266a0" : "#b74432";
  ctx.font = `bold 88px ${font}`;
  ctx.fillText(`${resultTeam}获胜！`, 800, 130);
  ctx.fillStyle = "#17324d";
  ctx.font = `34px ${font}`;
  const scope = selectedScopeName();
  const scopeLines: string[] = [];
  let line = "";
  for (const char of scope) {
    if (ctx.measureText(line + char).width > 1450) { scopeLines.push(line); line = ""; }
    line += char;
  }
  if (line) scopeLines.push(line);
  scopeLines.forEach((text, i) => ctx.fillText(text, 800, 200 + i * 44));
  const metaY = 240 + scopeLines.length * 44;
  ctx.font = `30px ${font}`;
  ctx.fillText(`第 ${roundIndex + 1} / ${rounds.length} 轮 · ${boardSide} × ${boardSide} · 连成 ${winLengthForSide(boardSide)} 格获胜`, 800, metaY);
  ctx.fillText(`占格数：红队 ${claims.red} 格 ／ 蓝队 ${claims.blue} 格（非加分分数）`, 800, metaY + 48);
  const top = metaY + 90;
  const cellWidth = 1440 / boardSide;
  const cellHeight = (1600 - top) / boardSide;
  ctx.textBaseline = "middle";
  for (let i = 0; i < boardSide * boardSide; i++) {
    const x = 80 + (i % boardSide) * cellWidth;
    const y = top + Math.floor(i / boardSide) * cellHeight;
    ctx.fillStyle = owners[i] === "blue" ? "#1266a0" : owners[i] === "red" ? "#b74432" : functionCells.has(i) ? "#e8e5f4" : "#ffffff";
    ctx.fillRect(x, y, cellWidth, cellHeight);
    ctx.strokeStyle = "#cbd5dc";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
    ctx.fillStyle = owners[i] ? "#ffffff" : "#17324d";
    const lines = boardWordLines(boardVocabulary[i]?.word ?? "例句");
    let size = Math.min(42, (cellHeight - 16) / lines.length / 1.2);
    ctx.font = `${size}px ${font}`;
    const widest = Math.max(...lines.map(text => ctx.measureText(text).width));
    if (widest > cellWidth - 16) size *= (cellWidth - 16) / widest;
    ctx.font = `${size}px ${font}`;
    lines.forEach((text, index) => ctx.fillText(text, x + cellWidth / 2, y + cellHeight / 2 + (index - (lines.length - 1) / 2) * size * 1.2));
  }
  ctx.font = `28px ${font}`;
  ctx.fillStyle = "#17324d";
  ctx.fillText(`比赛结果记录 · ${timestamp}`, 800, 1690);
  ctx.fillText("由教师依据课堂规则另行登记加分。", 800, 1740);
  try {
    // A self-contained PNG survives embedded-browser download handling; a blob
    // URL can become inaccessible when a host handles the download elsewhere.
    const url = canvas.toDataURL("image/png");
    if (!url.startsWith("data:image/png;base64,iVBORw0KGgo") || url.length < 100) throw new Error("Invalid PNG");
    const filename = `词语连线-${resultTeam}获胜-第${roundIndex + 1}轮-${date.getTime()}.png`;
    const preview = document.querySelector<HTMLElement>("#result-preview");
    if (preview) {
      preview.replaceChildren();
      const img = document.createElement("img");
      img.src = url;
      img.alt = `${resultTeam}获胜的比赛结果图片`;
      preview.append(img);
      type SaveHandle = { createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }> };
      const picker = (window as Window & { showSaveFilePicker?: (options: object) => Promise<SaveHandle> }).showSaveFilePicker;
      if (picker) {
        const saveAs = document.createElement("button");
        saveAs.className = "button button--secondary";
        saveAs.dataset.action = "save-result-as";
        saveAs.textContent = "选择保存位置…";
        saveAs.addEventListener("click", async () => {
          saveAs.disabled = true;
          try {
            const binary = atob(url.split(",")[1]);
            const blob = new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type: "image/png" });
            const handle = await picker.call(window, { suggestedName: filename, startIn: "downloads", types: [{ description: "PNG 图片", accept: { "image/png": [".png"] } }] });
            const file = await handle.createWritable();
            await file.write(blob);
            await file.close();
            if (status) status.textContent = "图片已保存到你选择的位置。";
          } catch (error) {
            if (status) status.textContent = error instanceof DOMException && error.name === "AbortError"
              ? "已取消保存。图片仍在下方，可重新保存。"
              : "此窗口无法直接写入文件。请右键下方图片，选择“图片另存为…”。";
          } finally { saveAs.disabled = false; }
        });
        preview.prepend(saveAs);
      }
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    if (status) status.textContent = "图片已生成。若下载未成功，可选择保存位置，或右键下方图片选“图片另存为…”，保存到“下载”文件夹。";
  } catch {
    if (status) status.textContent = "图片生成失败，尚未保存文件。请重试。";
  }
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
    }
  firstTeam = firstTeam === "blue" ? "red" : "blue";
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
  const resolution = await loadCommittedSeed();
  pack = resolution.pack;
  contentError = resolution.error;
  if (pack && (pack.class_id !== "boya-quasi-intermediate-i" || pack.lessons.some((lesson) => !lesson.lesson_id.startsWith("boya-quasi-intermediate-i:lesson-")))) {
    pack = null;
    contentError = "教材不匹配，请打开《准中级加速篇 I》的完整游戏文件。";
  }
  renderHome();
}

void initialize();
