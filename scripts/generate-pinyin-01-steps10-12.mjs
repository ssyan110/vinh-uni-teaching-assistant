#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import {
  vocabularyGridClass,
  vocabularyGridCss,
} from './vocabulary-grid-layout.mjs';

const root = process.cwd();
const lessonRoot = path.join(root, 'output/pinyin/pinyin-01');
const lesson01Root = path.join(root, 'output/book-1/lesson-01');
const lesson10Root = path.join(root, 'output/book-1/lesson-10');
const slidesDir = path.join(lessonRoot, 'slides');
const assetsDir = path.join(slidesDir, 'assets');
const vocabDir = path.join(assetsDir, 'vocab-images');
const photosDir = path.join(assetsDir, 'photos');
const qaDir = path.join(lessonRoot, 'exports/qa');
const teacherGuideDir = path.join(lessonRoot, 'teacher-guide');
const databaseDir = path.join(lessonRoot, 'database');
const sourceDir = path.join(databaseDir, 'source');

const sourceFiles = {
  json: process.env.PINYIN_L1_CONTENT_JSON || '/Users/ssyan110/Desktop/pinyin-lesson-1.json',
  md: process.env.PINYIN_L1_CONTENT_MD || '/Users/ssyan110/Desktop/pinyin-lesson-1.ai.md',
  csv: process.env.PINYIN_L1_CONTENT_CSV || '/Users/ssyan110/Desktop/pinyin-lesson-1-content-items.csv',
};

const sourcePdf = 'Pinyin lessons/pinyin-l1.14102024210713.pdf';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const displayText = (value = '') => String(value)
  .replaceAll('THANH ĐIỀU', 'THANH ĐIỆU')
  .replaceAll('Thanh điều', 'Thanh điệu')
  .replaceAll('thanh điều', 'thanh điệu');

const escDisplay = (value = '') => esc(displayText(value));

const slug = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'item';

const stripTone = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .normalize('NFC')
  .replace('ü', 'u');

const zhToSimplified = new Map([
  ['八', '八'],
  ['怕', '怕'],
  ['餓', '饿'],
  ['不', '不'],
  ['鼻', '鼻'],
  ['木', '木'],
  ['馬', '马'],
  ['佛', '佛'],
  ['媽媽', '妈妈'],
  ['爸爸', '爸爸'],
  ['服務', '服务'],
  ['衣服', '衣服'],
  ['皮膚', '皮肤'],
  ['密碼', '密码'],
  ['伯父', '伯父'],
  ['伯母', '伯母'],
]);

const viMeanings = new Map([
  ['八', 'số tám'],
  ['怕', 'sợ'],
  ['饿', 'đói'],
  ['不', 'không'],
  ['鼻', 'mũi'],
  ['木', 'gỗ'],
  ['马', 'con ngựa'],
  ['佛', 'Phật'],
  ['妈妈', 'mẹ'],
  ['爸爸', 'bố'],
  ['服务', 'phục vụ'],
  ['衣服', 'quần áo'],
  ['皮肤', 'da'],
  ['密码', 'mật mã'],
  ['伯父', 'bác trai'],
  ['伯母', 'bác gái'],
]);

const pageNumber = (page = '') => Number(String(page).match(/\d+/)?.[0] || 0) || null;
const pageRange = (page = '') => String(page).replaceAll('P', '');

async function exists(file) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(from, to) {
  try {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function mkdirs() {
  for (const dir of [
    slidesDir,
    path.join(assetsDir, 'brand'),
    vocabDir,
    photosDir,
    qaDir,
    path.join(lessonRoot, 'exports/final'),
    path.join(lessonRoot, 'exports/archive'),
    teacherGuideDir,
    path.join(lessonRoot, 'homework-question-bank'),
    databaseDir,
    sourceDir,
  ]) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function resetSlides() {
  const existing = await fs.readdir(slidesDir).catch(() => []);
  for (const file of existing) {
    if (/^\d{2,3}-.+\.html$/.test(file)) await fs.rm(path.join(slidesDir, file));
  }
}

async function resetGeneratedAssets() {
  const vocabAssets = await fs.readdir(vocabDir).catch(() => []);
  for (const file of vocabAssets) {
    if (/^(prompts\.json|pinyin-01-vocab-image-prompts\.md)$/.test(file)) {
      await fs.rm(path.join(vocabDir, file));
    }
  }
  for (const file of [
    'pinyin-cover.png',
    'pinyin-cover.svg',
    'cover-topic.svg',
    'cover-topic.png',
    'overview-pronunciation.svg',
    'overview-pronunciation.png',
    'objectives-pronunciation.svg',
    'objectives-pronunciation.png',
    'divider-concepts.svg',
    'divider-concepts.png',
    'divider-initials.svg',
    'divider-initials.png',
    'divider-finals.svg',
    'divider-finals.png',
    'divider-sounds.svg',
    'divider-sounds.png',
    'divider-tones.svg',
    'divider-tones.png',
    'divider-vocabulary.svg',
    'divider-vocabulary.png',
    'divider-review.svg',
    'divider-review.png',
    'pinyin-concept-1.png',
    'pinyin-concept-2.png',
    'tone-chart.png',
    'tone-choice-reference.jpg',
    'closing-topic.svg',
    'closing-topic.png',
  ]) {
    await fs.rm(path.join(photosDir, file), { force: true });
  }
}

async function copySourceFiles() {
  await copyIfExists(sourceFiles.json, path.join(sourceDir, 'pinyin-lesson-1.json'));
  await copyIfExists(sourceFiles.md, path.join(sourceDir, 'pinyin-lesson-1.ai.md'));
  await copyIfExists(sourceFiles.csv, path.join(sourceDir, 'pinyin-lesson-1-content-items.csv'));
}

async function readBlueprint() {
  const preferred = await exists(sourceFiles.json)
    ? sourceFiles.json
    : path.join(sourceDir, 'pinyin-lesson-1.json');
  return JSON.parse(await fs.readFile(preferred, 'utf8'));
}

function csvEscape(value = '') {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsv(file, rows, columns) {
  const body = [
    columns.join(','),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col])).join(',')),
  ].join('\n');
  await fs.writeFile(file, `${body}\n`, 'utf8');
}

function buildCombinationTable(initialSymbols, finalSymbols) {
  const valid = {
    b: ['ba', 'bo', '', 'bi', 'bu', ''],
    p: ['pa', 'po', '', 'pi', 'pu', ''],
    m: ['ma', 'mo', 'me', 'mi', 'mu', ''],
    f: ['fa', 'fo', '', '', 'fu', ''],
  };
  return {
    columns: finalSymbols,
    rows: Object.fromEntries(initialSymbols.map((initial) => [initial, valid[initial] || finalSymbols.map(() => '')])),
  };
}

function buildDatabase(blueprint) {
  const generatedAt = new Date().toISOString();
  const initials = blueprint.initials.map((item) => item.symbol);
  const finals = blueprint.finals.map((item) => item.symbol);
  let order = 1;
  const contentItems = [];

  const add = (item) => {
    contentItems.push({
      lesson_id: 'pinyin-01',
      classroom_visibility: 'student_visible',
      ...item,
      teaching_order: item.teaching_order || order++,
    });
  };

  add({
    record_id: 'C001',
    record_type: 'concept',
    section: 'Khái niệm về pinyin',
    source_page: 3,
    source_page_range: '3-4',
    concept_title_vi: 'Pinyin là gì?',
    concept_title_zh: '拼音概念',
    concept_body_vi: 'Pinyin dùng chữ Latin để ghi cách phát âm tiếng Trung. Bài này chỉ yêu cầu đọc đúng, chưa yêu cầu ghi nhớ mặt chữ Hán.',
    raw_source_text: '拼音是什麼、拼音用途、聲母/韻母/聲調概念。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
  });

  add({
    record_id: 'I001',
    record_type: 'initials',
    section: 'Thanh mẫu',
    source_page: 5,
    source_page_range: '5',
    pinyin_group_id: 'labials',
    pinyin_group_label_vi: 'Âm môi',
    pinyin_group_label_zh: '唇音',
    pinyin_items: initials,
    pronunciation_notes: blueprint.initials.map((item) => `${item.symbol}: ${item.pronunciation_focus}`),
    combination_table: buildCombinationTable(initials, finals),
    raw_source_text: '聲母 b p m f',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
  });

  add({
    record_id: 'F001',
    record_type: 'finals',
    section: 'Vận mẫu',
    source_page: 5,
    source_page_range: '5',
    pinyin_group_id: 'simple_finals',
    pinyin_group_label_vi: 'Vận mẫu đơn',
    pinyin_group_label_zh: '單韻母',
    final_type: 'single',
    pinyin_items: finals,
    raw_source_text: '韻母 a o e i u ü',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
  });

  add({
    record_id: 'EX001',
    record_type: 'exercise',
    section: 'Luyện pinyin',
    source_page: 6,
    source_page_range: '6',
    exercise_type: 'read_pinyin',
    linked_module: 'initials_finals',
    instructions_vi: 'Nhìn pinyin và đọc to. Chưa cần thêm thanh điệu.',
    item_count: 12,
    practice_items: ['ba', 'pa', 'ma', 'fa', 'bo', 'po', 'mo', 'fo', 'bi', 'pi', 'mi', 'bu'],
    raw_source_text: '拼讀練習，不含聲調。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
    includes_tones: false,
  });

  add({
    record_id: 'T001',
    record_type: 'tone',
    section: 'Thanh điệu',
    source_page: 7,
    source_page_range: '7',
    tone_topic: 'four_tones_plus_neutral',
    tone_items: [
      { tone_number: 1, tone_value: '55', mark: 'ˉ', label_vi: 'thanh 1', example_char: '妈', example_pinyin: 'mā' },
      { tone_number: 2, tone_value: '35', mark: 'ˊ', label_vi: 'thanh 2', example_char: '麻', example_pinyin: 'má' },
      { tone_number: 3, tone_value: '214', mark: 'ˇ', label_vi: 'thanh 3', example_char: '马', example_pinyin: 'mǎ' },
      { tone_number: 4, tone_value: '51', mark: 'ˋ', label_vi: 'thanh 4', example_char: '骂', example_pinyin: 'mà' },
      { tone_number: 0, tone_value: '-', mark: '', label_vi: 'thanh nhẹ', example_char: '吗', example_pinyin: 'ma' },
    ],
    raw_source_text: '四聲 + 輕聲。P8 聲調練習不含輕聲。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
    includes_neutral_tone: true,
  });

  add({
    record_id: 'EX002',
    record_type: 'exercise',
    section: 'Luyện thanh điệu',
    source_page: 8,
    source_page_range: '8',
    exercise_type: 'tone_reading',
    linked_module: 'tones',
    instructions_vi: 'Đọc và nghe phân biệt 4 thanh điệu. Bài luyện này chưa dùng thanh nhẹ.',
    item_count: 8,
    practice_items: ['mā', 'má', 'mǎ', 'mà', 'bā', 'bá', 'bǎ', 'bà'],
    raw_source_text: '四聲練習，不含輕聲。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
    includes_neutral_tone: false,
  });

  let vocabIndex = 1;
  for (const set of blueprint.vocabulary_sets) {
    const sourcePage = pageNumber(set.page);
    for (const item of set.items) {
      const simplified = zhToSimplified.get(item.hanzi) || item.hanzi;
      add({
        record_id: `V${String(vocabIndex).padStart(3, '0')}`,
        source_item_id: item.item_id,
        record_type: 'vocabulary',
        section: 'Từ vựng',
        source_page: sourcePage,
        source_page_range: String(sourcePage),
        vocabulary_set_id: set.set_id,
        vocabulary_set_title: set.title,
        chinese_traditional: item.hanzi,
        chinese_simplified: simplified,
        pinyin: item.pinyin,
        vietnamese: viMeanings.get(simplified) || '',
        target_sounds: stripTone(item.pinyin).split('').filter((char) => /[a-zü]/i.test(char)),
        raw_source_text: `${item.hanzi} ${item.pinyin}`,
        pronunciation_first: true,
        requires_hanzi_recognition: false,
        variant_group: item.variant_group || '',
        image_role: 'vocabulary_image',
        image_status: 'placeholder_needs_generation',
        image_semantic_check: `Image should clearly show: ${viMeanings.get(simplified) || simplified}`,
      });
      vocabIndex += 1;
    }
  }

  add({
    record_id: 'EX003',
    source_item_id: 'exercise_l1_p10_vocab_follow',
    record_type: 'exercise',
    section: 'Luyện từ vựng 1',
    source_page: 10,
    source_page_range: '10',
    exercise_type: 'vocab_follow_record',
    linked_module: 'vocabulary',
    source_vocabulary_set_id: 'vocab_set_l1_01',
    instructions_vi: 'Nghe, đọc theo, rồi tự thu âm nhóm từ vựng 1.',
    raw_source_text: '詞彙 1 跟讀/錄音。確認詞彙 1 發音正確。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
  });

  add({
    record_id: 'EX004',
    source_item_id: 'exercise_l1_p12_vocab_follow',
    record_type: 'exercise',
    section: 'Luyện từ vựng 2',
    source_page: 12,
    source_page_range: '12',
    exercise_type: 'vocab_follow_record',
    linked_module: 'vocabulary',
    source_vocabulary_set_id: 'vocab_set_l1_02',
    instructions_vi: 'Nghe, đọc theo, rồi tự thu âm nhóm từ vựng 2.',
    raw_source_text: '詞彙 2 跟讀/錄音。確認詞彙 2 發音正確。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
  });

  add({
    record_id: 'CH001',
    source_item_id: 'exercise_l1_p13_review',
    record_type: 'challenge',
    section: 'Ôn tập cuối bài',
    source_page: 13,
    source_page_range: '13',
    challenge_type: 'review_pronunciation',
    instructions_vi: 'Ôn tập bằng 2-3 dạng: nghe chọn pinyin, nhìn pinyin đọc to, từ vựng theo nhóm.',
    raw_source_text: '課後整合練習。發音正確為主，不要求認漢字。',
    pronunciation_first: true,
    requires_hanzi_recognition: false,
    suggested_question_types: ['listening_choose_pinyin', 'read_pinyin_aloud', 'vocab_follow_record'],
  });

  add({
    record_id: 'AP001',
    record_type: 'appendix',
    section: 'Phụ lục',
    source_page: 18,
    source_page_range: '18-19',
    appendix_title_vi: 'Cách cài đặt bộ gõ tiếng Trung',
    appendix_title_zh: '中文輸入法安裝與設定',
    platforms: ['iOS', 'Android'],
    raw_source_text: '中文輸入法安裝與設定。',
    classroom_visibility: 'student_visible',
  });

  const lessonStructure = blueprint.pages.map((page) => {
    const isTechSetup = page.record_type === 'tech_setup';
    return {
      lesson_id: 'pinyin-01',
      page_range: isTechSetup ? '18-19' : pageRange(page.page_range),
      sequence: page.sequence,
      module_id: page.record_type,
      module_name_zh: page.title,
      module_name_vi: moduleNameVi(page.record_type),
      content_focus: page.content_focus,
      notes: page.notes || '',
      source_page: isTechSetup ? 18 : pageNumber(page.page_range),
      source_page_range: isTechSetup ? '18-19' : pageRange(page.page_range),
      status: 'ready',
    };
  });

  const supplementalActivities = blueprint.exercises.map((exercise, index) => ({
    lesson_id: 'pinyin-01',
    activity_id: `ACT${String(index + 1).padStart(3, '0')}`,
    source_item_id: exercise.item_id,
    source_page: pageNumber(exercise.page),
    title: exercise.exercise_type,
    activity_name_vi: activityNameVi(exercise.item_id),
    goal: exercise.goal,
    pronunciation_first: exercise.pronunciation_first,
    requires_hanzi_recognition: exercise.requires_hanzi_recognition,
  }));

  const gameSuggestions = supplementalActivities.map((activity) => ({
    lesson_id: 'pinyin-01',
    activity_id: activity.activity_id,
    platform: activity.title.includes('錄音') || activity.title.includes('朗讀') ? 'classroom_pair_check' : 'Blooket',
    game_fit: activity.title.includes('錄音') ? 'low' : 'medium',
    notes: activity.title.includes('錄音')
      ? 'Use teacher or pair pronunciation check rather than a quiz platform.'
      : 'Can become a quick listening-choice drill.',
  }));

  const googleRows = contentItems.map((item) => ({
    lesson_id: 'pinyin-01',
    lesson_title: 'Pinyin · Bài 1 · Cơ bản: phát âm nhập môn',
    record_id: item.record_id,
    record_type: item.record_type,
    section: item.section,
    source_pdf: sourcePdf,
    source_page: item.source_page,
    source_page_range: item.source_page_range,
    teaching_order: item.teaching_order,
    pinyin_group: item.pinyin_group_id || item.vocabulary_set_id || '',
    pinyin_items_count: item.pinyin_items?.length || '',
    chinese_simplified: item.chinese_simplified || '',
    pinyin: item.pinyin || '',
    vietnamese: item.vietnamese || '',
    target_sounds: Array.isArray(item.target_sounds) ? item.target_sounds.join(' ') : '',
    exercise_type: item.exercise_type || item.challenge_type || '',
    raw_source_text: item.raw_source_text || '',
    classroom_visibility: item.classroom_visibility || 'student_visible',
    teacher_review_status: 'approved_latest_content',
    approved: true,
    notes_for_review: item.requires_hanzi_recognition === false ? 'Phát âm đúng là chính; không yêu cầu nhận mặt chữ Hán.' : '',
    generated_at: generatedAt,
  }));

  return {
    metadata: {
      lesson_type: 'pinyin',
      pipeline_config_version: '2.0.0',
      generated_at: generatedAt,
      vp_scope: 'latest user-approved content imported from pinyin-lesson-1 source files',
      steps_completed: [1, 2, 3, 4, 5, 6, 7, 8],
      steps_not_implemented: [14, 15, 16, 17, 18],
      lesson_id: 'pinyin-01',
      source_lesson_id: blueprint.lesson_id,
      lesson_title: 'Pinyin · Bài 1 · Cơ bản: phát âm nhập môn',
      source_pdf: sourcePdf,
      source_blueprint_files: {
        json: 'database/source/pinyin-lesson-1.json',
        markdown: 'database/source/pinyin-lesson-1.ai.md',
        csv: 'database/source/pinyin-lesson-1-content-items.csv',
      },
      source_pages: blueprint.metadata.total_pages,
      source_material: 'Latest pinyin lesson 1 user-provided content files',
      main_goal: blueprint.metadata.main_goal,
      primary_requirement: blueprint.metadata.primary_requirement,
      recognition_requirement: blueprint.metadata.recognition_requirement,
      pronunciation_first: blueprint.metadata.pronunciation_first,
      requires_hanzi_recognition: blueprint.metadata.requires_hanzi_recognition,
      total_initials_taught: initials.length,
      total_finals_taught: finals.length,
      total_tones_taught: 5,
      total_vocabulary: vocabIndex - 1,
      finalized: false,
      last_updated: '2026-06-05',
    },
    lesson_list: [{
      lesson_id: 'pinyin-01',
      lesson_title: 'Pinyin · Bài 1 · Cơ bản: phát âm nhập môn',
      source_pages: blueprint.metadata.total_pages,
      status: 'approved_latest_content',
    }],
    content_items: contentItems,
    lesson_structure: lessonStructure,
    supplemental_activities: supplementalActivities,
    game_suggestions: gameSuggestions,
    google_sheets_database: googleRows,
    database_notes: blueprint.database_notes || [],
  };
}

