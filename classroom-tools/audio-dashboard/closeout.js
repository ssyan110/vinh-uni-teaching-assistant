'use strict';
const data = window.ASSESSMENT_CLOSEOUT;
const select = document.getElementById('exam');
const labels = {pass:'本地检查通过', mismatch:'有不一致', stale:'记录已过期', recorded:'有保存记录', unknown:'尚未核实', pending:'待完成'};
if (!data || !Array.isArray(data.exams) || !data.exams.length) {
  document.getElementById('summary').textContent = data?.error || '尚未生成检查资料，请先运行页面下方的构建命令。';
  select.disabled = true;
} else {
  document.getElementById('generated').textContent = `本地检查时间：${data.generated_at}`;
  for (const exam of data.exams) select.add(new Option(exam.label, exam.id));
  const requested = new URLSearchParams(location.search).get('exam');
  if (requested !== null) {
    if (data.exams.some(exam => exam.id === requested)) select.value = requested;
    else {
      const placeholder = new Option('请选择现行测验', '');
      placeholder.disabled = true;
      select.prepend(placeholder);
      select.value = '';
    }
  }
  function render() {
    const exam = data.exams.find(exam => exam.id === select.value);
    if (!exam) {
      document.getElementById('summary').textContent = '链接指定的测验不在现行清单中，请从上方选择测验。';
      document.getElementById('source').textContent = '';
      document.getElementById('checks').replaceChildren();
      document.getElementById('back').href = 'index.html';
      return;
    }
    document.getElementById('back').href = `index.html?exam=${encodeURIComponent(exam.id)}`;
    document.getElementById('summary').textContent = `${exam.question_count ?? '—'}题 · ${exam.points ?? '—'}分 · ${exam.issue_count}项不一致或过期记录。其余待核实项目见下方。`;
    document.getElementById('source').textContent = `现行资料：${exam.source || '目录无法解析'}`;
    const container = document.getElementById('checks'); container.replaceChildren();
    for (const check of exam.checks) {
      const card = document.createElement('article'); card.dataset.status = check.status;
      const title = document.createElement('h2'); title.textContent = check.label;
      const state = document.createElement('span'); state.className = 'state'; state.textContent = labels[check.status] || '尚未核实';
      const detail = document.createElement('p'); detail.textContent = check.detail;
      card.append(title, state, detail);
      if (check.action) { const action = document.createElement('p'); action.textContent = `下一步：${check.action}`; card.append(action); }
      container.append(card);
    }
  }
  select.addEventListener('change', render); render();
}
