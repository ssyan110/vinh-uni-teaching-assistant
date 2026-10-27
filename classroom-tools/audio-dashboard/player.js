'use strict';
const el = id => document.getElementById(id);
const audio = el('audio');
let selectedSet, tracks = [], current = 0;
const played = new Set();
const option = (value, label) => new Option(label, value);
const lessonNumbers = t => t.lessons?.length ? t.lessons : [t.lesson];
const lessonLabel = t => lessonNumbers(t).map(n => `第${n}课`).join('、');
for (const book of AUDIO_CATALOG) el('book').add(option(book.id, book.title));
el('book').value = 'boya-elementary-i';
function changeBook() {
  const book = AUDIO_CATALOG.find(b => b.id === el('book').value);
  el('set').replaceChildren(...book.sets.map(s => option(s.id, s.label)));
  const requested = new URLSearchParams(location.search).get('exam');
  if (book.sets.some(s => s.id === requested)) el('set').value = requested;
  else if (book.default_set) el('set').value = book.default_set;
  changeSet();
}
function changeSet() {
  const book = AUDIO_CATALOG.find(b => b.id === el('book').value);
  selectedSet = book.sets.find(s => s.id === el('set').value);
  const w07 = selectedSet?.id === 'W07-L04L15-20261022';
  document.title = (w07 ? '荣市大学' : '榮市大学') + ' · 测验与音频中心';
  document.querySelector('footer').textContent = (w07 ? '荣市大学' : '榮市大学') + '华语听说 · 教师使用';
  el('management-link').hidden = !book.management_url;
  if (book.management_url) el('management-link').href = book.management_url;
  el('teacher-links').replaceChildren();
  for (const tool of selectedSet?.tools || []) {
    const link = document.createElement('a');
    link.href = tool.url; link.textContent = tool.label; link.target = '_blank'; link.rel = 'noopener';
    el('teacher-links').append(link);
  }
  if (selectedSet && /^W\d{2}-/.test(selectedSet.id)) {
    const link = document.createElement('a');
    link.href = `closeout.html?exam=${encodeURIComponent(selectedSet.id)}`;
    link.textContent = '周测检查';
    el('teacher-links').append(link);
  }
  el('set-status').textContent = selectedSet?.status || '这本教材尚未登记播放清单。';
  el('lessons').replaceChildren();
  for (const lesson of [...new Set((selectedSet?.tracks || []).flatMap(lessonNumbers))].sort((a,b) => a-b)) {
    const label = document.createElement('label'); label.className = 'lesson';
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = true; input.value = lesson;
    input.addEventListener('change', filterTracks);
    label.append(input, ` 第${lesson}课`); el('lessons').append(label);
  }
  el('exam-link').hidden = !selectedSet?.dashboard;
  if (selectedSet?.dashboard) el('exam-link').href = selectedSet.dashboard;
  else el('exam-link').removeAttribute('href');
  const exam = selectedSet?.exam;
  el('exam-dialog').close();
  el('exam-entry').hidden = !exam;
  el('no-exam').hidden = !!exam;
  el('exam-qr').removeAttribute('src');
  el('student-link').removeAttribute('href');
  el('student-link').hidden = false;
  el('show-qr').hidden = false;
  if (exam) {
    const syncVerified = exam.sync_verified !== false;
    el('exam-title').textContent = exam.title;
    el('exam-state').textContent = syncVerified ? (exam.open ? '已发布 · 接受作答' : '尚未开放作答') : exam.sync_message;
    if (syncVerified) {
      el('exam-qr').src = exam.qr;
      el('student-link').href = exam.url;
    } else {
      el('student-link').hidden = true;
      el('show-qr').hidden = true;
    }
    el('qr-title').textContent = exam.title;
    if (syncVerified) el('large-qr').src = exam.qr;
    el('qr-state').textContent = syncVerified ? (exam.open ? '请扫描二维码，填写姓名和学号后开始作答。' : '表单尚未开放，请等待教师。') : exam.sync_message;
  }
  filterTracks();
}
function filterTracks() {
  const lessons = [...el('lessons').querySelectorAll('input:checked')].map(i => Number(i.value));
  tracks = (selectedSet?.tracks || []).filter(t => lessonNumbers(t).some(lesson => lessons.includes(lesson)));
  el('queue').replaceChildren();
  let groupId, groupList;
  tracks.forEach((t, index) => {
    if (t.section_id && t.section_id !== groupId) {
      groupId = t.section_id;
      const group = document.createElement('li'), heading = document.createElement('h3');
      group.className = 'audio-group';
      heading.textContent = t.section_title;
      groupList = document.createElement('ol');
      group.append(heading, groupList); el('queue').append(group);
    }
    const li = document.createElement('li'), button = document.createElement('button');
    button.className = 'track'; button.disabled = !t.file;
    button.classList.toggle('played', played.has(t.file));
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(index+1).padStart(2, '0');
    const info = document.createElement('span'); info.textContent = t.title;
    const detail = document.createElement('small'); detail.textContent = `${lessonLabel(t)} · Audio ${t.id}`+(t.questions ? ` · 题${t.questions}` : '');
    info.append(detail);
    const action = document.createElement('span'); action.textContent = played.has(t.file) ? '✓ 已播放' : t.file ? '播放 ↗' : '音档缺失';
    button.append(number, info, action); button.addEventListener('click', () => { selectTrack(index); play(); });
    li.append(button); (t.section_id ? groupList : el('queue')).append(li);
  });
  const playableTracks = tracks.filter(t => t.file);
  el('count').textContent = `${new Set(playableTracks.map(t => t.id)).size}段音频 · ${playableTracks.length}个播放入口`;
  el('empty').hidden = tracks.length > 0;
  selectTrack(0);
}
function selectTrack(index) {
  audio.pause(); audio.removeAttribute('src'); audio.load();
  current = index; el('error').textContent = '';
  const t = tracks[current];
  el('title').textContent = t?.title || '选择音段';
  el('detail').textContent = t ? `Audio ${t.id}`+(t.questions ? ` · 题${t.questions}` : '') : '';
  el('status').textContent = t?.file ? '准备播放' : '没有可用音档';
  el('play').disabled = !t?.file;
  el('prev').disabled = !tracks.length || current === 0;
  el('next').disabled = !tracks.length || current === tracks.length-1;
  if (t?.file) audio.src = t.file;
  [...el('queue').querySelectorAll('button')].forEach((b,i) => b.setAttribute('aria-current', String(i === current)));
}
async function play() {
  if (!tracks[current]?.file) return;
  audio.currentTime = 0; el('error').textContent = '';
  try { await audio.play(); } catch (error) { if (error.name !== 'AbortError') el('error').textContent = '播放失败，请检查音档后重试。'; }
}
el('book').addEventListener('change', changeBook);
el('set').addEventListener('change', changeSet);
el('prev').addEventListener('click', () => selectTrack(current-1));
el('next').addEventListener('click', () => selectTrack(current+1));
el('play').addEventListener('click', play);
el('show-qr').addEventListener('click', () => el('exam-dialog').showModal());
el('close-qr').addEventListener('click', () => el('exam-dialog').close());
audio.addEventListener('playing', () => {
  el('status').textContent = '正在播放';
  played.add(tracks[current].file);
  const button = el('queue').querySelectorAll('button')[current];
  button.classList.add('played');
  button.lastElementChild.textContent = '✓ 已播放';
});
audio.addEventListener('pause', () => { el('status').textContent = audio.ended ? '本段播放结束' : '已暂停'; });
audio.addEventListener('ended', () => { el('status').textContent = '本段播放结束；可重听或切换下一段。'; });
audio.addEventListener('error', () => { el('error').textContent = '音档无法加载，请检查文件后重试。'; });
changeBook();