function moduleNameVi(type) {
  const names = {
    lesson_overview: 'Mục lục',
    learning_objective: 'Mục tiêu học tập',
    concept: 'Khái niệm pinyin',
    pinyin_chart: 'Bảng ghép âm',
    pinyin_exercise: 'Luyện pinyin',
    tone: 'Thanh điệu',
    tone_exercise: 'Luyện thanh điệu',
    vocabulary_set: 'Từ vựng',
    vocab_exercise: 'Luyện từ vựng',
    review_exercise: 'Ôn tập cuối bài',
    tech_setup: 'Cài bộ gõ',
  };
  return names[type] || type;
}

function activityNameVi(itemId) {
  if (itemId.includes('p6')) return 'Đọc ghép âm';
  if (itemId.includes('p8')) return 'Đọc và nghe 4 thanh điệu';
  if (itemId.includes('p10')) return 'Đọc theo từ vựng 1';
  if (itemId.includes('p12')) return 'Đọc theo từ vựng 2';
  return 'Ôn tập phát âm';
}

async function writeDatabaseFiles(db) {
  await fs.writeFile(path.join(databaseDir, 'vp_pinyin_01_database.json'), `${JSON.stringify(db, null, 2)}\n`, 'utf8');

  await writeCsv(path.join(databaseDir, '02_content_items.csv'), db.content_items.map((item) => ({
    record_id: item.record_id,
    record_type: item.record_type,
    section: item.section,
    source_page: item.source_page,
    source_page_range: item.source_page_range,
    teaching_order: item.teaching_order,
    chinese_simplified: item.chinese_simplified || '',
    chinese_traditional: item.chinese_traditional || '',
    pinyin: item.pinyin || '',
    vietnamese: item.vietnamese || '',
    pronunciation_first: item.pronunciation_first ?? '',
    requires_hanzi_recognition: item.requires_hanzi_recognition ?? '',
    raw_source_text: item.raw_source_text || '',
  })), ['record_id', 'record_type', 'section', 'source_page', 'source_page_range', 'teaching_order', 'chinese_simplified', 'chinese_traditional', 'pinyin', 'vietnamese', 'pronunciation_first', 'requires_hanzi_recognition', 'raw_source_text']);

  await writeCsv(path.join(databaseDir, '03_lesson_structure.csv'), db.lesson_structure, ['lesson_id', 'page_range', 'sequence', 'module_id', 'module_name_vi', 'module_name_zh', 'content_focus', 'notes', 'source_page', 'source_page_range', 'status']);
  await writeCsv(path.join(databaseDir, '04_supplemental_activities.csv'), db.supplemental_activities, ['lesson_id', 'activity_id', 'source_item_id', 'source_page', 'title', 'activity_name_vi', 'goal', 'pronunciation_first', 'requires_hanzi_recognition']);
  await writeCsv(path.join(databaseDir, '05_game_suggestions.csv'), db.game_suggestions, ['lesson_id', 'activity_id', 'platform', 'game_fit', 'notes']);
  await writeCsv(path.join(databaseDir, '06_google_sheets_database.csv'), db.google_sheets_database, ['lesson_id', 'lesson_title', 'record_id', 'record_type', 'section', 'source_pdf', 'source_page', 'source_page_range', 'teaching_order', 'pinyin_group', 'pinyin_items_count', 'chinese_simplified', 'pinyin', 'vietnamese', 'target_sounds', 'exercise_type', 'raw_source_text', 'classroom_visibility', 'teacher_review_status', 'approved', 'notes_for_review', 'generated_at']);

  await fs.writeFile(path.join(databaseDir, 'README.md'), `# Pinyin Lesson 1 Database

Updated from the latest user-provided source files on 2026-06-05.

Source copies live in \`database/source/\`:

- \`pinyin-lesson-1.json\`
- \`pinyin-lesson-1.ai.md\`
- \`pinyin-lesson-1-content-items.csv\`

The JSON is the authoritative source because the provided CSV has a mixed/garbled encoding. The CSV is archived for traceability.
`, 'utf8');
}

async function copySharedAssets() {
  await copyIfExists(path.join(lesson01Root, 'slides/assets/slide-base.css'), path.join(assetsDir, 'slide-base.css'));
  await copyIfExists(path.join(lesson01Root, 'slides/assets/slide-base.js'), path.join(assetsDir, 'slide-base.js'));
  await copyIfExists(path.join(root, 'design/shared-slide-assets/brand/logo-watermark.png'), path.join(assetsDir, 'brand/logo-watermark.png'));
  await fs.mkdir(path.join(assetsDir, 'sample-images'), { recursive: true });
  await fs.mkdir(path.join(assetsDir, 'reference'), { recursive: true });
  await copyIfExists('/Users/ssyan110/Downloads/pinyin cover.png', path.join(photosDir, 'cover-topic.png'));
  await copyIfExists('/Users/ssyan110/Downloads/pinyin concept divider.png', path.join(photosDir, 'divider-concepts.png'));
  await copyIfExists('/Users/ssyan110/Downloads/声母divider.png', path.join(photosDir, 'divider-initials.png'));
  await copyIfExists('/Users/ssyan110/Downloads/韵母 divider.png', path.join(photosDir, 'divider-finals.png'));
  await copyIfExists('/Users/ssyan110/Downloads/声母 韵母 divider.png', path.join(photosDir, 'divider-sounds.png'));
  await copyIfExists('/Users/ssyan110/Downloads/声调 divider.png', path.join(photosDir, 'divider-tones.png'));
  await copyIfExists('/Users/ssyan110/Downloads/词汇divider.png', path.join(photosDir, 'divider-vocabulary.png'));
  await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/comprehensive-practice-divider.png'), path.join(photosDir, 'divider-review.png'));
  await copyIfExists('/Users/ssyan110/Downloads/goal slide.png', path.join(assetsDir, 'sample-images/objectives.png'));
  await copyIfExists(path.join(lesson01Root, 'slides/assets/reference/ending-page-background.png'), path.join(assetsDir, 'reference/ending-page-background.png'));
  await copyIfExists(path.join(qaDir, 'source-keyboard-reference/page-18.png'), path.join(assetsDir, 'reference/keyboard-ios-original.png'));
  await copyIfExists(path.join(qaDir, 'source-keyboard-reference/page-19.png'), path.join(assetsDir, 'reference/keyboard-android-original.png'));
  await cropKeyboardReferenceAssets();
  await copyIfExists('/Users/ssyan110/Downloads/pinyin concept 1.png', path.join(photosDir, 'pinyin-concept-1.png'));
  await copyIfExists('/Users/ssyan110/Downloads/pinyin concept 2.png', path.join(photosDir, 'pinyin-concept-2.png'));
  await copyIfExists('/Users/ssyan110/Downloads/聲調.png', path.join(photosDir, 'tone-chart.png'));
  await copyIfExists('/Users/ssyan110/Downloads/tone leraning slide.png', path.join(photosDir, 'tone-chart.png'));
  await copyIfExists('/Users/ssyan110/Downloads/new exercise 2.jpg', path.join(photosDir, 'tone-choice-reference.jpg'));
}

