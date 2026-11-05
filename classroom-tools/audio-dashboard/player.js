'use strict';
const el = id => document.getElementById(id);
const audio = el('audio');
const ui = window.AudioDashboardUI;
let selectedSet, tracks = [], current = 0;
const played = new Set();
const option = (value, label) => new Option(label, value);
const lessonNumbers = t => t.lessons?.length ? t.lessons : [t.lesson];
for (const book of AUDIO_CATALOG) el('book').add(option(book.id, book.title));
const initialExam = new URLSearchParams(location.search).get('exam');
el('book').value = AUDIO_CATALOG.find(b => b.sets.some(s => s.id === initialExam))?.id || 'boya-elementary-i';
function changeBook() {
  const book = AUDIO_CATALOG.find(b => b.id === el('book').value);
  el('set').replaceChildren(...book.sets.map(s => option(s.id, ui.setLabel(s))));
  const requested = new URLSearchParams(location.search).get('exam');
  if (book.sets.some(s => s.id === requested)) el('set').value = requested;
  else if (book.default_set) el('set').value = book.default_set;
  el('set').disabled = !book.sets.length;
  if (!book.sets.length) el('set').add(option('', '尚未登记播放清单'));
  changeSet();
}
function changeSet() {
  const book = AUDIO_CATALOG.find(b => b.id === el('book').value);
  selectedSet = book.sets.find(s => s.id === el('set').value);
  document.title = '荣市大学 · 测验与音频中心';
  document.querySelector('footer').textContent = '荣市大学华语听说 · 教师使用';
  el('teacher-links').replaceChildren();
  const controls = ui.managementTools(book, selectedSet, window.ASSESSMENT_CLOSEOUT);
  for (const tool of controls) {
    const link = document.createElement('a');
    link.textContent = tool.label;
    if (tool.label === '综合管理总表') link.id = 'management-link';
    if (tool.url) {
      link.href = tool.url;
      if (/^https:\/\//.test(tool.url)) { link.target = '_blank'; link.rel = 'noopener'; }
    } else {
      link.setAttribute('role', 'link'); link.setAttribute('aria-disabled', 'true');
      link.tabIndex = 0; link.title = tool.reason;
      link.setAttribute('aria-describedby', 'tools-status');
    }
    el('teacher-links').append(link);
  }
  const unavailable = controls.filter(tool => !tool.url).map(tool => tool.label);
  el('tools-status').textContent = unavailable.length
    ? `暂不可用：${unavailable.join('、')}。尚未登记对应入口，补齐后启用。` : '';
  el('extra-tools').replaceChildren();
  for (const tool of selectedSet?.tools || []) {
    if (ui.managementLabels.includes(tool.label) || tool.label === '二年级测验管理表') continue;
    const link = document.createElement('a'); link.href = tool.url;
    link.textContent = tool.label === '教师审阅表单' ? '表单编辑（审阅稿）' : tool.label;
    link.target = '_blank'; link.rel = 'noopener'; el('extra-tools').append(link);
  }
  const isAssessment = !!selectedSet && (selectedSet.tracks.some(track => track.questions) || !!selectedSet.exam);
  el('set-status').textContent = selectedSet?.status || '这本教材尚未登记播放清单。';
  el('lessons').replaceChildren();
  for (const lesson of [...new Set((selectedSet?.tracks || []).flatMap(lessonNumbers))].sort((a,b) => a-b)) {
    const label = document.createElement('label'); label.className = 'lesson';
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = true; input.value = lesson;
    input.addEventListener('change', filterTracks);
    label.append(input, ` 第${lesson}课`); el('lessons').append(label);
  }
  el('exam-link').hidden = true;
  el('exam-link').removeAttribute('href');
  el('host-status').hidden = !selectedSet?.dashboard;
  if (selectedSet?.dashboard) {
    const set = selectedSet;
    el('host-status').textContent = '正在检查完整主持页面…';
    fetch(set.dashboard, { method: 'HEAD' }).then(response => {
      if (selectedSet !== set) return;
      if (response.ok) {
        el('exam-link').href = set.dashboard;
        el('exam-link').hidden = false;
        el('host-status').hidden = true;
      } else el('host-status').textContent = '完整主持页面在本机不可用；可使用本页播放音频。';
    }).catch(() => {
      if (selectedSet === set) el('host-status').textContent = '无法检查完整主持页面；请通过本机服务器打开，或使用本页播放音频。';
    });
  }
  const exam = selectedSet?.exam;
  el('exam-dialog').close();
  el('exam-entry').hidden = !exam;
  el('no-exam').hidden = !!exam;
  el('exam-qr').hidden = true;
  el('exam-qr').removeAttribute('src');
  el('large-qr').removeAttribute('src');
  el('student-link').removeAttribute('href');
  el('student-link').hidden = false;
  el('show-qr').hidden = false;
  el('no-exam').textContent = !selectedSet ? '这本教材尚未登记测验。'
    : isAssessment ? '本卷尚未登记学生作答入口。' : '此清单用于播放音频，不提供学生作答入口。';
  if (exam) {
    const syncVerified = exam.sync_verified !== false;
    el('exam-title').textContent = ui.range(exam.title);
    el('exam-state').textContent = syncVerified ? (exam.open ? '已发布 · 接受作答' : '尚未开放作答') : exam.sync_message;
    if (syncVerified) {
      el('exam-qr').hidden = false;
      el('exam-qr').src = exam.qr;
      el('student-link').href = exam.url;
    } else {
      el('student-link').hidden = true;
      el('show-qr').hidden = true;
    }
    el('qr-title').textContent = ui.range(exam.title);
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
    const nextGroup = t.section_id || `lesson-${lessonNumbers(t).join('-')}`;
    if (nextGroup !== groupId) {
      groupId = nextGroup;
      const group = document.createElement('li'), heading = document.createElement('h3');
      group.className = 'audio-group';
      heading.textContent = t.section_id ? ui.range(t.section_title)
        : `${lessonNumbers(t).map(n => `第${n}课`).join('、')}｜${selectedSet.id.startsWith('source') ? '教材原音' : '审阅音频'}`;
      groupList = document.createElement('ol');
      group.append(heading, groupList); el('queue').append(group);
    }
    const li = document.createElement('li'), button = document.createElement('button');
    button.className = 'track'; button.disabled = !t.file;
    button.classList.toggle('played', played.has(t.file));
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(index+1).padStart(2, '0');
    const info = document.createElement('span'); info.textContent = ui.trackTitle(t);
    const detail = document.createElement('small'); detail.textContent = ui.trackDetail(t);
    info.append(detail);
    const action = document.createElement('span'); action.className = 'track-action';
    action.textContent = played.has(t.file) ? '已播放' : t.file ? '播放' : '音频缺失';
    button.append(number, info, action); button.addEventListener('click', () => { selectTrack(index); play(); });
    li.append(button); groupList.append(li);
  });
  const playableTracks = tracks.filter(t => t.file);
  el('count').textContent = `${new Set(playableTracks.map(t => t.file)).size}段音频 · ${playableTracks.length}个播放入口`
    + (tracks.length > playableTracks.length ? ` · ${tracks.length - playableTracks.length}个缺失` : '');
  el('empty').hidden = tracks.length > 0;
  selectTrack(0);
}
function selectTrack(index) {
  audio.pause(); audio.removeAttribute('src'); audio.load();
  current = index; el('error').textContent = '';
  const t = tracks[current];
  el('title').textContent = t ? ui.trackTitle(t) : '选择音频';
  el('detail').textContent = t ? ui.trackDetail(t) : '';
  el('status').textContent = t?.file ? '准备播放' : '没有可用音频';
  el('play').disabled = !t?.file;
  el('prev').disabled = !tracks.length || current === 0;
  el('next').disabled = !tracks.length || current === tracks.length-1;
  if (t?.file) audio.src = t.file;
  [...el('queue').querySelectorAll('button')].forEach((b,i) => b.setAttribute('aria-current', String(i === current)));
}
async function play() {
  if (!tracks[current]?.file) return;
  audio.currentTime = 0; el('error').textContent = '';
  try { await audio.play(); } catch (error) { if (error.name !== 'AbortError') el('error').textContent = '播放失败，请检查音频后重试。'; }
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
  if (!tracks[current]?.file) return;
  played.add(tracks[current].file);
  const button = el('queue').querySelectorAll('button')[current];
  button.classList.add('played');
  button.lastElementChild.textContent = '已播放';
});
audio.addEventListener('pause', () => { el('status').textContent = audio.ended ? '本段播放结束' : '已暂停'; });
audio.addEventListener('ended', () => { el('status').textContent = '本段播放结束；可重听或切换下一段。'; });
audio.addEventListener('error', () => { el('error').textContent = '音频无法加载，请检查文件后重试。'; });
changeBook();
