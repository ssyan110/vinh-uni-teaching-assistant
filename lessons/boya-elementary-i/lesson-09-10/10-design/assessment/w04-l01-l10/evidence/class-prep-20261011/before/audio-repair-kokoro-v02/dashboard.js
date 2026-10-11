'use strict';
const tracks = JSON.parse(document.getElementById('track-data').textContent);
const el = id => document.getElementById(id);
const player = el('audio');
let current = 0, timer = null, completed = tracks.map(() => 0), fullPlayback = false;
function stopTimer() { if (timer !== null) clearInterval(timer); timer = null; el('countdown').textContent = ''; }
function displayCounts() {
  el('replays').textContent = `完整播放 ${completed[current]} 次／计划播放 ${tracks[current].play_count} 次`;
}
function selectTrack(n) {
  if (n < 0 || n >= tracks.length) return;
  player.pause(); stopTimer(); current = n; fullPlayback = false;
  const t = tracks[current];
  el('error').textContent = '';
  el('range').textContent = `Nhóm ${current + 1} · ${t.question_range.replace(/第|题/g, '')} · ${current + 1} / ${tracks.length}`;
  el('track').textContent = `Audio ${t.audio_id} · ${t.duration_seconds.toFixed(2)}秒 · ${t.internal_repeat ? '录音内已读两轮，只播放整段一次；第三音节不设题' : '同一录音播放两次'}`;
  el('status').textContent = '先看题，准备播放';
  el('timing').textContent = `参考：看题${t.preview_seconds}秒，${t.play_count === 2 ? '两遍间答题' + t.between_plays_seconds + '秒，' : ''}最后作答${t.answer_seconds}秒。按实际需要调整。`;
  el('prev').disabled = current === 0; el('next').disabled = current === tracks.length - 1;
  el('progress').value = 0; el('elapsed').textContent = '0.0秒';
  player.src = t.file; player.load(); displayCounts();
  for (let i = 0; i < tracks.length; i++) el('queue').children[i].className = i === current ? 'current' : '';
}
async function playFromStart() {
  stopTimer(); el('error').textContent = ''; fullPlayback = true;
  player.currentTime = 0;
  try { await player.play(); } catch (err) { fullPlayback = false; el('error').textContent = '播放失败，请检查音频文件和浏览器播放权限。'; el('status').textContent = '未播放'; }
}
player.addEventListener('play', () => { if (player.currentTime < 0.25) fullPlayback = true; el('status').textContent = '正在播放'; });
player.addEventListener('pause', () => { if (!player.ended) el('status').textContent = '已暂停'; });
player.addEventListener('seeking', () => { if (player.currentTime > 0.25) fullPlayback = false; });
player.addEventListener('ended', () => {
  if (fullPlayback) completed[current]++;
  fullPlayback = false; displayCounts();
  el('status').textContent = completed[current] >= tracks[current].play_count ? '计划播放完成，请留时间作答，再到下一段' : '本次播放结束；先作答，再重听';
});
player.addEventListener('timeupdate', () => {
  el('progress').value = Number.isFinite(player.duration) && player.duration > 0 ? player.currentTime / player.duration : 0;
  el('elapsed').textContent = `${player.currentTime.toFixed(1)}秒 / ${tracks[current].duration_seconds.toFixed(1)}秒`;
});
player.addEventListener('error', () => { fullPlayback = false; el('error').textContent = '音频无法加载；请把dashboard.html、dashboard.js和audio文件夹放在同一目录。'; el('status').textContent = '加载失败'; });
el('play').addEventListener('click', playFromStart);
el('pause').addEventListener('click', () => player.pause());
el('prev').addEventListener('click', () => selectTrack(current - 1));
el('next').addEventListener('click', () => selectTrack(current + 1));
el('reset').addEventListener('click', () => { player.pause(); stopTimer(); completed.fill(0); fullPlayback = false; displayCounts(); el('status').textContent = '播放记录已清零'; });
el('timer').addEventListener('click', () => {
  stopTimer(); let seconds = tracks[current].preview_seconds;
  el('countdown').textContent = `看题剩余${seconds}秒`;
  timer = setInterval(() => { seconds--; el('countdown').textContent = seconds > 0 ? `看题剩余${seconds}秒` : '看题计时结束，可开始播放'; if (seconds <= 0) { clearInterval(timer); timer = null; } }, 1000);
});
tracks.forEach((t, i) => {
  const li = document.createElement('li'), button = document.createElement('button');
  button.type = 'button'; button.textContent = `Nhóm ${i + 1} · ${t.question_range.replace(/第|题/g, '')} · Audio ${t.audio_id}`;
  button.addEventListener('click', () => selectTrack(i)); li.appendChild(button); el('queue').appendChild(li);
});
selectTrack(0);