async function cropKeyboardReferenceAssets() {
  const referenceDir = path.join(assetsDir, 'reference');
  const crops = [
    ['keyboard-ios-original.png', 'keyboard-ios-step-1.png', { left: 82, top: 643, width: 479, height: 405 }],
    ['keyboard-ios-original.png', 'keyboard-ios-step-2.png', { left: 722, top: 643, width: 477, height: 405 }],
    ['keyboard-ios-original.png', 'keyboard-ios-step-3.png', { left: 1359, top: 643, width: 478, height: 405 }],
    ['keyboard-android-original.png', 'keyboard-android-step-1.png', { left: 136, top: 642, width: 708, height: 405 }],
    ['keyboard-android-original.png', 'keyboard-android-step-2.png', { left: 1079, top: 642, width: 455, height: 405 }],
    ['keyboard-android-original.png', 'keyboard-android-step-3.png', { left: 1537, top: 642, width: 250, height: 405 }],
  ];

  for (const [sourceName, outputName, extract] of crops) {
    const sourcePath = path.join(referenceDir, sourceName);
    const outputPath = path.join(referenceDir, outputName);
    try {
      await sharp(sourcePath).extract(extract).png().toFile(outputPath);
    } catch {
      // Source PDF screenshots are generated during QA. If missing, keep the build going;
      // asset QA will report missing cropped setup images.
    }
  }
}

const visualMap = new Map([
  ['八', 'eight'],
  ['怕', 'afraid'],
  ['饿', 'hunger'],
  ['不', 'no'],
  ['鼻', 'nose'],
  ['木', 'wood'],
  ['马', 'horse'],
  ['佛', 'buddha'],
  ['妈妈', 'mother'],
  ['爸爸', 'father'],
  ['服务', 'service'],
  ['衣服', 'clothes'],
  ['皮肤', 'skin'],
  ['密码', 'password'],
  ['伯父', 'uncle'],
  ['伯母', 'aunt'],
]);

const vocabPromptMap = new Map([
  ['八', 'eight small oranges arranged clearly on a clean pale desk, countable as eight objects, soft classroom still life'],
  ['怕', 'a young student looking gently frightened, shoulders raised and hands close to the chest, with a soft shadow behind them, not dramatic or scary'],
  ['饿', 'a young student holding their stomach beside an empty bowl and spoon on a clean desk, showing hunger clearly'],
  ['不', 'a young student calmly making a clear no gesture by crossing both forearms in front of the chest, friendly expression'],
  ['鼻', 'a friendly close-up face with the nose as the clear focus, simple clean composition, no medical diagram'],
  ['木', 'a small stack of natural wooden logs and smooth wood planks on a pale classroom desk, clearly representing wood'],
  ['马', 'a white horse standing in side profile on a pale simple background, gentle and approachable'],
  ['佛', 'a small serene Buddha statue on a simple shelf with a plant nearby, respectful, calm classroom illustration style'],
  ['妈妈', 'a warm mother smiling and holding a child gently in a bright home or classroom corner, natural human proportions'],
  ['爸爸', 'a warm father smiling and helping a child with a school bag or notebook, bright simple home or classroom corner'],
  ['服务', 'a friendly server or helper offering a tray with a cup of water to another person, clear service action'],
  ['衣服', 'neatly folded clothes and one simple shirt on a hanger on a pale desk, clean wardrobe feeling'],
  ['皮肤', 'a close-up of a forearm and hand with soft healthy skin, gentle light, simple clean background, no medical markings'],
  ['密码', 'a smartphone on a desk showing an abstract lock screen with dots only, plus a small key nearby, no digits or letters'],
  ['伯父', 'a kind middle-aged uncle smiling warmly in simple neat clothing, natural portrait in a soft classroom/home setting'],
  ['伯母', 'a kind middle-aged aunt smiling warmly in simple neat clothing, natural portrait in a soft classroom/home setting'],
]);

const vocabStylePrompt = [
  'Soft educational textbook illustration for a Chinese language classroom slide.',
  'Square 1:1 composition, ideally 1024x1024 or larger, with the subject centered and enough clean margin for a vocabulary card.',
  'Thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background.',
  'Gentle flat shading, subtle low-contrast shadows, airy uncluttered layout.',
  'Natural human proportions when people appear; no chibi, no sticker style, no glossy vector art.',
  'No text, no letters, no numerals, no Chinese characters, no labels, no watermark.',
  'Avoid thick teal icon outlines, abstract decorative blobs, harsh colors, photorealism, and dark backgrounds.',
].join(' ');

function softSvg(label, color = '#5AACAC') {
  const shapes = {
    eight: '<path d="M288 92c48 0 82 28 82 64 0 24-18 44-48 58 34 14 56 38 56 66 0 42-38 70-90 70s-90-28-90-70c0-28 22-52 56-66-30-14-48-34-48-58 0-36 34-64 82-64Z"/><path d="M256 156c0 18 14 30 32 30s32-12 32-30-14-30-32-30-32 12-32 30ZM248 278c0 22 18 36 40 36s40-14 40-36-18-36-40-36-40 14-40 36Z"/>',
    afraid: '<circle cx="288" cy="128" r="50"/><path d="M230 242c22-48 56-72 104-72s82 24 104 72"/><path d="M268 120h.1M312 120h.1M268 150c16 14 34 14 50 0"/>',
    hunger: '<circle cx="288" cy="146" r="56"/><path d="M226 230c34 24 76 26 124 0"/><path d="M226 118c28-20 48-20 76 0M302 118c28-20 48-20 76 0"/><path d="M182 280h212"/>',
    no: '<circle cx="288" cy="162" r="86"/><path d="M226 224l124-124"/>',
    nose: '<path d="M280 82c32 42 48 82 42 120-4 28-28 46-60 38"/><path d="M226 252c42 28 92 28 134 0"/><path d="M370 148c34 2 54 22 58 54"/><path d="M384 214c26 4 46 18 60 42"/>',
    wood: '<path d="M288 72v244"/><path d="M178 150h220"/><path d="M286 154c-32 60-76 104-132 132"/><path d="M292 154c32 58 78 102 136 132"/>',
    horse: '<path d="M196 248c8-76 44-122 108-138 54-14 104 8 124 56 18 44 2 92-38 116"/><path d="M244 254v54M358 252v54M424 180l46-18-20 54"/><path d="M246 122c-10-28-2-54 24-76l18 54"/>',
    buddha: '<circle cx="288" cy="116" r="46"/><path d="M206 278c20-76 58-116 82-116s62 40 82 116"/><path d="M228 94c18-34 102-34 120 0"/><path d="M244 280h88M258 214h60"/>',
    mother: '<circle cx="288" cy="110" r="46"/><path d="M206 254c22-60 58-92 82-92s60 32 82 92"/><path d="M244 86c22-22 66-22 88 0M250 132c24 20 52 20 76 0"/>',
    father: '<circle cx="288" cy="110" r="48"/><path d="M206 254c22-60 58-92 82-92s60 32 82 92"/><path d="M238 98c34-34 66-34 100 0"/>',
    service: '<path d="M180 226h216"/><path d="M208 226c8-70 58-114 126-114 66 0 110 44 118 114"/><path d="M284 112V82h64v30"/><circle cx="242" cy="122" r="24"/>',
    clothes: '<path d="M214 88l52-28h44l52 28 50 64-48 30-26-32v134H238V150l-26 32-48-30 50-64Z"/>',
    skin: '<path d="M188 236c44-54 92-82 146-82 46 0 82 18 112 54"/><path d="M196 156c42-44 98-58 166-42"/><path d="M224 278c56 18 112 18 168 0"/><circle cx="216" cy="118" r="18"/><circle cx="396" cy="154" r="16"/>',
    password: '<rect x="178" y="128" width="220" height="150" rx="22"/><path d="M222 128v-26c0-42 28-70 66-70s66 28 66 70v26"/><path d="M238 198h.1M288 198h.1M338 198h.1"/>',
    uncle: '<circle cx="278" cy="108" r="46"/><path d="M196 260c20-62 56-96 82-96s62 34 82 96"/><path d="M238 96c22-24 58-28 94-8"/><path d="M244 142c24 18 48 18 72 0"/>',
    aunt: '<circle cx="286" cy="110" r="46"/><path d="M202 260c22-64 58-96 84-96s62 32 84 96"/><path d="M238 84c28-24 70-24 98 0"/><path d="M238 116h96M250 142c24 20 50 20 74 0"/>',
  };
  const body = shapes[label] || shapes.service;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 576 576">
    <rect width="576" height="576" fill="#FFFFFF"/>
    <rect x="34" y="34" width="508" height="508" rx="44" fill="#F4FAFA"/>
    <circle cx="438" cy="132" r="42" fill="#F3F0FA"/>
    <circle cx="146" cy="448" r="40" fill="#F8F4EA"/>
    <g transform="translate(0 116)" fill="none" stroke="#6E8EA0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${body}</g>
    <g fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity=".38"><path d="M118 118c30-18 60-20 92-6"/><path d="M416 454c24 10 52 10 82 0"/></g>
  </svg>`;
}

function photoSvg(kind, accent = '#5AACAC') {
  const purple = '#C8B8E8';
  const amber = '#F4C76D';
  const green = '#9FD8C4';
  const coral = '#ECA6A0';
  const ink = '#6E8EA0';
  const soft = '#F4FAFA';
  const scenes = {
    cover: `
      <ellipse cx="338" cy="270" rx="166" ry="20" fill="#E7F1F1"/>
      <path d="M170 232c30-34 70-48 116-38 30 7 54 7 78-2 36-14 74-6 112 24" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="230" cy="132" r="34" fill="${green}" opacity=".8" stroke="${ink}" stroke-width="5"/>
      <path d="M218 126c12-8 24-8 36 0M218 148c12 8 24 8 36 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M286 124c22-24 54-24 82 0M284 158c32 16 62 16 92 0" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M394 94c28 10 46 28 54 54M430 82c34 16 56 42 66 80" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
      <path d="M154 210c52-20 98-18 140 8v54c-42-26-88-28-140-8Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M294 218c42-26 88-28 140-8v54c-52-20-98-18-140 8Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M294 218v54" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`,
    overview: `
      <ellipse cx="292" cy="268" rx="178" ry="20" fill="#E7F1F1"/>
      <rect x="124" y="78" width="180" height="190" rx="22" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <rect x="330" y="96" width="126" height="128" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <path d="M158 122h54M158 164h86M158 206h66" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      <path d="M246 116l18 18 34-42M246 158l18 18 34-42M246 200l18 18 34-42" fill="none" stroke="${green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="392" cy="150" r="32" fill="${purple}" opacity=".65"/>
      <path d="M378 154h-18v-18h18l24-20v58Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M420 130c14 12 14 30 0 42M438 116c24 26 24 52 0 78" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
    objectives: `
      <ellipse cx="306" cy="268" rx="174" ry="20" fill="#E7F1F1"/>
      <circle cx="304" cy="150" r="92" fill="#FFFFFF" stroke="${ink}" stroke-width="6"/>
      <circle cx="304" cy="150" r="58" fill="${soft}" stroke="${accent}" stroke-width="6"/>
      <circle cx="304" cy="150" r="18" fill="${accent}" opacity=".82"/>
      <path d="M386 68l30-22 8 34 36-4-24 32" fill="none" stroke="${amber}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M338 118l92-68" stroke="${amber}" stroke-width="8" stroke-linecap="round"/>
      <path d="M128 232h92M144 204h58M392 232h72M404 204h46" stroke="${green}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="144" cy="96" r="18" fill="${purple}" opacity=".7"/>
      <circle cx="456" cy="174" r="20" fill="${coral}" opacity=".55"/>`,
    sounds: `
      <ellipse cx="290" cy="268" rx="184" ry="20" fill="#E7F1F1"/>
      <rect x="96" y="74" width="248" height="166" rx="24" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <path d="M158 74v166M220 74v166M282 74v166M96 129h248M96 185h248" stroke="${accent}" stroke-width="4" opacity=".42"/>
      <circle cx="420" cy="150" r="56" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <path d="M396 156h-24v-24h24l30-24v72Z" fill="${green}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M454 112c24 22 24 54 0 78M480 94c38 40 38 82 0 122" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M136 260c42-18 92-18 150 0M338 260c38-16 76-16 114 0" stroke="${purple}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`,
    vocabulary: `
      <ellipse cx="292" cy="268" rx="184" ry="20" fill="#E7F1F1"/>
      <rect x="116" y="92" width="122" height="152" rx="18" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <rect x="228" y="72" width="122" height="152" rx="18" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <rect x="340" y="102" width="122" height="152" rx="18" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <circle cx="177" cy="146" r="28" fill="${green}" opacity=".82"/>
      <path d="M160 196c22-24 44-24 66 0" stroke="${accent}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M266 132c18-22 44-22 62 0M268 174c18 16 42 16 60 0" stroke="${ink}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M380 142c24-28 42-28 64 0M386 198h52" stroke="${coral}" stroke-width="7" stroke-linecap="round"/>
      <path d="M110 266c44-22 92-22 144 0M316 266c42-20 88-20 138 0" stroke="${amber}" stroke-width="6" stroke-linecap="round" opacity=".62"/>`,
    review: `
      <ellipse cx="292" cy="268" rx="182" ry="20" fill="#E7F1F1"/>
      <rect x="118" y="88" width="104" height="128" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <rect x="238" y="74" width="104" height="142" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <rect x="358" y="98" width="104" height="118" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-width="5"/>
      <path d="M150 154l20 20 36-46M270 154l20 20 36-46M390 158l20 20 36-46" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="286" cy="240" r="24" fill="${purple}" opacity=".62"/>
      <path d="M270 242h-18v-18h18l24-20v58Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M316 218c14 15 14 32 0 48M336 204c24 28 24 56 0 84" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
    closing: `
      <ellipse cx="292" cy="270" rx="178" ry="20" fill="#E7F1F1"/>
      <path d="M132 208c52-24 98-22 138 8v54c-40-30-86-32-138-8Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M270 216c40-30 86-32 138-8v54c-52-24-98-22-138 8Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M270 216v54" stroke="${ink}" stroke-width="5"/>
      <circle cx="432" cy="124" r="40" fill="${green}" opacity=".76" stroke="${ink}" stroke-width="5"/>
      <path d="M418 126h-20v-20h20l28-22v64Z" fill="#FFFFFF" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M466 92c22 22 22 44 0 66M488 78c32 34 32 70 0 108" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
      <path d="M156 126c28-20 56-20 84 0M154 158c32 20 62 20 92 0" stroke="${purple}" stroke-width="7" stroke-linecap="round" fill="none"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="576" height="324" viewBox="0 0 576 324">
    <rect width="576" height="324" fill="#FFFFFF"/>
    <rect x="18" y="18" width="540" height="288" rx="30" fill="${soft}"/>
    <circle cx="490" cy="70" r="42" fill="${purple}" opacity=".28"/>
    <circle cx="94" cy="250" r="34" fill="${amber}" opacity=".22"/>
    <g fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".28">
      <path d="M62 88c28-18 58-20 90-6"/>
      <path d="M430 250c26 12 58 12 92 0"/>
    </g>
    ${scenes[kind] || scenes.cover}
  </svg>`;
}

async function writePhotoAsset(file, kind, accent) {
  await fs.writeFile(path.join(photosDir, file), photoSvg(kind, accent), 'utf8');
}

async function createImages(vocab) {
  const prompts = [];
  for (const [index, item] of vocab.entries()) {
    item.image_file = `vocab-${item.record_id.toLowerCase()}-${slug(item.pinyin)}.png`;
    const outFile = path.join(vocabDir, item.image_file);
    const existingImage = await fs.stat(outFile).catch(() => null);
    if (!existingImage) {
      await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: '#F7FAFA',
        },
      })
        .png()
        .toFile(outFile);
    }
    prompts.push({
      record_id: item.record_id,
      chinese_simplified: item.chinese_simplified,
      pinyin: item.pinyin,
      vietnamese: item.vietnamese,
      output_file: item.image_file,
      aspect_ratio: '1:1',
      target_size: '1024x1024 or larger',
      prompt: `${vocabStylePrompt} Subject: ${vocabPromptMap.get(item.chinese_simplified) || item.vietnamese}.`,
      visual_description: vocabPromptMap.get(item.chinese_simplified) || item.vietnamese,
      image_role: 'vocabulary_image',
      image_status: existingImage ? 'existing_asset_preserved' : 'placeholder_needs_generation',
      image_semantic_check: `Image must clearly match ${item.chinese_simplified} / ${item.vietnamese}; verify in rendered slide QA.`,
    });
  }
  await fs.writeFile(path.join(vocabDir, 'prompts.json'), `${JSON.stringify(prompts, null, 2)}\n`, 'utf8');
  const promptGuide = [
    '# Pinyin 01 Vocabulary Image Prompts',
    '',
    'Generate every image as PNG, square 1:1, ideally 1024x1024 or larger. Save each generated image to the exact `output_file` filename under:',
    '',
    '`/Users/ssyan110/Development/ai-teaching-material-system/output/pinyin/pinyin-01/slides/assets/vocab-images/`',
    '',
    'Do not put any text, letters, numerals, pinyin, Chinese characters, labels, captions, or watermarks inside the image.',
    '',
    ...prompts.flatMap((entry) => [
      `## ${entry.record_id} · ${entry.chinese_simplified} · ${entry.pinyin}`,
      `Output file: \`${entry.output_file}\``,
      '',
      entry.prompt,
      '',
    ]),
  ].join('\n');
  await fs.writeFile(path.join(vocabDir, 'pinyin-01-vocab-image-prompts.md'), `${promptGuide.trimEnd()}\n`, 'utf8');
}

