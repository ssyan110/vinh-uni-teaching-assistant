#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const sourceRoot = path.resolve(arg('--source-root', '.'));
const outputPath = path.resolve(arg('--output', path.join(sourceRoot, 'dashboard', 'manifest.js')));

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function loadDashboard(file) {
  try {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
    return context.window.DASHBOARD_MANIFEST || {};
  } catch {
    return {};
  }
}

function pages(section) { return (section && section.printed_pages || []).join('–'); }
function first(value, fallback = null) { return value == null ? fallback : value; }

function normaliseAudio(canonical, audioManifest) {
  const canonicalTracks = canonical && Array.isArray(canonical.audio_map) ? canonical.audio_map : [];
  const manifestTracks = audioManifest && Array.isArray(audioManifest.tracks) ? audioManifest.tracks : [];
  const canonicalByLabel = new Map(canonicalTracks.map((track) => [first(track.label, track.track_label), track]));
  const labels = [...new Set([...canonicalTracks, ...manifestTracks].map((track) => first(track.label, track.track_label)).filter(Boolean))];
  const tracks = labels.map((label) => ({ ...(canonicalByLabel.get(label) || {}), ...(manifestTracks.find((track) => first(track.label, track.track_label) === label) || {}) }));
  return {
    ...(audioManifest || {}),
    tracks: tracks.map((track) => ({
      label: first(track.label, track.track_label),
      play_url: first(track.play_url, track.source_url),
      path: first(track.path, first(track.file, track.local_file)),
      scope: first(track.scope, first(track.content_scope, track.textbook_page ? `教材 P${track.textbook_page}` : '本课音档')),
      bytes: track.bytes,
      sha256: track.sha256,
      duration_seconds: track.duration_seconds,
      decode_status: track.decode_status || track.download_status,
      semantic_status: track.semantic_status || track.semantic_listening_status || 'pending_teacher_playback',
      teacher_playback_status: track.teacher_playback_status || track.playback_status || 'pending'
    })).filter((track) => track.label)
  };
}

function push(items, area, id, value, title, meta = {}) {
  items.push({ area, id, value, title, ...meta });
}

function completionFor(registryEntry) {
  const status = registryEntry && registryEntry.status || {};
  return status.completion_status === 'completed_by_adam_2026-09-08'
    ? {
        status: 'completed_by_adam',
        confirmed_by: 'Adam',
        confirmed_at: status.completion_confirmed_at,
        evidence: status.completion_evidence,
        technical_status_preserved: true
      }
    : null;
}

