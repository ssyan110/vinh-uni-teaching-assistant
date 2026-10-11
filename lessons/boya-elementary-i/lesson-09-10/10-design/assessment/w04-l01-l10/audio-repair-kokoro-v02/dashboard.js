'use strict';
const tracks = JSON.parse(document.getElementById('track-data').textContent);
const el = id => document.getElementById(id);
const player = el('audio');
const version = JSON.stringify(tracks);
const storageKey = 'W04-L01L10-playback:' + location.pathname;
let current = 0, timer = null, completed = tracks.map(() => 0), fullPlayback = false;
let restored = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && saved.version === version && Number.isInteger(saved.current) && saved.current >= 0 && saved.current < tracks.length && Array.isArray(saved.completed) && saved.completed.length === tracks.length && saved.completed.every(n => Number.isSafeInteger(n) && n >= 0)) {
    current = saved.current; completed = saved.completed; restored = true;
  }
} catch (_) { /* Storage may be unavailable for local files. */ }
function saveProgress() {
  try { localStorage.setItem(storageKey, JSON.stringify({version, current, completed})); }
  catch (_) { el('storage-status').textContent = '浏览器无法保存播放记录；重整前请记下段号和遍数。'; }
}
function stopTimer() { if (timer !== null) clearInterval(timer); timer = null; el('countdown').textContent = ''; }
function displayCounts() {
  el('replays').textContent = `完整播放 ${completed[current]} 次／计划播放 ${tracks[current].play_count} 次`;
}
function selectTrack(n, ask = true, scroll = true) {
  if (n < 0 || n >= tracks.length) return;
  if (ask && n !== current && completed[current] < tracks[current].play_count && !confirm('当前段尚未完成计划播放次数。仍要切换吗？')) return;
  player.pause(); stopTimer(); current = n; fullPlayback = false;
  const t = tracks[current];
  el('error').textContent = '';
  el('range').textContent = `题${t.question_range.replace(/第|题/g, '')} · 第${current + 1}段／共${tracks.length}段`;
  el('track').textContent = `Audio ${t.audio_id} · ${t.duration_seconds.toFixed(2)}秒 · ${t.internal_repeat ? '录音内已读两轮，只播放整段一次；第三音节不设题' : '同一录音播放两次'}`;
  el('status').textContent = '先看题，准备播放';
  el('timing').textContent = `参考：看题${t.preview_seconds}秒，${t.play_count === 2 ? '两遍间作答' + t.between_plays_seconds + '秒，' : ''}最后作答${t.answer_seconds}秒。按实际需要调整。`;
  el('between-timer').disabled = t.play_count !== 2;
  el('prev').disabled = current === 0; el('next').disabled = current === tracks.length - 1;
  el('progress').value = 0; el('elapsed').textContent = '0.0秒';
  player.src = t.file; player.load(); displayCounts(); saveProgress();
  for (let i = 0; i < tracks.length; i++) el('queue').children[i].className = i === current ? 'current' : '';
  if (scroll) el('player-panel').scrollIntoView({block: 'start'});
}
async function playFromStart() {
  stopTimer(); el('error').textContent = ''; fullPlayback = true;
  if (player.error) { player.src = tracks[current].file; player.load(); }
  player.currentTime = 0;
  try { await player.play(); } catch (_) { fullPlayback = false; el('error').textContent = `播放失败：${tracks[current].file}。检查文件与播放权限，再按从头播放重试。`; el('status').textContent = '未播放'; }
}
player.addEventListener('play', () => { if (player.currentTime < 0.25) fullPlayback = true; el('status').textContent = '正在播放'; });
player.addEventListener('pause', () => { if (!player.ended) { stopTimer(); el('status').textContent = '已暂停；从原位置续播仍可计为一遍'; } });
player.addEventListener('seeking', () => { if (player.currentTime > 0.25) fullPlayback = false; });
player.addEventListener('ended', () => {
  if (fullPlayback) completed[current]++;
  fullPlayback = false; displayCounts(); saveProgress();
  const done = completed[current] >= tracks[current].play_count;
  el('status').textContent = done ? (current === tracks.length - 1 ? '全卷播放到末段；请检查各段遍数，留时间检查姓名、学号与答案，再提交并确认成功画面。' : '计划播放完成，请留时间作答，再到下一段') : '本次播放结束；先作答，再重听';
});
player.addEventListener('timeupdate', () => {
  el('progress').value = Number.isFinite(player.duration) && player.duration > 0 ? player.currentTime / player.duration : 0;
  el('elapsed').textContent = `${player.currentTime.toFixed(1)}秒 / ${tracks[current].duration_seconds.toFixed(1)}秒`;
});
player.addEventListener('error', () => { fullPlayback = false; el('error').textContent = `音频无法加载：${tracks[current].file}。检查该相对路径；按从头播放可重新加载。`; el('status').textContent = '加载失败'; });
function startTimer(label, seconds) {
  stopTimer(); el('countdown').textContent = `${label}剩余${seconds}秒`;
  timer = setInterval(() => { seconds--; el('countdown').textContent = seconds > 0 ? `${label}剩余${seconds}秒` : `${label}计时结束；由教师决定下一步，不自动播放。`; if (seconds <= 0) { clearInterval(timer); timer = null; } }, 1000);
}
el('play').addEventListener('click', playFromStart);
el('pause').addEventListener('click', () => { player.pause(); stopTimer(); });
el('prev').addEventListener('click', () => selectTrack(current - 1));
el('next').addEventListener('click', () => selectTrack(current + 1));
el('reset').addEventListener('click', () => {
  if (!confirm('清零所有播放遍数并回到第1段？已保存的进度也会清零。')) return;
  player.pause(); stopTimer(); completed.fill(0); fullPlayback = false; selectTrack(0, false); el('status').textContent = '播放记录已清零';
});
el('timer').addEventListener('click', () => startTimer('看题', tracks[current].preview_seconds));
el('between-timer').addEventListener('click', () => startTimer('两遍间作答', tracks[current].between_plays_seconds));
el('answer-timer').addEventListener('click', () => startTimer('最后作答', tracks[current].answer_seconds));
tracks.forEach((t, i) => {
  const li = document.createElement('li'), button = document.createElement('button');
  button.type = 'button'; button.textContent = `题${t.question_range.replace(/第|题/g, '')} · 第${i + 1}段 · Audio ${t.audio_id}`;
  button.addEventListener('click', () => selectTrack(i)); li.appendChild(button); el('queue').appendChild(li);
});
selectTrack(current, false, false);
if (restored) el('storage-status').textContent = '已恢复同一音源版本的段号与完整播放遍数；本段从头开始，不自动播放。';