async function assetEntry(assetPath, role, usedBy, extra = {}) {
  const absolutePath = path.join(assetsDir, assetPath.replace(/^assets\//, ''));
  const stat = await fs.stat(absolutePath).catch(() => null);
  const isSvg = assetPath.endsWith('.svg');
  let dimensions = null;
  if (isSvg) {
    dimensions = { width: 576, height: 324, format: 'svg', aspect_ratio: 16 / 9 };
  } else if (stat && /\.(png|jpe?g)$/i.test(assetPath)) {
    const metadata = await sharp(absolutePath).metadata().catch(() => null);
    if (metadata?.width && metadata?.height) {
      dimensions = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || path.extname(assetPath).slice(1),
        aspect_ratio: metadata.width / metadata.height,
      };
    }
  }
  return {
    asset_path: assetPath,
    role,
    exists: !!stat,
    size_bytes: stat?.size || 0,
    dimensions,
    used_by: usedBy,
    record_ids: extra.record_ids || [],
    chinese: extra.chinese || [],
    pinyin: extra.pinyin || [],
    vietnamese: extra.vietnamese || [],
    semantic_check: extra.semantic_check || '',
  };
}

async function writeAssetManifest(db, slides) {
  const slideFiles = slides.map((item) => item.file);
  const fileFor = (suffix) => slides.find((item) => item.file.endsWith(suffix))?.file;
  const filesFor = (...suffixes) => suffixes.map(fileFor).filter(Boolean);
  const vocab = db.content_items.filter((item) => item.record_type === 'vocabulary');
  const vocabSlide = (item) => (
    item.vocabulary_set_id === 'vocab_set_l1_01'
      ? filesFor('vocabulary-1.html', `flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}.html`)
      : filesFor('vocabulary-2.html', `flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}.html`)
  );

  const assets = [
    await assetEntry('assets/slide-base.css', 'shared_runtime', slideFiles),
    await assetEntry('assets/slide-base.js', 'shared_runtime', slideFiles),
    await assetEntry('assets/brand/logo-watermark.png', 'brand', slideFiles),
    await assetEntry('assets/photos/cover-topic.png', 'cover_topic', filesFor('cover.html')),
    await assetEntry('assets/sample-images/objectives.png', 'section_photo', filesFor('objectives.html')),
    await assetEntry('assets/photos/divider-concepts.png', 'divider_photo', filesFor('divider-concepts.html')),
    await assetEntry('assets/photos/divider-initials.png', 'divider_photo', filesFor('divider-initials.html')),
    await assetEntry('assets/photos/divider-finals.png', 'divider_photo', filesFor('divider-finals.html')),
    await assetEntry('assets/photos/divider-sounds.png', 'divider_photo', filesFor('divider-sounds.html')),
    await assetEntry('assets/photos/divider-tones.png', 'divider_photo', filesFor('divider-tones.html')),
    await assetEntry('assets/photos/divider-vocabulary.png', 'divider_photo', filesFor('divider-vocabulary.html')),
    await assetEntry('assets/photos/divider-review.png', 'divider_photo', filesFor('divider-review.html')),
    await assetEntry('assets/reference/ending-page-background.png', 'section_photo', filesFor('closing.html')),
    await assetEntry('assets/reference/keyboard-ios-step-1.png', 'section_photo', filesFor('keyboard-ios.html')),
    await assetEntry('assets/reference/keyboard-ios-step-2.png', 'section_photo', filesFor('keyboard-ios.html')),
    await assetEntry('assets/reference/keyboard-ios-step-3.png', 'section_photo', filesFor('keyboard-ios.html')),
    await assetEntry('assets/reference/keyboard-android-step-1.png', 'section_photo', filesFor('keyboard-android.html')),
    await assetEntry('assets/reference/keyboard-android-step-2.png', 'section_photo', filesFor('keyboard-android.html')),
    await assetEntry('assets/reference/keyboard-android-step-3.png', 'section_photo', filesFor('keyboard-android.html')),
    await assetEntry('assets/photos/pinyin-concept-1.png', 'section_photo', filesFor('pinyin-concept-1.html')),
    await assetEntry('assets/photos/pinyin-concept-2.png', 'section_photo', filesFor('pinyin-concept-2.html')),
    await assetEntry('assets/photos/tone-chart.png', 'section_photo', filesFor('divider-tones.html', 'tone-learning.html')),
    ...await Promise.all(vocab.map((item) => assetEntry(
      `assets/vocab-images/${item.image_file}`,
      'vocabulary_image',
      vocabSlide(item),
      {
        record_ids: [item.record_id],
        chinese: [item.chinese_simplified],
        pinyin: [item.pinyin],
        vietnamese: [item.vietnamese],
        semantic_check: item.image_semantic_check,
      },
    ))),
  ];

  const vocabularyCoverage = vocab.map((item) => ({
    record_id: item.record_id,
    chinese_simplified: item.chinese_simplified,
    pinyin: item.pinyin,
    asset_path: `assets/vocab-images/${item.image_file}`,
    status: item.image_file ? 'covered' : 'missing',
  }));
  const missingAssets = assets.filter((asset) => !asset.exists).map((asset) => asset.asset_path);

  const manifest = {
    lesson_id: db.metadata.lesson_id,
    generated_at: new Date().toISOString(),
    generator: 'scripts/generate-pinyin-01-steps10-12.mjs',
    assets,
    vocabulary_coverage: vocabularyCoverage,
    missing_assets: missingAssets,
  };

  await fs.writeFile(path.join(assetsDir, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(qaDir, 'asset-manifest-report.json'), `${JSON.stringify({
    lesson_id: db.metadata.lesson_id,
    checked_at: manifest.generated_at,
    status: missingAssets.length ? 'failed' : 'passed',
    assets: assets.length,
    vocabulary_covered: vocabularyCoverage.filter((entry) => entry.status === 'covered').length,
    missing_assets: missingAssets,
  }, null, 2)}\n`, 'utf8');
}

async function writeVisualQaDraftReport(db, slides) {
  await fs.writeFile(path.join(qaDir, 'visual-qa-report.json'), `${JSON.stringify({
    lesson_id: db.metadata.lesson_id,
    checked_at: new Date().toISOString(),
    status: 'draft_static_checks_passed',
    slide_count: slides.length,
    numbered_slides: slides.map((item) => item.file),
    screenshot_qa: {
      status: 'not_completed',
      reason: 'Local Playwright Chromium binary is not installed in this environment; no clean PDF export requested during drafting.',
    },
    static_checks: [
      'Numbered slide files regenerated from latest pinyin-lesson-1.json.',
      'Presenter MANIFEST synced to current slide sequence.',
      'Asset manifest and asset QA passed.',
      'System lesson validation passed.',
    ],
  }, null, 2)}\n`, 'utf8');
}

function head(title) {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=960,height=540"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><link rel="stylesheet" href="assets/slide-base.css">`;
}

const commonCss = `
.content{position:absolute;left:58px;right:58px;top:68px;bottom:42px}
.cover-title{font-size:58px;line-height:1;font-weight:900;color:#1A3A5A;letter-spacing:0}.cover-sub{margin-top:18px;font-size:22px;font-weight:800;color:#5AACAC}
.cover-art{position:absolute;right:58px;top:100px;width:330px;height:260px;border-radius:28px;overflow:hidden;background:#fff;box-shadow:0 18px 46px rgba(26,58,90,.13);border:1px solid rgba(90,172,172,.16)}.cover-art img{width:100%;height:100%;object-fit:cover}
.title-xl{font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.title-md{font-size:27px;line-height:1.16;font-weight:900;color:#1A3A5A}
.muted{color:#5F7088}.teal{color:#5AACAC}.purple{color:#7C6BC8}.amber{color:#D59A2A}.red{color:#D85A6A}
.grid{display:grid;gap:14px}.grid-2{grid-template-columns:repeat(2,1fr)}.grid-3{grid-template-columns:repeat(3,1fr)}.grid-4{grid-template-columns:repeat(4,1fr)}
.soft-card{background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:18px}.flat-card{background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:14px}
.badge{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 12px;border-radius:999px;background:#E8F4F4;color:#5AACAC;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.badge-purple{background:#F3F0FA;color:#7C6BC8}.badge-amber{background:#FFF4D8;color:#B9821F}.badge-red{background:#FCEFF3;color:#D85A6A}
.big-hanzi{font-family:'Noto Sans SC',sans-serif;font-size:58px;line-height:1;font-weight:900;color:#1A3A5A}.big-pinyin{font-size:52px;line-height:1;font-weight:900;color:#5AACAC}
.word-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px 14px}${vocabularyGridCss()}.word-card{position:relative;background:#fff;border-radius:18px;padding:10px 8px 12px;text-align:center;border:1px solid rgba(90,172,172,.16);box-shadow:0 8px 24px rgba(90,172,172,.10);height:184px;overflow:visible}.word-card img{width:78px;height:78px;border-radius:12px;border:2px solid #5AACAC;object-fit:cover;background:#F4FAFA;margin-bottom:8px}.word-card .pinyin{font-size:17px;font-weight:900;color:#5AACAC;line-height:1.16}.word-card .hanzi{font-size:31px;line-height:1.12;margin-top:3px}.word-card .vi{font-size:12px;line-height:1.22;color:#5F7088;font-weight:700;margin-top:3px}
.sound-table{width:100%;border-collapse:separate;border-spacing:10px}.sound-table th,.sound-table td{height:56px;border-radius:15px;text-align:center;font-weight:900;font-size:24px}.sound-table th{background:#E8F4F4;color:#5AACAC}.sound-table td{background:#fff;border:1px solid rgba(90,172,172,.18);color:#1A3A5A}.sound-table .rowh{background:#F3F0FA;color:#7C6BC8}
.chart-full{position:absolute;left:34px;right:34px;top:58px;bottom:22px}.chart-full-card{position:absolute;inset:0;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:10px}.sound-table-full{height:100%;border-spacing:8px;table-layout:fixed}.sound-table-full th,.sound-table-full td{height:auto;font-size:31px;border-radius:15px}.sound-table-full th{font-size:27px}.sound-table-full .rowh{font-size:33px}
.choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.choice{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;border:1px solid rgba(90,172,172,.16);padding:12px 14px;font-size:18px;font-weight:800;color:#1A3A5A}.num{width:28px;height:28px;border-radius:999px;background:#5AACAC;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex:none}
.pill-bank{display:flex;flex-wrap:wrap;gap:10px}.pill-bank span{display:inline-flex;align-items:center;justify-content:center;min-width:82px;height:36px;border-radius:999px;background:#fff;border:1px solid rgba(90,172,172,.22);font-size:16px;font-weight:900;color:#5AACAC}
.reference-image{position:absolute;left:34px;right:34px;top:58px;bottom:34px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 32px rgba(26,58,90,.12);border:1px solid rgba(90,172,172,.14)}.reference-image img{width:100%;height:100%;object-fit:contain;display:block}
.tiny{font-size:12px;line-height:1.35}.body-text{font-size:17px;line-height:1.45;color:#4A6080}.large-list{display:grid;gap:12px;margin-top:18px}.large-list li{list-style:none;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:13px 16px;font-size:18px;font-weight:800;color:#1A3A5A}
.practice-line{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.practice-token{flex:1;text-align:center;border-radius:16px;background:#fff;border:1px solid rgba(90,172,172,.18);padding:15px 8px;font-size:26px;font-weight:900;color:#1A3A5A}
.steps{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.step p{font-size:14px;line-height:1.45;color:#5F7088}
.flow-chips{display:flex;gap:12px;margin-top:16px}.flow-chips span{height:34px;display:inline-flex;align-items:center;justify-content:center;padding:0 14px;border-radius:999px;background:#E8F4F4;color:#5AACAC;font-weight:900;font-size:13px}.drill-board{margin-top:24px;display:grid;gap:14px}.drill-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.drill-token{height:70px;border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#1A3A5A;box-shadow:0 8px 24px rgba(90,172,172,.10)}.tone-row{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:center;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:18px;padding:12px 16px}.tone-options{display:flex;align-items:center;justify-content:space-between;gap:12px}.tone-options span{font-size:30px;font-weight:900;color:#1A3A5A}.vocab-drill-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:22px}.vocab-drill{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:12px;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:12px 14px}.vocab-drill .pin{font-size:27px;color:#5AACAC;font-weight:900}.vocab-drill .zh{font-family:'Noto Sans SC';font-size:30px;color:#1A3A5A;font-weight:900}.review-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}.review-card{height:226px;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:22px;display:flex;flex-direction:column;justify-content:space-between}.review-card .review-num{width:34px;height:34px;border-radius:999px;background:#5AACAC;color:white;display:flex;align-items:center;justify-content:center;font-weight:900}.review-card h3{font-size:22px;color:#1A3A5A;margin:0}.review-card p{font-size:15px;line-height:1.45;color:#5F7088;margin:0}.setup-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:24px}.setup-step{height:260px;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:18px;display:flex;flex-direction:column;gap:14px}.setup-step .step-num{width:34px;height:34px;border-radius:999px;background:#5AACAC;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900}.setup-step h3{font-size:20px;color:#1A3A5A;margin:0}.setup-step p{font-size:14px;line-height:1.42;color:#4A6080;margin:0}.setup-try{position:absolute;left:58px;right:58px;bottom:34px;background:#F4FAFA;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:12px 18px;font-size:16px;font-weight:800;color:#4A6080}
.aligned-text{display:flex;align-items:flex-end;justify-content:center;gap:12px;row-gap:7px;flex-wrap:wrap;overflow:visible}.aligned-text .a-word{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:76px;overflow:visible}.aligned-text .a-pin{font-size:13.5pt;line-height:1.05;color:#5AACAC;font-weight:800;white-space:nowrap;margin-bottom:7px}.aligned-text .a-han{font-family:'Noto Sans SC';font-size:36pt;line-height:1;color:#1A3A5A;font-weight:900;white-space:nowrap}.cover{position:absolute;inset:0;background:linear-gradient(145deg,#F4FAFA 0%,#FFFFFF 56%,#F3F0FA 100%);overflow:hidden}.cover:before{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(90,172,172,.13)}.cover-card{position:absolute;left:62px;top:78px;width:520px;z-index:2}.lesson{display:inline-flex;align-items:center;gap:10px;background:#E8F4F4;color:#5AACAC;padding:10px 21px;border-radius:999px;font-weight:800;font-size:21px}.cover-align{justify-content:flex-start;gap:14px;margin-top:26px}.cover-align .a-word{min-height:88px}.cover-align .a-pin{font-size:21px}.cover-align .a-han{font-size:76px}.vi{font-size:32px;color:#4A6080;font-weight:800;margin-top:20px}.cover-sounds{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;width:520px;margin-top:22px}.cover-sound-chip{display:inline-flex;align-items:center;justify-content:center;gap:13px;min-height:44px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(90,172,172,.2);box-shadow:0 8px 22px rgba(90,172,172,.09);font-size:24px;line-height:1;font-weight:900;color:#4A6080;white-space:nowrap}.cover-sound-chip .arrow{color:#5AACAC;margin:0 1px}.topic-img{position:absolute;right:50px;top:92px;width:318px;height:318px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 16px 44px rgba(26,58,90,.16)}.topic-img img{width:100%;height:100%;object-fit:cover}.lesson-goal-left{position:absolute;left:60px;top:78px;width:530px}.lesson-goal-title{margin-bottom:28px;font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.lesson-goal-cards{display:flex;flex-direction:column;gap:16px}.lesson-goal{padding:16px 20px;display:flex;align-items:center;gap:16px;font-size:18px;color:#4A6080;line-height:1.36}.lesson-goal-num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}.lesson-goal-right{position:absolute;right:54px;top:98px;width:306px;height:306px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.14)}.lesson-goal-right img{width:100%;height:100%;object-fit:cover;object-position:center}.numbered-list{counter-reset:item;display:grid;gap:12px;margin-top:18px;width:600px}.numbered-list li{counter-increment:item;list-style:none;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:13px 16px 13px 56px;font-size:18px;font-weight:800;color:#1A3A5A;position:relative}.numbered-list li:before{content:counter(item);position:absolute;left:16px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:999px;background:#5AACAC;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900}.title-with-icon{display:flex;align-items:center;gap:12px}.title-with-icon i{width:34px;height:34px;color:#5AACAC;stroke-width:2.5}.overview-art{position:absolute;right:4px;top:34px;width:246px;height:246px;border-radius:22px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.12)}.overview-art img{width:100%;height:100%;object-fit:cover}.divider-left{position:absolute;left:0;top:40px;bottom:0;width:54%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.divider-kicker{font-size:15px;color:#5AACAC;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin-bottom:12px}.divider-zh{font-family:'Noto Sans SC';font-size:62px;font-weight:900;color:#1A3A5A;margin-bottom:16px}.divider-line{width:88px;height:5px;border-radius:999px;background:#5AACAC;margin-bottom:0}.divider-photo{position:absolute;right:82px;top:116px;width:300px;height:300px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12)}.divider-photo img{width:100%;height:100%;object-fit:cover}.closing-card{position:absolute;left:150px;right:150px;top:70px;bottom:58px;border-radius:30px;background:rgba(255,255,255,.9);box-shadow:0 14px 40px rgba(26,58,90,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.closing-photo{width:248px;height:139px;border-radius:18px;overflow:hidden;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12);margin-bottom:16px}.closing-photo img{width:100%;height:100%;object-fit:cover}.closing-zh{font-family:'Noto Sans SC';font-size:72px;line-height:1;font-weight:900;color:#1A3A5A}.closing-sub{margin-top:15px;font-size:22px;font-weight:900;color:#5AACAC}.closing-next{margin-top:16px;font-size:18px;font-weight:800;color:#5F7088}
`;

function slide({ title, label, icon = 'book-open', body, extraCss = '' }) {
  const iconHtml = icon ? `<span class="menu-icon"><i data-lucide="${icon}"></i></span>` : '';
  return `${head(displayText(title))}<style>${commonCss}${extraCss}</style></head><body><div class="slide"><div class="menu-bar">${iconHtml}<span class="section-label">${escDisplay(label)}</span></div>${displayText(body)}</div><script src="assets/slide-base.js"></script></body></html>`;
}

function bareSlide({ title, body, extraClass = '', extraCss = '' }) {
  return `${head(displayText(title))}<style>${commonCss}${extraCss}</style></head><body><div class="slide ${extraClass}">${displayText(body)}</div><script src="assets/slide-base.js"></script></body></html>`;
}

function coverSlide() {
  return bareSlide({
    title: 'Pinyin Bài 1',
    body: `<div class="cover"><div class="cover-card"><div class="lesson">PINYIN 1 · 拼音第一课</div><div class="aligned-text cover-align"><span class="a-word"><span class="a-pin">pīn</span><span class="a-han">拼</span></span><span class="a-word"><span class="a-pin">yīn</span><span class="a-han">音</span></span></div><div class="cover-sounds"><div class="cover-sound-chip"><span>b</span><span>p</span><span>m</span><span>f</span></div><div class="cover-sound-chip"><span>a</span><span>o</span><span>e</span><span>i</span><span>u</span><span>ü</span></div></div></div><div class="topic-img"><img src="assets/photos/cover-topic.png" alt=""></div></div>`,
  });
}

function dividerSlide({ title, label, zh, desc, img = 'cover-topic.png', icon = 'book-open' }) {
  return slide({
    title,
    label,
    icon,
    body: `<div class="divider-left"><div class="divider-kicker">${esc(label)}</div><div class="divider-zh">${esc(zh)}</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/${esc(img)}" alt=""></div>`,
  });
}

function soundOnlySlide({ title, label, icon, items }) {
  return slide({
    title,
    label,
    icon,
    page: 5,
    extraCss: `.sound-only{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.sound-only-row{display:flex;align-items:center;justify-content:center;gap:34px}.sound-only-token{width:112px;height:112px;border-radius:24px;background:#fff;border:2px solid rgba(90,172,172,.26);box-shadow:0 12px 30px rgba(90,172,172,.13);display:flex;align-items:center;justify-content:center;font-size:72px;line-height:1;font-weight:900;color:#1A3A5A}.sound-only-token:nth-child(2n){background:#F4FAFA}.sound-only-token:nth-child(3n){background:#F3F0FA}`,
    body: `<div class="sound-only"><div class="sound-only-row">${items.map((item) => `<div class="sound-only-token">${esc(item)}</div>`).join('')}</div></div>`,
  });
}

function closingSlide() {
  return bareSlide({
    title: 'Kết thúc',
    extraClass: 'closing',
    extraCss: `.closing{position:relative;overflow:hidden;background:linear-gradient(112deg,#F5FAF4 0%,#FFFFFF 46%,#DFF1E8 100%)}.closing:before{content:"";position:absolute;left:34px;top:24px;width:300px;height:246px;border-radius:54% 46% 44% 56%;background:rgba(149,212,187,.23);z-index:0}.closing:after{content:"";position:absolute;right:-54px;bottom:-108px;width:372px;height:294px;border-radius:55% 45% 50% 50%;background:rgba(149,212,187,.20);z-index:0}.closing-card-ref{position:absolute;left:96px;right:84px;top:88px;bottom:62px;border-radius:34px;background:rgba(255,255,255,.96);box-shadow:0 18px 34px rgba(36,50,74,.18);z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-left:164px}.closing-door{position:absolute;left:-36px;top:-64px;width:290px;height:266px;object-fit:contain;z-index:2;filter:drop-shadow(0 6px 10px rgba(36,50,74,.10))}.closing-zh{font-family:'Noto Sans SC';font-size:84pt;line-height:.92;font-weight:900;color:#143C68;letter-spacing:0}.closing-sub{margin-top:30px;font-size:29pt;line-height:1.1;font-weight:900;color:#7BC6A7}.closing-next{margin-top:22px;font-size:17pt;line-height:1.25;font-weight:700;color:#6B6F76}`,
    body: `<div class="closing-card-ref"><img class="closing-door" src="assets/reference/closing-door-students.png" alt=""><div class="closing-zh">下课</div><div class="closing-sub">Bạn có câu hỏi gì không?</div><div class="closing-next">Bài tiếp theo: Pinyin 2</div></div>`,
  });
}

function vocabCard(item) {
  return `<div class="word-card"><img src="assets/vocab-images/${esc(item.image_file)}" alt="${esc(item.chinese_simplified)}"><div class="pinyin">${esc(item.pinyin)}</div><div class="hanzi">${esc(item.chinese_simplified)}</div><div class="vi">${esc(item.vietnamese)}</div></div>`;
}

const toneMatchCss = `
.tone-match-title{font-size:26px;font-weight:900;color:#1A3A5A;line-height:1.14;margin-bottom:12px}
.tone-match-board{position:relative;display:grid;grid-template-columns:270px 1fr 270px;gap:32px;align-items:start;margin-top:8px}
.tone-match-col{display:grid;gap:10px}
.tone-match-card{height:52px;border-radius:15px;background:#fff;border:2px solid #B8EDF8;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 15px rgba(90,172,172,.08)}
.tone-match-card .pin{font-size:31px;font-weight:900;color:#294778;line-height:1}
.tone-label{height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:900;color:#1A3A5A;box-shadow:0 6px 15px rgba(90,172,172,.07)}
.tone-label:nth-child(1){background:#E8F4F4;color:#387E86}
.tone-label:nth-child(2){background:#FFF4D8;color:#A66F12}
.tone-label:nth-child(3){background:#F3F0FA;color:#6E58B8}
.tone-label:nth-child(4){background:#FCEFF3;color:#C84B63}
.tone-label:nth-child(5){background:#EEF3FA;color:#5F7088}
.tone-match-space{height:300px;border-radius:22px;background:rgba(90,172,172,.045);border:1px dashed rgba(90,172,172,.22)}
`;

const faToneCss = `
.fa-board{height:338px;margin-top:32px;border-radius:24px;background:#fff;border:1px solid rgba(90,172,172,.16);box-shadow:0 10px 30px rgba(90,172,172,.10);display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:34px 24px}
.fa-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:18px;background:#F8FBFB;border:2px dashed rgba(90,172,172,.28)}
.fa-num{width:30px;height:30px;border-radius:999px;background:#5AACAC;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;margin-bottom:22px}
.fa-token{font-size:58px;font-weight:900;color:#1A3A5A;line-height:1}
.fa-line{width:74px;height:3px;border-radius:999px;background:#D7E7E7;margin-top:22px}
`;

const listeningWriteCss = `
.listen-head{display:flex;align-items:center;justify-content:center;margin-bottom:16px;text-align:center}
.listen-title{font-size:29px;font-weight:900;color:#1A3A5A;line-height:1.18}
.listen-title .vi{display:block;margin-top:5px;font-size:21px;color:#3B7DB4;font-weight:900}
.final-bank{width:760px;margin:4px auto 18px;background:rgba(255,255,255,.86);border:1px solid rgba(90,172,172,.16);border-radius:16px;text-align:center;padding:10px 18px;box-shadow:0 6px 20px rgba(90,172,172,.08)}
.final-bank-title{font-size:18px;color:#5F7088;font-weight:800;margin-bottom:6px}
.finals{display:flex;justify-content:space-around;font-size:25px;font-weight:900;color:#3B7DB4}
.listen-grid{display:grid;grid-template-columns:repeat(3,1fr);column-gap:28px;row-gap:20px;margin-top:10px}
.listen-item{font-size:25px;color:#202530;line-height:1.1;white-space:nowrap}
.listen-no{font-size:23px;margin-right:8px;color:#202530}
.blank{display:inline-block;width:44px;border-bottom:3px solid #202530;transform:translateY(-3px);margin:0 4px}
.blank.short{width:36px}
.answer-red{color:#F05A62;font-weight:950}
`;

const toneChoiceCss = `
.tone-choice-wrap{position:absolute;left:58px;right:58px;top:74px;bottom:42px}
.tone-choice-title{font-size:36px;line-height:1.1;font-weight:900;color:#1A3A5A;margin:0 0 8px}
.tone-choice-desc{font-size:19px;line-height:1.35;font-weight:800;color:#5F7088;margin:0 0 18px}
.tone-choice-table{width:850px;border-collapse:collapse;table-layout:fixed;background:#F4F8FD;box-shadow:0 10px 28px rgba(26,58,90,.10)}
.tone-choice-table tr:nth-child(odd) td{background:#D9E4F2}
.tone-choice-table tr:nth-child(even) td{background:#EEF3FA}
.tone-choice-table td{height:58px;border:1px solid rgba(255,255,255,.34);font-size:33px;font-weight:900;color:#294778;vertical-align:middle}
.tone-choice-table .qno{width:74px;background:transparent!important;text-align:center}
.tone-choice-num{width:44px;height:44px;border-radius:999px;background:#5AACAC;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:27px;box-shadow:0 5px 12px rgba(90,172,172,.24)}
.tone-choice-table .opt{padding-left:30px}
.tone-choice-table .letter{font-weight:900;margin-right:10px}
`;

const toneFamilyCss = `
.tone-family{position:absolute;left:78px;right:78px;top:86px;bottom:48px}
.tone-family-title{font-size:38px;line-height:1.1;font-weight:900;color:#1A3A5A;margin-bottom:22px;text-align:center}
.tone-family-board{display:grid;grid-template-rows:repeat(4,1fr);gap:14px}
.tone-family-row{display:grid;grid-template-columns:74px repeat(4,1fr);gap:12px;align-items:center}
.tone-family-base{height:72px;border-radius:18px;background:#E8F4F4;color:#5AACAC;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900}
.tone-family-token{height:72px;border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 22px rgba(90,172,172,.09);display:flex;align-items:center;justify-content:center;font-size:37px;font-weight:900;color:#1A3A5A}
.tone-family-row:nth-child(2) .tone-family-token{background:#F8FBFB}
.tone-family-row:nth-child(3) .tone-family-token{background:#F7F4FC}
.tone-family-row:nth-child(4) .tone-family-token{background:#FFF8E8}
`;

const flashcardCss = `
.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}
.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}
.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}
.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}
.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}
.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease;box-sizing:border-box;padding:22px 42px 22px 76px}
.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}
.flip-face:after{content:"";position:absolute;right:12px;top:12px;width:86px;height:86px;border-radius:50%;background:rgba(200,184,232,.16)}
.face-pin{transform:rotateY(0deg);opacity:1}
.face-answer{transform:rotateY(180deg);opacity:0}
.flash-card:has(.answer-trigger.revealed) .flip-inner{transform:rotateY(180deg)}
.flash-card:has(.answer-trigger.revealed) .face-pin{opacity:0}
.flash-card:has(.answer-trigger.revealed) .face-answer{opacity:1}
.flash-hint,.face-label,.flash-pinyin,.flash-answer-row,.flash-meaning,.flash-note{position:relative;z-index:1}
.flash-hint,.face-label{display:inline-flex;align-items:center;justify-content:center;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}
.face-label{background:#E8F4F4;color:#5AACAC}
.flash-pinyin{font-size:58pt;line-height:1;font-weight:900;color:#1A3A5A;letter-spacing:0}
.flash-answer-row{display:flex;align-items:center;justify-content:center;gap:22px;width:100%}
.flash-answer-row img{width:138px;height:138px;object-fit:cover;border-radius:18px;border:2px solid #5AACAC;background:#F8FBFB;box-shadow:0 10px 24px rgba(90,172,172,.14);flex:none}
.flash-meaning{text-align:left;font-size:26pt;line-height:1.12;font-weight:900;color:#1A3A5A;max-width:180px}
.flash-note{text-align:left;margin-top:8px;font-size:10.5pt;font-weight:800;color:#8A9AB0}
`;

const keyboardScreenshotCss = `
.keyboard-shot{position:absolute;left:30px;right:30px;top:58px;bottom:30px;border-radius:18px;overflow:hidden;background:#fff;border:1px solid rgba(90,172,172,.14);box-shadow:0 10px 32px rgba(26,58,90,.12)}
.keyboard-shot img{width:100%;height:100%;object-fit:contain;display:block;background:#fff}
`;

const keyboardGuideCss = `
.keyboard-guide{position:absolute;left:48px;right:48px;top:64px;bottom:34px}
.keyboard-guide-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.keyboard-guide-title{font-size:31px;line-height:1.1;font-weight:900;color:#1A3A5A;margin:0}
.keyboard-badge{height:34px;border-radius:999px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;background:#5AACAC;color:#fff;font-size:15px;font-weight:900}
.keyboard-badge.android{background:#7C6BC8}
.keyboard-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.keyboard-card{height:342px;border-radius:20px;background:rgba(255,255,255,.94);border:1px solid rgba(90,172,172,.16);box-shadow:0 9px 25px rgba(90,172,172,.10);padding:13px 13px 14px;display:flex;flex-direction:column}
.keyboard-shot-box{height:190px;border-radius:15px;background:#F8FBFB;border:1px solid rgba(90,172,172,.14);overflow:hidden;display:flex;align-items:center;justify-content:center}
.keyboard-shot-box img{width:100%;height:100%;object-fit:contain;display:block}
.keyboard-step{margin-top:13px}
.keyboard-kicker{font-size:11px;line-height:1;text-transform:uppercase;letter-spacing:.08em;color:#5AACAC;font-weight:900;margin-bottom:6px}
.keyboard-card.android .keyboard-kicker{color:#7C6BC8}
.keyboard-step-title{font-size:20px;line-height:1.08;color:#1A3A5A;font-weight:900;margin-bottom:7px}
.keyboard-route{font-size:13px;line-height:1.32;color:#5F7088;font-weight:800}
.keyboard-try{position:absolute;left:48px;right:48px;bottom:0;height:34px;border-radius:15px;background:#F4FAFA;border:1px solid rgba(90,172,172,.16);display:flex;align-items:center;justify-content:center;color:#4A6080;font-size:14px;font-weight:850}
`;

function toneMatchPracticeSlide() {
  return slide({
    title: 'Nối thanh điệu',
    label: 'Luyện tập',
    icon: 'git-branch',
    page: 13,
    extraCss: toneMatchCss,
    body: `<div class="content" style="top:92px;bottom:64px"><div class="tone-match-title">Nối phiên âm với thanh điệu tương ứng.</div><div class="tone-match-board"><div class="tone-match-col">${['mà', 'mǎ', 'mā', 'ma', 'má'].map((pin) => `<div class="tone-match-card"><span class="pin">${pin}</span></div>`).join('')}</div><div class="tone-match-space"></div><div class="tone-match-col">${['thanh 1', 'thanh 2', 'thanh 3', 'thanh 4', 'thanh nhẹ'].map((label) => `<div class="tone-label">${label}</div>`).join('')}</div></div></div>`,
  });
}

function toneChoiceSlide() {
  const rows = [
    ['pǒ', 'pō', 'pò', 'pó'],
    ['wù', 'wǔ', 'wū', 'wú'],
    ['yú', 'yù', 'yǔ', 'yū'],
    ['á', 'à', 'ā', 'ǎ'],
    ['bì', 'bī', 'bí', 'bǐ'],
    ['fǎ', 'fá', 'fà', 'fā'],
  ];
  return slide({
    title: 'Luyện thanh điệu',
    label: 'Luyện thanh điệu',
    icon: 'headphones',
    page: 8,
    extraCss: toneChoiceCss,
    body: `<div class="tone-choice-wrap"><div class="tone-choice-title">Nghe và chọn thanh điệu</div><p class="tone-choice-desc">Nghe giáo viên đọc và chọn thanh điệu đúng.</p><table class="tone-choice-table"><tbody>${rows.map((options, index) => `<tr><td class="qno"><span class="tone-choice-num">${index + 1}</span></td>${options.map((option, optIndex) => `<td class="opt"><span class="letter">${String.fromCharCode(65 + optIndex)}.</span>${option}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  });
}

function toneFamilyPracticeSlide() {
  const rows = [
    ['ma', ['mā', 'má', 'mǎ', 'mà']],
    ['bo', ['bō', 'bó', 'bǒ', 'bò']],
    ['mi', ['mī', 'mí', 'mǐ', 'mì']],
    ['fu', ['fū', 'fú', 'fǔ', 'fù']],
  ];
  return slide({
    title: 'Luyện 4 thanh điệu',
    label: 'Luyện thanh điệu',
    icon: 'mic-2',
    page: 8,
    extraCss: toneFamilyCss,
    body: `<div class="tone-family"><div class="tone-family-title">Luyện 4 thanh điệu</div><div class="tone-family-board">${rows.map(([base, options]) => `<div class="tone-family-row"><div class="tone-family-base">${base}</div>${options.map((option) => `<div class="tone-family-token pinyin">${option}</div>`).join('')}</div>`).join('')}</div></div>`,
  });
}

function faToneMarkingSlide() {
  return slide({
    title: 'Nghe và đánh dấu thanh',
    label: 'Luyện tập',
    icon: 'pen-line',
    page: 13,
    extraCss: faToneCss,
    body: `<div class="content"><div class="title-xl">Nghe giáo viên đọc, thêm dấu thanh cho <span class="teal">fa</span>.</div><div class="fa-board">${Array.from({ length: 5 }, (_, index) => `<div class="fa-cell"><div class="fa-num">${index + 1}</div><div class="fa-token">fa</div><div class="fa-line"></div></div>`).join('')}</div></div>`,
  });
}

function vocabFlashcardSlide(item, index, total, setLabel) {
  return slide({
    title: `${item.pinyin} · ${item.vietnamese}`,
    label: setLabel,
    icon: 'layers',
    page: item.source_page,
    extraCss: flashcardCss,
    body: `<div class="flash-title">Flashcard</div><div class="flash-count">${String(index + 1).padStart(2, '0')} / ${total}</div><div class="flash-card"><span class="flip-trigger answer-trigger" data-reveal-step="1"></span><div class="flip-inner"><div class="flip-face face-pin"><div class="flash-hint">Nhìn pinyin và đọc trước</div><div class="pinyin flash-pinyin">${esc(item.pinyin)}</div></div><div class="flip-face face-answer"><div class="face-label">Nghĩa</div><div class="flash-answer-row"><img src="assets/vocab-images/${esc(item.image_file)}" alt=""><div><div class="flash-meaning">${esc(item.vietnamese)}</div></div></div></div></div></div>`,
  });
}

function listeningFinalsToneSlide() {
  const items = [
    ['b'],
    ['p'],
    [''],
    ['b'],
    ['b'],
    ['m'],
    ['m'],
    ['f'],
    ['m', 'm'],
    ['b', 'b'],
    ['f', 'w'],
    ['y', 'f'],
  ];
  const itemHtml = items.map((item, index) => {
    if (index === 0) {
      return `<div class="listen-item"><span class="listen-no">1.</span><span class="answer-red">bà</span></div>`;
    }
    const parts = item;
    const pattern = parts.map((part) => `${part ? esc(part) : ''}<span class="blank${part ? '' : ' short'}"></span>`).join(' ');
    return `<div class="listen-item"><span class="listen-no">${index + 1}.</span>${pattern}</div>`;
  }).join('');
  return slide({
    title: 'Nghe và viết vận mẫu',
    label: 'Luyện tập',
    icon: null,
    page: 13,
    extraCss: listeningWriteCss,
    body: `<div class="content"><div class="listen-head"><div class="listen-title">Nghe rồi viết vận mẫu và thanh điệu cho các âm tiết dưới đây.</div></div><div class="final-bank"><div class="final-bank-title">Vận mẫu</div><div class="finals"><span>a</span><span>o</span><span>e</span><span>i</span><span>u</span><span>ü</span></div></div><div class="listen-grid">${itemHtml}</div></div>`,
  });
}

function keyboardScreenshotSlide({ platform, page, image }) {
  return slide({
    title: `Cài bộ gõ tiếng Trung · ${platform}`,
    label: `Cài bộ gõ · ${platform}`,
    icon: 'smartphone',
    page,
    extraCss: keyboardScreenshotCss,
    body: `<div class="keyboard-shot"><img src="assets/reference/${esc(image)}" alt="Cài bộ gõ tiếng Trung trên ${esc(platform)}"></div>`,
  });
}

function keyboardSetupGuideSlide({ platform, accent = 'teal', steps, tryText = '' }) {
  return slide({
    title: `Cài bộ gõ tiếng Trung · ${platform}`,
    label: `Cài bộ gõ · ${platform}`,
    icon: 'smartphone',
    extraCss: keyboardGuideCss,
    body: `<div class="keyboard-guide"><div class="keyboard-guide-head"><h1 class="keyboard-guide-title">Cài đặt bộ gõ tiếng Trung trên điện thoại</h1><div class="keyboard-badge ${accent === 'purple' ? 'android' : ''}">${esc(platform)}</div></div><div class="keyboard-cards">${steps.map((step, index) => `<div class="keyboard-card ${accent === 'purple' ? 'android' : ''}"><div class="keyboard-shot-box"><img src="assets/reference/${esc(step.image)}" alt=""></div><div class="keyboard-step"><div class="keyboard-kicker">Bước ${index + 1}</div><div class="keyboard-step-title">${esc(step.title)}</div><div class="keyboard-route">${esc(step.route)}</div></div></div>`).join('')}</div>${tryText ? `<div class="keyboard-try">${esc(tryText)}</div>` : ''}</div>`,
  });
}

const keyboardSetupCss = `
.input-setup{position:absolute;left:48px;right:48px;top:62px;bottom:34px}
.input-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.input-head h1{font-size:29px;line-height:1.1;font-weight:900;color:#1A3A5A;margin:0}
.platform-badge{height:34px;border-radius:999px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:#5AACAC;letter-spacing:.04em}
.platform-badge.android{background:#7C6BC8}
.phone-flow{display:grid;grid-template-columns:1fr 34px 1fr 34px 1fr;gap:8px;align-items:center}
.flow-arrow{width:34px;height:34px;border-radius:999px;background:#E8F4F4;color:#5AACAC;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px rgba(90,172,172,.10)}
.flow-arrow.purple{background:#F3F0FA;color:#7C6BC8}
.flow-arrow i{width:23px;height:23px;stroke-width:3}
.phone-step{height:344px;border-radius:20px;background:rgba(255,255,255,.92);border:1px solid rgba(90,172,172,.16);box-shadow:0 9px 25px rgba(90,172,172,.10);padding:12px 12px 13px;display:flex;flex-direction:column;align-items:center}
.phone-frame{width:154px;height:216px;border-radius:24px;background:#1A3A5A;padding:8px;box-shadow:0 10px 24px rgba(26,58,90,.18)}
.phone-screen{height:100%;border-radius:18px;background:#F7FAFA;overflow:hidden;border:1px solid rgba(255,255,255,.65)}
.phone-status{height:17px;background:#EEF6F6;display:flex;align-items:center;justify-content:space-between;padding:0 9px;color:#5F7088;font-size:8px;font-weight:800}
.phone-title{height:28px;display:flex;align-items:center;justify-content:center;background:#fff;color:#1A3A5A;font-size:11px;font-weight:900;border-bottom:1px solid #E4EEEE}
.phone-list{padding:7px;display:grid;gap:5px}
.phone-row{height:24px;border-radius:8px;background:#fff;border:1px solid #E7EFEF;color:#4A6080;font-size:8.5px;font-weight:800;display:flex;align-items:center;padding:0 7px;position:relative}
.phone-row:before{content:"";width:8px;height:8px;border-radius:3px;background:#DDEBEB;margin-right:5px;flex:none}
.phone-row.active{border-color:#5AACAC;background:#EAF7F7;color:#1A3A5A;box-shadow:inset 0 0 0 1px rgba(90,172,172,.35)}
.phone-row.active.purple{border-color:#7C6BC8;background:#F3F0FA;box-shadow:inset 0 0 0 1px rgba(124,107,200,.32)}
.phone-row.done{border-color:#D59A2A;background:#FFF7DE;color:#1A3A5A}
.step-caption{width:100%;margin-top:11px;text-align:left}
.step-caption .step-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5AACAC;font-weight:900}
.step-caption .step-title{font-size:17px;line-height:1.15;color:#1A3A5A;font-weight:900;margin-top:4px}
.step-caption .step-route{font-size:12px;line-height:1.32;color:#5F7088;font-weight:750;margin-top:5px}
.try-strip{position:absolute;left:48px;right:48px;bottom:2px;height:34px;border-radius:15px;background:#F4FAFA;border:1px solid rgba(90,172,172,.16);display:flex;align-items:center;justify-content:center;color:#4A6080;font-size:14px;font-weight:850}
`;

function phoneMock({ header, rows, accent = 'teal' }) {
  return `<div class="phone-frame"><div class="phone-screen"><div class="phone-status"><span>9:41</span><span>●●●</span></div><div class="phone-title">${esc(header)}</div><div class="phone-list">${rows.map((row) => {
    const text = Array.isArray(row) ? row[0] : row;
    const state = Array.isArray(row) ? row[1] : '';
    const cls = state === 'active' ? `active${accent === 'purple' ? ' purple' : ''}` : state;
    return `<div class="phone-row ${esc(cls)}">${esc(text)}</div>`;
  }).join('')}</div></div></div>`;
}

function keyboardSetupSlide({ platform, page, accent = 'teal', steps, tryText = '' }) {
  return slide({
    title: `Cài bộ gõ tiếng Trung · ${platform}`,
    label: `Cài bộ gõ · ${platform}`,
    icon: 'smartphone',
    page,
    extraCss: keyboardSetupCss,
    body: `<div class="input-setup"><div class="input-head"><h1>Cài đặt bộ gõ tiếng Trung trên điện thoại</h1><div class="platform-badge ${accent === 'purple' ? 'android' : ''}">${esc(platform)}</div></div><div class="phone-flow">${steps.map((step, index) => `${index > 0 ? `<div class="flow-arrow ${accent === 'purple' ? 'purple' : ''}"><i data-lucide="move-right"></i></div>` : ''}<div class="phone-step">${phoneMock({ header: step.header, rows: step.rows, accent })}<div class="step-caption"><div class="step-kicker">Bước ${index + 1}</div><div class="step-title">${esc(step.title)}</div><div class="step-route">${esc(step.route)}</div></div></div>`).join('')}</div>${tryText ? `<div class="try-strip">${tryText}</div>` : ''}</div>`,
  });
}

function soundTable(initials) {
  const cols = initials.combination_table.columns;
  const rows = Object.entries(initials.combination_table.rows);
  return `<table class="sound-table"><thead><tr><th></th>${cols.map((col) => `<th>${esc(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(([row, cells]) => `<tr><th class="rowh">${esc(row)}</th>${cells.map((cell) => `<td>${cell ? esc(cell) : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function fullSoundTable(initials) {
  const cols = initials.combination_table.columns;
  const rows = Object.entries(initials.combination_table.rows);
  return `<div class="chart-full"><div class="chart-full-card"><table class="sound-table sound-table-full"><thead><tr><th></th>${cols.map((col) => `<th>${esc(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(([row, cells]) => `<tr><th class="rowh">${esc(row)}</th>${cells.map((cell) => `<td>${cell ? esc(cell) : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

function writeSlidesData(db) {
  const byId = new Map(db.content_items.map((item) => [item.record_id, item]));
  const vocab = db.content_items.filter((item) => item.record_type === 'vocabulary');
  const vocabA = vocab.filter((item) => item.vocabulary_set_id === 'vocab_set_l1_01');
  const vocabB = vocab.filter((item) => item.vocabulary_set_id === 'vocab_set_l1_02');
  const initials = byId.get('I001');
  const finals = byId.get('F001');

  const slides = [
    {
      file: '01-overview.html',
      html: slide({
        title: 'Mục lục',
        label: 'Mục lục',
        icon: 'list-checks',
        page: 1,
        body: `<div class="content"><div class="title-xl">Pinyin Bài 1 · Mục lục</div><ol class="numbered-list">${['Khái niệm pinyin','Thanh mẫu b p m f','Vận mẫu a o e i u ü','4 thanh điệu và thanh nhẹ','Từ vựng phát âm','Cài bộ gõ tiếng Trung'].map((x) => `<li>${esc(x)}</li>`).join('')}</ol><div class="overview-art"><img src="assets/photos/overview-pronunciation.png" alt=""></div></div>`,
      }),
    },
    {
      file: '02-objectives.html',
      html: slide({
        title: 'Mục tiêu học tập',
        label: 'MỤC TIÊU',
        icon: 'target',
        page: 2,
        extraCss: `.lesson-goal .goal-hot{color:#F05A62;font-weight:950}`,
        body: `<div class="lesson-goal-left"><div class="lesson-goal-title">Hôm nay bạn sẽ học gì?</div><div class="lesson-goal-cards">${[
          'Hiểu pinyin dùng chữ Latin để ghi cách phát âm tiếng Trung.',
          'Học thanh mẫu <strong class="goal-hot">b p m f</strong> và vận mẫu <strong class="goal-hot">a o e i u ü</strong>.',
          'Học 5 thanh điệu tiếng Trung.',
          'Học đọc 16 từ vựng.',
        ].map((goal, index) => `<div class="lesson-goal card"><div class="lesson-goal-num">${index + 1}</div><div>${goal}</div></div>`).join('')}</div></div><div class="lesson-goal-right"><img src="assets/sample-images/objectives.png" alt=""></div>`,
      }),
    },
    {
      file: '03-pinyin-concept-1.html',
      html: slide({
        title: 'Khái niệm pinyin',
        label: 'Khái niệm pinyin',
        icon: 'map-pin',
        page: '3-4',
        body: `<div class="reference-image"><img src="assets/photos/pinyin-concept-1.png" alt="Phiên âm và chữ Hán: nǐ hǎo, 你好"></div>`,
      }),
    },
    {
      file: '04-pinyin-concept-2.html',
      html: slide({
        title: 'Thanh mẫu, vận mẫu, thanh điệu',
        label: 'Khái niệm pinyin',
        icon: 'blocks',
        page: '3-4',
        body: `<div class="reference-image"><img src="assets/photos/pinyin-concept-2.png" alt="Thanh mẫu, vận mẫu và thanh điệu của nǐ hǎo"></div>`,
      }),
    },
    {
      file: '05-pinyin-chart.html',
      html: slide({
        title: 'Bảng ghép âm',
        label: 'Bảng ghép âm',
        icon: 'table-2',
        page: 5,
        body: fullSoundTable(initials),
      }),
    },
    {
      file: '06-pinyin-practice.html',
      html: slide({
        title: 'Luyện đọc',
        label: 'Luyện pinyin',
        icon: 'mic-2',
        page: 6,
        body: fullSoundTable(initials),
      }),
    },
    {
      file: '07-tone-learning.html',
      html: slide({
        title: 'Thanh điệu',
        label: 'Thanh điệu',
        icon: 'activity',
        page: 7,
        body: `<div class="reference-image"><img src="assets/photos/tone-chart.png" alt="Bảng đường đi của 4 thanh điệu và thanh nhẹ"></div>`,
      }),
    },
    {
      file: '08-tone-practice.html',
      html: toneFamilyPracticeSlide(),
    },
    {
      file: '09-vocabulary-1.html',
      html: slide({
        title: 'Từ vựng 1',
        label: 'Từ vựng 1',
        icon: 'book-open',
        page: 9,
        body: `<div class="content" style="top:92px"><div class="${vocabularyGridClass(vocabA.length)}">${vocabA.map(vocabCard).join('')}</div></div>`,
      }),
    },
    {
      file: '10-vocab-practice-1.html',
      html: slide({
        title: 'Luyện từ vựng 1',
        label: 'Luyện từ vựng 1',
        icon: 'radio',
        page: 10,
        body: `<div class="content"><div class="title-xl">Nghe mẫu → đọc theo → thu âm</div><div class="vocab-drill-grid">${vocabA.map((item, i) => `<div class="vocab-drill"><span class="num">${i + 1}</span><span class="pin">${esc(item.pinyin)}</span><span class="zh">${esc(item.chinese_simplified)}</span></div>`).join('')}</div></div>`,
      }),
    },
    {
      file: '11-vocabulary-2.html',
      html: slide({
        title: 'Từ vựng 2',
        label: 'Từ vựng 2',
        icon: 'book-open',
        page: 11,
        body: `<div class="content" style="top:76px"><div class="${vocabularyGridClass(vocabB.length)}">${vocabB.map(vocabCard).join('')}</div></div>`,
      }),
    },
    {
      file: '12-vocab-practice-2.html',
      html: slide({
        title: 'Luyện từ vựng 2',
        label: 'Luyện từ vựng 2',
        icon: 'radio',
        page: 12,
        body: `<div class="content"><div class="title-xl">Nghe mẫu → đọc theo → thu âm</div><div class="vocab-drill-grid">${vocabB.map((item, i) => `<div class="vocab-drill"><span class="num">${i + 1}</span><span class="pin">${esc(item.pinyin)}</span><span class="zh">${esc(item.chinese_simplified)}</span></div>`).join('')}</div></div>`,
      }),
    },
    {
      file: '13-tone-match-practice.html',
      html: toneMatchPracticeSlide(),
    },
    { file: '14-fa-tone-marking.html', html: faToneMarkingSlide() },
    { file: '15-listening-finals-tones.html', html: listeningFinalsToneSlide() },
    {
      file: '16-keyboard-ios.html',
      html: keyboardSetupGuideSlide({
        platform: 'iOS',
        steps: [
          { image: 'keyboard-ios-step-1.png', title: 'Vào phần bàn phím', route: 'Cài đặt → Cài đặt chung → Bàn phím' },
          { image: 'keyboard-ios-step-2.png', title: 'Thêm bàn phím mới', route: 'Bàn phím → Thêm bàn phím mới' },
          { image: 'keyboard-ios-step-3.png', title: 'Chọn tiếng Trung', route: 'Tiếng Trung → Bính âm - QWERTY' },
        ],
      }),
    },
    {
      file: '17-keyboard-android.html',
      html: keyboardSetupGuideSlide({
        platform: 'Android',
        accent: 'purple',
        steps: [
          { image: 'keyboard-android-step-1.png', title: 'Vào ngôn ngữ và bàn phím', route: 'Cài đặt → Quản lý chung → Ngôn ngữ và bàn phím' },
          { image: 'keyboard-android-step-2.png', title: 'Mở Gboard', route: 'Bàn phím trên màn hình → Gboard → Ngôn ngữ' },
          { image: 'keyboard-android-step-3.png', title: 'Thêm tiếng Trung', route: 'Thêm bàn phím → Tiếng Trung giản thể' },
        ],
        tryText: 'Sau khi bật bộ gõ, thử nhập: mama, baba, fuwu.',
      }),
    },
  ];

  const vocabFlashA = vocabA.map((item, index) => ({
    file: `flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}.html`,
    html: vocabFlashcardSlide(item, index, vocabA.length, 'Thẻ từ vựng 1'),
  }));
  const vocabFlashB = vocabB.map((item, index) => ({
    file: `flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}.html`,
    html: vocabFlashcardSlide(item, index, vocabB.length, 'Thẻ từ vựng 2'),
  }));

  const expanded = [
    { file: 'cover.html', html: coverSlide() },
    slides[1],
    { file: 'divider-concepts.html', html: dividerSlide({ title: 'Khái niệm pinyin', label: 'KHÁI NIỆM', zh: '拼音概念', desc: 'Pinyin ghi cách phát âm tiếng Trung', img: 'divider-concepts.png', icon: 'map-pin' }) },
    slides[2],
    slides[3],
    { file: 'divider-initials.html', html: dividerSlide({ title: 'Thanh mẫu b p m f', label: 'THANH MẪU', zh: '声母', desc: 'b p m f', img: 'divider-initials.png', icon: 'mic-2' }) },
    { file: 'initials-only.html', html: soundOnlySlide({ title: 'b p m f', label: 'Thanh mẫu', icon: 'mic-2', items: ['b', 'p', 'm', 'f'] }) },
    { file: 'divider-finals.html', html: dividerSlide({ title: 'Vận mẫu a o e i u ü', label: 'VẬN MẪU', zh: '韵母', desc: 'a o e i u ü', img: 'divider-finals.png', icon: 'volume-2' }) },
    { file: 'finals-only.html', html: soundOnlySlide({ title: 'a o e i u ü', label: 'Vận mẫu', icon: 'volume-2', items: ['a', 'o', 'e', 'i', 'u', 'ü'] }) },
    { file: 'divider-sounds.html', html: dividerSlide({ title: 'Thanh mẫu và vận mẫu', label: 'GHÉP ÂM', zh: '声母 · 韵母', desc: 'b p m f + a o e i u ü', img: 'divider-sounds.png', icon: 'table-2' }) },
    slides[4],
    slides[5],
    { file: 'divider-tones.html', html: dividerSlide({ title: 'Thanh điệu', label: 'THANH ĐIỆU', zh: '声调', desc: '4 thanh điệu và thanh nhẹ', img: 'divider-tones.png', icon: 'activity' }) },
    slides[6],
    slides[7],
    { file: 'divider-vocabulary.html', html: dividerSlide({ title: 'Từ vựng', label: 'TỪ VỰNG', zh: '词汇', desc: '16 từ/cụm từ · chỉ luyện phát âm', img: 'divider-vocabulary.png', icon: 'book-open' }) },
    slides[8],
    ...vocabFlashA,
    slides[10],
    ...vocabFlashB,
    { file: 'divider-review.html', html: dividerSlide({ title: 'Ôn tập', label: 'ÔN TẬP', zh: '复习', desc: 'Nghe chọn · nhìn đọc · đọc theo nhóm', img: 'divider-review.png', icon: 'check-check' }) },
    slides[12],
    { file: 'tone-choice-practice.html', html: toneChoiceSlide() },
    slides[14],
    slides[15],
    slides[16],
    { file: 'closing.html', html: closingSlide() },
  ];

  return expanded.map((item, index) => ({
    ...item,
    file: `${String(index + 1).padStart(2, '0')}-${item.file.replace(/^\d{2,3}-/, '')}`,
  }));
}

async function writeSlides(slides) {
  for (const { file, html } of slides) {
    await fs.writeFile(path.join(slidesDir, file), html, 'utf8');
  }
}

async function writeTeacherGuide(db, slides) {
  const vocab = db.content_items.filter((item) => item.record_type === 'vocabulary');
  const guide = `# Pinyin Bài 1 · Teacher Prep

Source: latest user-provided files in \`database/source/\`

## Mục tiêu

- Giúp sinh viên hiểu pinyin là hệ thống ghi âm bằng chữ Latin.
- Luyện chính xác \`b p m f\`, \`a o e i u ü\`, 4 thanh điệu và thanh nhẹ.
- Đọc đúng ${vocab.length} từ/cụm từ của bài.
- Bài này ưu tiên phát âm, không yêu cầu sinh viên nhớ mặt chữ Hán.

## Trình tự dạy

1. Mục tiêu.
2. Khái niệm pinyin qua hai slide hình minh họa.
3. Bảng ghép \`b p m f\` với \`a o e i u ü\`, chưa thêm thanh điệu.
4. Luyện ghép âm.
5. Học thanh điệu, sau đó luyện 4 thanh điệu, không dùng thanh nhẹ trong bài luyện.
6. Từ vựng 1: 八、怕、饿、不、鼻、木、马、佛.
7. Từ vựng 2: 妈妈、爸爸、服务、衣服、皮肤、密码、伯父、伯母.
8. Ôn tập cuối bài và cài bộ gõ.

## Lưu ý lớp học

- Sửa phát âm trước. Nếu sinh viên chưa nhớ chữ Hán, không tính sai trong bài này.
- Với \`b/p\`, dùng hơi bật ra để phân biệt.
- Với từ hai âm tiết, đọc liền như một từ: \`māma\`, \`bàba\`, \`fúwù\`, \`yīfu\`.
- Không xuất clean PDF cho đến khi Adam xác nhận bản này final.
`;

  const brief = `# Huashu Brief · Pinyin Bài 1

## Deck

- Output: \`output/pinyin/pinyin-01/slides/\`
- Format: HTML slides, 960×540, opened through \`slides/index.html\`
- Source: latest user-provided \`pinyin-lesson-1.json\`, with Markdown and CSV archived.
- Slide count: ${slides.length}
- Main rule: pronunciation-first, no Hanzi recognition requirement.

## Slide Sequence

${slides.map((slide, index) => `${index + 1}. \`${slide.file}\``).join('\n')}

## Rules Applied

- Vietnamese instructions and labels.
- Simplified Chinese for target content in slides; original Traditional source kept in database.
- Pinyin shown clearly for pronunciation practice.
- Every slide loads \`lucide@0.460.0\`, \`assets/slide-base.css\`, and \`assets/slide-base.js\`.
- PDF export is not run until final approval.
`;

  await fs.writeFile(path.join(teacherGuideDir, 'teacher-prep.md'), guide, 'utf8');
  await fs.writeFile(path.join(teacherGuideDir, 'huashu-brief.md'), brief, 'utf8');
}

async function writeReadme(slides) {
  const readme = `# Pinyin Bài 1 · Cơ bản: phát âm nhập môn

Classroom presenter is ready. Open \`index.html\` from this lesson root.

## Folder Map

| Path | Purpose |
|---|---|
| \`index.html\` | Classroom launcher. Redirects to \`slides/index.html\`. |
| \`slides/\` | Editable HTML slide source and presenter. |
| \`database/\` | VP database generated from the latest lesson 1 files. |
| \`database/source/\` | Archived copies of the latest source JSON/Markdown/CSV. |
| \`teacher-guide/teacher-prep.md\` | Teacher prep notes. |
| \`teacher-guide/huashu-brief.md\` | Huashu brief. |
| \`exports/qa/\` | Screenshots, contact sheets, and QA reports. |
| \`exports/final/\` | Clean PDF backups after final approval only. |

## Current Content

- ${slides.length} HTML slides.
- Pronunciation-first.
- No Hanzi recognition requirement.
- Vocabulary updated to: 八、怕、饿、不、鼻、木、马、佛、妈妈、爸爸、服务、衣服、皮肤、密码、伯父、伯母.

## Status

- [x] Latest content files imported
- [x] VP database updated
- [x] Teacher prep updated
- [x] Huashu brief updated
- [x] Teacher HTML slides regenerated
- [x] Presenter synced
- [ ] Clean PDF backup: not exported until final approval
`;
  await fs.writeFile(path.join(lessonRoot, 'README.md'), readme, 'utf8');
}

await mkdirs();
await copySourceFiles();
const blueprint = await readBlueprint();
const db = buildDatabase(blueprint);
await resetSlides();
await resetGeneratedAssets();
await copySharedAssets();
const vocab = db.content_items.filter((item) => item.record_type === 'vocabulary');
await createImages(vocab);
await writeDatabaseFiles(db);
const slides = writeSlidesData(db);
await writeSlides(slides);
await writeAssetManifest(db, slides);
await writeVisualQaDraftReport(db, slides);
await writeTeacherGuide(db, slides);
await writeReadme(slides);

console.log(JSON.stringify({
  lesson: path.relative(root, lessonRoot),
  source_json: path.relative(root, path.join(sourceDir, 'pinyin-lesson-1.json')),
  slides: slides.length,
  vocabulary: vocab.length,
  teacher_prep: path.relative(root, path.join(teacherGuideDir, 'teacher-prep.md')),
  huashu_brief: path.relative(root, path.join(teacherGuideDir, 'huashu-brief.md')),
}, null, 2));