function buildReviewItems(canonical) {
  const sections = Array.isArray(canonical && canonical.sections) ? canonical.sections : [];
  const items = [];
  const vocabulary = sections.find((section) => section.id === 'vocabulary');
  (vocabulary && vocabulary.entries || []).forEach((entry) => push(items, 'vocabulary', `vocabulary:${entry.no}`, entry, entry.word, { page: pages(vocabulary), audio: vocabulary.audio, type: '词语' }));
  (vocabulary && vocabulary.proper_nouns || []).forEach((entry, index) => push(items, 'vocabulary', `proper-noun:${index + 1}`, entry, Array.isArray(entry) ? entry[0] : entry.word, { page: pages(vocabulary), audio: vocabulary.audio, type: '专名' }));

  sections.filter((section) => /^short_text_/.test(section.id)).forEach((section) => push(items, 'texts', `text:${section.id}`, section, section.title, { page: pages(section), audio: section.audio, type: '短文' }));

  sections.filter((section) => /^common_expressions/.test(section.id)).forEach((section, sectionIndex) => {
    if (Array.isArray(section.groups)) {
      section.groups.forEach((group, groupIndex) => (group.items || []).forEach((item, itemIndex) => push(items, 'grammar', `grammar:${sectionIndex + 1}:${groupIndex + 1}:${itemIndex + 1}`, { expression: item, topic: group.topic || section.topic }, item, { page: pages(section), audio: section.audio, type: '语法／表达' })));
    } else {
      (section.items || []).forEach((item, itemIndex) => push(items, 'grammar', `grammar:${sectionIndex + 1}:${itemIndex + 1}`, { expression: item, topic: section.topic }, item, { page: pages(section), audio: section.audio, type: '语法／表达' }));
    }
  });

  const comprehension = sections.find((section) => section.id === 'vocabulary_comprehension');
  (comprehension && comprehension.groups || []).forEach((group, groupIndex) => push(items, 'exercises', `exercise:comprehension:${groupIndex + 1}`, { instruction: comprehension.instruction, words: group.words, answer: group.answer, exercises: group.exercises }, '词语理解', { page: pages(comprehension), audio: comprehension.audio, type: '听力练习' }));

  const sentenceSection = sections.find((section) => section.id === 'listening_sentences');
  if (sentenceSection && sentenceSection.exercises) {
    Object.entries(sentenceSection.exercises).forEach(([exerciseId, exercise]) => {
      const entries = exercise && Array.isArray(exercise.items) ? exercise.items : [];
      entries.forEach((entry, index) => {
        const value = Array.isArray(entry) ? { prompt: entry[1], answer: entry[2], number: entry[0] } : { prompt: entry };
        push(items, 'exercises', `exercise:${sentenceSection.id}:${exerciseId}:${index + 1}`, { ...value, heading: exercise.heading_verbatim || exerciseId }, exercise.heading_verbatim || '听力句子', { page: pages(sentenceSection), audio: (sentenceSection.audio_tracks || []).join('、'), type: '听力练习' });
      });
    });
  }

  sections.filter((section) => section.id === 'listening_dialogue').forEach((section) => (section.items || []).forEach((entry, index) => push(items, 'exercises', `exercise:${section.id}:${index + 1}`, entry, section.title || '听力对话', { page: pages(section), audio: section.audio, type: '听力练习' })));

  sections.filter((section) => /^short_text_/.test(section.id)).forEach((section) => {
    Object.entries(section.exercises || {}).forEach(([kind, value]) => {
      if (kind === 'exercise_metadata' || value == null) return;
      const prompts = Array.isArray(value) ? value : [value];
      prompts.forEach((prompt, index) => push(items, 'exercises', `exercise:${section.id}:${kind}:${index + 1}`, { prompt, kind, textTitle: section.title }, `${section.title} · ${kind}`, { page: pages(section), audio: section.audio, type: '短文练习' }));
    });
  });

  const comprehensive = sections.find((section) => section.id === 'comprehensive_practice');
  if (comprehensive) {
    if (Array.isArray(comprehensive.items)) comprehensive.items.forEach((item, index) => push(items, 'exercises', `exercise:comprehensive:${index + 1}`, { prompt: item }, '综合练习', { page: pages(comprehensive), audio: (comprehensive.audio_tracks || []).join('、'), type: '综合练习' }));
    else Object.entries(comprehensive).filter(([key]) => /^exercise_/.test(key)).forEach(([key, value]) => push(items, 'exercises', `exercise:comprehensive:${key}`, { prompt: value }, '综合练习', { page: pages(comprehensive), audio: (comprehensive.audio_tracks || []).join('、'), type: '综合练习' }));
  }
  return items;
}

function sourceRecord(root, registryEntry) {
  const lessonRoot = path.join(root, registryEntry.lesson_path);
  const canonicalPath = path.join(lessonRoot, '00-source', 'canonical-source.json');
  const sourceManifestPath = path.join(lessonRoot, '00-source', 'source-manifest.json');
  const audioManifestPath = path.join(lessonRoot, '00-source', 'audio-manifest.json');
  const canonical = readJson(canonicalPath);
  const sourceManifest = readJson(sourceManifestPath);
  const audioManifest = readJson(audioManifestPath);
  const completion = completionFor(registryEntry);
  if (!canonical) return { available: false, review_complete: Boolean(completion), completion, reason: completion ? `本课 review 已由 Adam 于 ${completion.confirmed_at} 确认完成；当前没有可嵌入的 canonical source，技术来源状态保留。` : '当前 registry 课次没有 canonical-source.json；保留 source manifest 状态，不填入演示内容。', source_manifest: sourceManifest, canonical_path: path.relative(root, canonicalPath), source_manifest_path: path.relative(root, sourceManifestPath), review_items: [] };
  const items = buildReviewItems(canonical);
  return {
    available: items.length > 0,
    review_complete: Boolean(completion),
    completion,
    reason: items.length ? '' : (completion ? `本课 review 已由 Adam 于 ${completion.confirmed_at} 确认完成；canonical source 当前没有可审核的 sections，技术结构状态保留。` : 'canonical-source.json 存在，但目前没有可审核的 sections；等待来源资料完成结构化。'),
    canonical,
    source_manifest: sourceManifest,
    audio: normaliseAudio(canonical, audioManifest),
    canonical_path: path.relative(root, canonicalPath),
    source_manifest_path: path.relative(root, sourceManifestPath),
    canonical_source_sha256: sourceManifest && (sourceManifest.canonical_source_sha256 || sourceManifest.canonical_source && sourceManifest.canonical_source.sha256),
    review_items: items
  };
}

const registry = readJson(path.join(sourceRoot, 'course', 'lesson-registry.json'));
if (!registry || !Array.isArray(registry.lessons)) throw new Error(`无法读取 lesson registry：${sourceRoot}`);
const base = loadDashboard(path.join(sourceRoot, 'dashboard', 'manifest.js'));
const existing = new Map((base.lessons || []).map((lesson) => [lesson.id || lesson.lesson_key, lesson]));
const lessons = registry.lessons.map((entry) => {
  const key = entry.lesson_key || `${entry.textbook_id}:${entry.lesson_id}`;
  const old = existing.get(key);
  const completion = completionFor(entry);
  const completionFields = completion ? { completion_status: completion.status, completion_confirmed_at: completion.confirmed_at, completion_evidence: completion.evidence } : {};
  if (old && completion) return {
    ...old,
    status: 'done',
    status_label: '已完成（Adam 确认）',
    stage: '当前教材 review 已完成',
    next_action: '转入后续维护；新 textbook review workflow 独立准备',
    progress: { completed: 1, total: 1, percent: 100 },
    ...completionFields
  };
  if (old) return old;
  const status = entry.status || {};
  const authorityConfirmed = status.authority_status === 'final_confirmed';
  return {
    id: key, lesson_key: key, textbook_id: entry.textbook_id, offering_id: (entry.offering_ids || [])[0], lesson_id: entry.lesson_id,
    number: entry.lesson_number, title: entry.title, status: authorityConfirmed ? 'approved' : 'available', status_label: authorityConfirmed ? 'authority 已确认' : '可查看',
    stage: status.stage || 'source', next_action: authorityConfirmed ? '等待交付 gate' : '等待来源审核', unlock_reason: '', progress: { completed: 0, total: 11, percent: 0 },
    catalog: { printed_pages: entry.printed_pages || '待登记', pdf_pages: entry.pdf_page || '待登记', audio_count: entry.audio_count || 0 }, scope: { period_count: null, total_minutes: null, ppt_slide_count: null, activity_count: null },
    counts: { source_sections: 0, exercises: null, audio: entry.audio_count || 0, authority_files: 0 }, manifest_path: entry.authority_manifest, source_manifest_path: entry.source_manifest,
    ...completionFields
  };
});

const reviewSources = {};
for (const entry of registry.lessons) {
  const key = entry.lesson_key || `${entry.textbook_id}:${entry.lesson_id}`;
  reviewSources[key] = sourceRecord(sourceRoot, entry);
}

const output = {
  ...base,
  schema_version: '4.0',
  manifest_type: 'course-dashboard-review',
  generated_at: new Date().toISOString().slice(0, 10),
  generated_from: { ...(base.generated_from || {}), lesson_registry: 'course/lesson-registry.json', canonical_sources: 'lessons/<textbook_id>/lesson-XX/00-source/canonical-source.json' },
  course: {
    ...(base.course || {}),
    textbooks: (base.course && base.course.textbooks || []).map((book) => {
      const registryBook = (registry.textbooks || []).find((candidate) => candidate.textbook_id === book.textbook_id);
      return registryBook ? { ...book, status: registryBook.status, completion_record: registryBook.completion_record || null } : book;
    })
  },
  lessons,
  review_sources: reviewSources
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `window.DASHBOARD_MANIFEST = ${JSON.stringify(output, null, 2)};\n`);
console.log(`Wrote ${path.relative(process.cwd(), outputPath)}: ${lessons.length} lessons, ${Object.values(reviewSources).filter((source) => source.available).length} reviewable sources.`);
