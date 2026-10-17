'use strict';
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {done:'已报告',absent:'缺席',pending:'未报告',supplement:'待补评'};
let catalog = [], editingAssessment = null;
let state, token, classId, assessmentId, studentCode, draft, dirty = false, busy = false, view = 'score', query = '', filter = 'all', historical = false;
const cls = () => state.classes.find(c => c.id === classId);
const assessment = () => cls().assessments.find(a => a.id === assessmentId);
const key = (sid = studentCode, aid = assessmentId) => [classId, aid, sid].join('|');
const record = (sid = studentCode, aid = assessmentId) => state.records[key(sid, aid)];
const needsGrading = GradebookQueue.needsGrading;
const people = () => cls().students.filter(s => historical || s.active).slice().sort((a,b) => a.seat-b.seat || a.code.localeCompare(b.code));
function message(value, error = false) { $('message').textContent = value; $('message').classList.toggle('error', error); }
async function api(path, data) {
  const response = await fetch(path, data === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json','X-Gradebook-Token':token},body:JSON.stringify(data)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '操作失败，请重试');
  return result;
}
function mayLeave() {
  if (busy) { message('正在保存，请稍候。'); return false; }
  return !dirty || confirm('当前修改尚未保存。确定放弃修改并切换吗？');
}
function loadDraft() {
  const a = assessment();
  const r = record();
  draft = {status:r?.status || 'pending',scores:r?.scores.slice() || (a ? a.rubric.map(() => null) : []),note:r?.note || '',review_confirmed:false};
  dirty = false;
}
function pickStudent() {
  const students = people();
  if (!students.some(s => s.code === studentCode)) studentCode = students.find(s => needsGrading(record(s.code)))?.code || students[0]?.code;
  loadDraft();
}
function options() {
  $('class-select').innerHTML = state.classes.map(c => `<option value="${escape(c.id)}">${c.year === 1 ? '一年级' : '二年级'} · ${escape(c.id)}（${c.students.filter(s=>s.active).length} 人）</option>`).join('');
  $('class-select').value = classId;
  $('assessment-select').innerHTML = cls().assessments.map((a,i)=>`<option value="${escape(a.id)}">${i+1}. ${escape(a.title)}</option>`).join('') || '<option>请新增本班考试</option>';
  $('assessment-select').value = assessmentId || '';
  $('assessment-select').disabled = !cls().assessments.length;
  $('edit-assessment').disabled = !assessment();
  $('assessment-label').hidden = view === 'backup';
  $('export').href = '/api/export?class=' + encodeURIComponent(classId);
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}
function badge(r) { return r?.flags.length ? '待核对' : r?.total != null ? `${r.total} 分` : labels[r?.status || 'pending']; }
function visibleStudents() {
  return people().filter(s => (s.name+' '+s.code).toLocaleLowerCase().includes(query.toLocaleLowerCase())).filter(s => {
    const r = record(s.code);
    return filter === 'all' || filter === 'review' && r?.flags.length || filter === 'waiting' && needsGrading(r) || filter === 'done' && r?.status === 'done' && !r.flags.length;
  });
}
function studentList() {
  const items = visibleStudents();
  $('students').innerHTML = items.map(s => `<button class="student ${s.code===studentCode?'selected':''}" data-student="${escape(s.code)}" aria-current="${s.code===studentCode}"><span>${escape(s.name)}<small>${s.seat} 号 · ${escape(s.code)}${!s.active?' · 历史名单':''}</small></span><span class="badge">${badge(record(s.code))}</span></button>`).join('') || '<p class="muted">没有符合条件的学生。</p>';
}
function scorePage() {
  const a = assessment();
  if (!a) return `<div class="panel empty"><h1>${escape(classId)} 已加入名单</h1><p>本班有 ${cls().students.filter(s=>s.active).length} 位学生。点击“新增考试”，设置本次任务和评分项目。</p><p class="muted">一年级独立设置评分，不自动套用二年级标准。</p></div>`;
  const s = cls().students.find(s=>s.code===studentCode);
  if (!s) return '<div class="panel empty">本班没有可评分的学生。</div>';
  const completed = people().filter(s=>record(s.code)?.status==='done' && !record(s.code).flags.length).length;
  const r = record();
  const full = draft.status === 'done' && draft.scores.every(n=>typeof n==='number');
  const total = full ? draft.scores.reduce((a,b)=>a+b,0) : '—';
  return `<div class="layout"><aside class="panel roster"><h2>学生名单</h2><small>已评分 ${completed}／${people().length}</small><div class="progress"><span></span></div><label class="sr-label">搜索姓名或学号<input id="search" placeholder="搜索姓名或学号" value="${escape(query)}"></label><div class="roster-tools"><select id="student-filter" aria-label="名单筛选"><option value="all">全部学生</option><option value="waiting">待评分／待补评</option><option value="done">已评分</option><option value="review">原表待核对</option></select><label class="inline-check"><input type="checkbox" id="historical" ${historical?'checked':''}>包含历史名单</label></div><div class="students" id="students"></div></aside><article class="panel scoring"><div class="identity"><div><small>${escape(a.title)}${a.date?' · '+escape(a.date):''}</small><h1>${escape(s.name)}</h1><small>${s.seat} 号 · ${escape(s.code)}${!s.active?' · 历史名单':''}</small></div><button id="history">修改历史</button></div><p class="source-label">${escape(sourceLabel(a))}</p>${a.instructions?`<details class="exam-brief"><summary>查看本次考试要求</summary><div class="notice">${escape(a.instructions)}</div></details>`:''}<div class="grading-body">${r?.flags.length?`<div class="warning"><strong>原表记录需要核对</strong><p>${r.flags.map(escape).join('<br>')}</p><details><summary>查看原始记录</summary><pre>${escape(JSON.stringify(r.original,null,2))}</pre></details><label class="inline-check"><input id="review-confirmed" type="checkbox" ${draft.review_confirmed?'checked':''}>我已核对，按当前输入保存</label></div>`:''}<section class="criterion"><div class="criterion-header"><b>报告状态</b><small>缺席／未报告不计零分</small></div><div class="status-buttons">${Object.entries(labels).map(([v,l])=>`<button data-status="${v}" aria-pressed="${draft.status===v}">${l}</button>`).join('')}</div></section>${a.rubric.map((c,i)=>`<section class="criterion"><div class="criterion-header"><b>${escape(c.name)} <small>／${c.max} 分</small></b><button data-clear="${i}" aria-label="清除${escape(c.name)}分数">清除</button></div><div class="scores">${Array.from({length:Math.round(c.max*2)+1},(_,n)=>n/2).map(n=>`<button data-criterion="${i}" data-score="${n}" aria-label="${escape(c.name)} ${n} 分" aria-pressed="${draft.scores[i]===n}">${n}</button>`).join('')}</div>${c.description?`<details><summary>查看评分标准</summary><p>${escape(c.description)}</p></details>`:''}</section>`).join('')}<label class="note">表现证据／下次练习建议<textarea id="note" rows="2" maxlength="10000" placeholder="记录一个表现证据或下次要练习的内容">${escape(draft.note)}</textarea></label></div><footer class="score-footer"><div><span class="total">${total} <small>／${a.rubric.reduce((sum,c)=>sum+c.max,0)}</small></span><div id="save-state" class="save-state">${dirty?'有修改尚未保存':r?.updated_at?'已保存 · '+escape(r.updated_at):r?'已从原表导入':'尚未填写'}</div></div><div class="actions"><button id="save" ${busy?'disabled':''}>保存</button><button id="save-next" class="primary" ${busy?'disabled':''}>保存并评下一位 →</button></div></footer><p class="keyboard-hint"><small>⌘／Ctrl＋Enter：保存并下一位。待补评可保存部分分数，补齐后再选“已报告”。</small></p></article></div>`;
}
function overviewPage() {
  const students = people();
  const reviews = Object.entries(state.records).filter(([k,r])=>k.startsWith(classId+'|') && r.flags.length).length;
  return `<div class="panel"><h1>${escape(classId)} · 成绩总览</h1><div class="summary"><span><b>${cls().students.filter(s=>s.active).length}</b> 当前学生</span><span><b>${cls().assessments.length}</b> 次考试</span><span><b>${reviews}</b> 条原表待核对</span></div><label class="inline-check"><input id="overview-historical" type="checkbox" ${historical?'checked':''}>包含历史名单（保留原成绩）</label><p class="muted">点击成绩可返回评分。缺席、未报告和待补评不算零分；待核对记录不作为已确认成绩。这里保留各次成绩，不自行计算期末权重。</p><div class="table-wrap"><table><thead><tr><th>座号</th><th>姓名／学号</th>${cls().assessments.map((a,i)=>`<th class="exam-heading">第 ${i+1} 次<br><small>${escape(a.title)}${a.date?'<br>'+escape(a.date):''}<br>${escape(sourceLabel(a))}</small></th>`).join('')}</tr></thead><tbody>${students.map(s=>`<tr><td>${s.seat}${!s.active?'（历史）':''}</td><td>${escape(s.name)}<br><small>${escape(s.code)}</small></td>${cls().assessments.map(a=>`<td><button data-overview-student="${escape(s.code)}" data-assessment="${escape(a.id)}">${badge(record(s.code,a.id))}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function render(preserveDraftUI = false) {
  const openDetails = preserveDraftUI ? Array.from(document.querySelectorAll('.scoring details'),(d,i)=>d.open?i:-1).filter(i=>i>=0) : [];
  const scrollTop = document.querySelector('.grading-body')?.scrollTop || 0;
  const rosterScrollTop = $('students')?.scrollTop || 0;
  const focused = preserveDraftUI ? document.activeElement : null;
  const focusTarget = focused?.dataset.criterion !== undefined ? `[data-criterion="${focused.dataset.criterion}"][data-score="${focused.dataset.score}"]` : focused?.dataset.status ? `[data-status="${focused.dataset.status}"]` : focused?.dataset.clear !== undefined ? `[data-clear="${focused.dataset.clear}"]` : null;
  options();
  if (view === 'backup') { renderBackups().catch(e=>message(e.message,true)); return; }
  $('content').innerHTML = view === 'overview' ? overviewPage() : scorePage();
  if ($('students')) {
    $('student-filter').value = filter;
    studentList();
    $('search').addEventListener('input', e=>{query=e.target.value;studentList();});
    $('student-filter').addEventListener('change', e=>{filter=e.target.value;studentList();});
    $('historical').addEventListener('change', e=>{if (!mayLeave()){e.target.checked=historical;return;}historical=e.target.checked;pickStudent();render();});
    $('note').addEventListener('input', e=>{draft.note=e.target.value;markDirty();});
    $('review-confirmed')?.addEventListener('change', e=>{draft.review_confirmed=e.target.checked;markDirty();});
    // CSP excludes inline styles; the progress bar is derived from visible completed records.
    const progress = document.querySelector('.progress span');
    progress.style.width = `${100*people().filter(s=>record(s.code)?.status==='done'&&!record(s.code).flags.length).length/people().length}%`;
  }
  if(preserveDraftUI){const details=document.querySelectorAll('.scoring details');openDetails.forEach(i=>{if(details[i])details[i].open=true;});if(focusTarget)document.querySelector(focusTarget)?.focus({preventScroll:true});const body=document.querySelector('.grading-body');if(body)body.scrollTop=scrollTop;if($('students'))$('students').scrollTop=rosterScrollTop;}
  $('overview-historical')?.addEventListener('change', e=>{historical=e.target.checked;render();});
}
function markDirty() { dirty = true; if ($('save-state')) $('save-state').textContent='有修改尚未保存'; }
async function refresh() {
  if(!catalog.length)catalog=await api('/api/catalog');
  const result = await api('/api/state');state=result.state;token=result.token;
  classId = state.classes.some(c=>c.id===classId)?classId:state.classes[0].id;
  if (!cls().assessments.some(a=>a.id===assessmentId)) {
    assessmentId = cls().assessments.find(a=>cls().students.some(s=>s.active && !state.records[[classId,a.id,s.code].join('|')]))?.id || cls().assessments[0]?.id;
  }
  pickStudent();render();
}
async function save(next=false) {
  if (busy || !assessment() || !studentCode) return;
  busy=true;
  $('save').disabled=$('save-next').disabled=true;
  try {
    const result=await api('/api/save',{class_id:classId,assessment_id:assessmentId,student_code:studentCode,revision:state.revision,...draft});
    const previous=studentCode;
    const fetched=await api('/api/state');state=fetched.state;token=fetched.token;dirty=false;
    if (next) {
      studentCode=GradebookQueue.nextStudent(visibleStudents(),previous,state.records,[classId,assessmentId,''].join('|')) || previous;
    }
    loadDraft();message(result.warning || (next && studentCode!==previous?'已保存，已进入下一位。':next?'已保存。当前名单中没有其他待评分学生。':'已保存。'),Boolean(result.warning));
  } catch(e) { message(e.message,true); }
  finally {busy=false;render();}
}
async function renderBackups() {
  $('content').innerHTML=`<div class="panel"><h1>备份与恢复</h1><p>每次保存后更新当天最新备份，并保留当天开始前的快照。恢复前会另存当前资料。</p><p class="muted">电脑故障仍可能损失同一硬盘上的备份。请把下载的完整备份另外放在 U 盘或其他设备。</p><div class="actions"><button id="manual-backup" class="primary">建立并下载完整备份</button></div><h2>从备份文件恢复</h2><label>选择本 App 导出的 JSON 完整备份<input type="file" id="restore-file" accept=".json,application/json"></label><p id="restore-preview" class="muted"></p><button id="restore-upload" disabled>恢复这份备份</button><h2>本机自动备份</h2><div id="backup-list" class="backup-list">正在读取…</div></div>`;
  const result=await api('/api/backups');
  if (view!=='backup')return;
  $('backup-list').innerHTML=result.names.map(n=>`<div class="backup-row"><code>${escape(n)}</code><div><a class="button" href="/api/backup-file?name=${encodeURIComponent(n)}">下载</a> <button data-restore="${escape(n)}">恢复</button></div></div>`).join('') || '<p>尚无备份。</p>';
  let uploaded;
  $('restore-file').addEventListener('change',async e=>{
    uploaded=null;$('restore-upload').disabled=true;
    try {const f=e.target.files[0];if (!f)return;if (f.size>8000000)throw new Error('备份超过 8 MB');uploaded=JSON.parse(await f.text());if (uploaded.format!=='vinh-gradebook-v1')throw new Error('不是本 App 的备份');$('restore-preview').textContent=`这份备份有 ${uploaded.classes.length} 个班，${Object.keys(uploaded.records).length} 条评分记录。`;$('restore-upload').disabled=false;}catch(err){message(err.message,true);}
  });
  $('restore-upload').addEventListener('click',()=>restore(uploaded));
}
async function restore(snapshot) {
  if (!confirm(`将用这份备份恢复全部班级和评分记录（${Object.keys(snapshot.records||{}).length} 条）。当前资料会先另存备份。确定恢复吗？`))return;
  if (busy)return;busy=true;
  try {const result=await api('/api/restore',{snapshot,revision:state.revision});await refresh();message('已恢复。恢复前资料保存在：'+result.backup+(result.warning?'；'+result.warning:''),!!result.warning);}catch(e){message(e.message,true);}finally{busy=false;render();}
}
async function history() {
  const entries=await api('/api/history?key='+encodeURIComponent(key()));
  $('history-content').innerHTML=entries.map(e=>`<div class="history-entry"><strong>${escape(e.timestamp)}</strong><p>${labels[e.before?.status]||'未记录'} ${escape(e.before?.scores?.join('／'))} → ${labels[e.after?.status]||''} ${escape(e.after?.scores?.join('／'))}</p><p>${escape(e.after?.note||'无备注')}</p></div>`).join('') || '<p>尚无 App 内修改记录。原表资料保留在导入记录中。</p>';
  $('history-dialog').showModal();
}
$('class-select').addEventListener('change',e=>{if(!mayLeave()){e.target.value=classId;return;}classId=e.target.value;assessmentId=null;studentCode=null;query='';filter='all';historical=false;assessmentId=cls().assessments.find(a=>cls().students.some(s=>s.active&&!record(s.code,a.id)))?.id||cls().assessments[0]?.id;pickStudent();render();});
$('assessment-select').addEventListener('change',e=>{if(!mayLeave()){e.target.value=assessmentId;return;}assessmentId=e.target.value;studentCode=null;query='';pickStudent();render();});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(!mayLeave())return;view=b.dataset.view;loadDraft();render();}));
$('refresh').addEventListener('click',()=>{if(mayLeave())refresh().then(()=>message('已重新读取本机资料。')).catch(e=>message(e.message,true));});
$('export').addEventListener('click',e=>{if(dirty){e.preventDefault();message('请先保存当前修改，再导出成绩。',true);}});
$('content').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b || busy)return;
  try {
    if(b.dataset.student){if(!mayLeave())return;studentCode=b.dataset.student;loadDraft();render();if(matchMedia('(max-width:650px)').matches)document.querySelector('.scoring')?.scrollIntoView({block:'start'});}
    else if(b.dataset.status){const status=b.dataset.status;if(['absent','pending'].includes(status)&&draft.scores.some(s=>s!==null)){if(!confirm('此状态不计分。清除当前分项分数吗？原表记录和修改历史仍会保留。'))return;draft.scores=draft.scores.map(()=>null);}draft.status=status;markDirty();render(true);}
    else if(b.dataset.criterion!==undefined){draft.scores[Number(b.dataset.criterion)]=Number(b.dataset.score);if(draft.status!=='supplement')draft.status='done';markDirty();render(true);}
    else if(b.dataset.clear!==undefined){draft.scores[Number(b.dataset.clear)]=null;markDirty();render(true);}
    else if(b.id==='save')await save();
    else if(b.id==='save-next')await save(true);
    else if(b.id==='history')await history();
    else if(b.dataset.overviewStudent){studentCode=b.dataset.overviewStudent;assessmentId=b.dataset.assessment;view='score';loadDraft();render();}
    else if(b.id==='manual-backup'){const r=await api('/api/backup',{});message('完整备份已建立，可复制到另一台设备。');const a=document.createElement('a');a.href='/api/backup-file?name='+encodeURIComponent(r.name);a.download=r.name;a.click();render();}
    else if(b.dataset.restore){const response=await fetch('/api/backup-file?name='+encodeURIComponent(b.dataset.restore));if(!response.ok)throw new Error('备份读取失败');await restore(await response.json());}
  } catch(err){message(err.message,true);}
});
function sourceLabel(a) {
  const source=a.source;
  if(!source)return '原表导入 · 内容标记待补充';
  if(source.type==='extra')return '课外口语活动 · '+source.activity;
  const book=catalog.find(b=>b.id===source.textbook_id);
  return (book?.title||source.textbook_id)+' · '+source.lesson_keys.map(key=>{const l=book?.lessons.find(l=>l.key===key);return l?'第 '+l.number+' 课'+(l.title?' '+l.title:''):key;}).join('、');
}
function lessonOptions(selected=[]) {
  const book=catalog.find(b=>b.id===$('textbook-select').value);
  $('lesson-select').innerHTML=(book?.lessons||[]).map(l=>`<label><input type="checkbox" value="${escape(l.key)}" ${selected.includes(l.key)?'checked':''}>第 ${l.number} 课${l.title?' · '+escape(l.title):''}</label>`).join('');
}
function sourceFields() {
  const extra=$('source-type').value==='extra';
  $('textbook-fields').hidden=extra;$('activity-field').hidden=!extra;
}
function examForm(edit=false) {
  if(!mayLeave())return;
  editingAssessment=edit?assessment():null;
  const a=editingAssessment;
  $('assessment-form').reset();$('form-error').textContent='';
  $('assessment-dialog-title').textContent=a?'编辑考试':'新增考试';
  $('submit-assessment').textContent=a?'保存考试信息':'建立考试';
  $('assessment-help').textContent='每次有考试时建立一条记录，可考教材单课、跨课，或额外口语活动。';
  $('assessment-date').value=a?a.date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  $('assessment-title').value=a?.title||'';$('assessment-instructions').value=a?.instructions||'';
  $('source-type').value=a?.source?.type||'textbook';
  $('activity-name').value=a?.source?.activity||'';
  $('textbook-select').innerHTML=catalog.map(b=>`<option value="${escape(b.id)}">${escape(b.title)}</option>`).join('');
  $('textbook-select').value=a?.source?.textbook_id||(cls().year===1?'boya-elementary-i':'boya-quasi-intermediate-i');
  lessonOptions(a?.source?.lesson_keys||[]);sourceFields();
  $('rubric-mode').disabled=Boolean(a);$('add-criterion').hidden=Boolean(a);
  $('rubric-mode').value=a?'custom':cls().year===1?'total':'five';
  $('rubric-rows').innerHTML='';
  (a?.rubric||[{name:'',max:3},{name:'',max:2}]).forEach(c=>addRubricRow(c,Boolean(a)));
  $('custom-rubric').hidden=!a;
  $('assessment-dialog').showModal();
}
function addRubricRow(criterion={name:'',max:2},locked=false) {
  const row=document.createElement('div');row.className='rubric-row';
  row.innerHTML=`<label>项目名称<input data-rubric-name maxlength="100" value="${escape(criterion.name)}" ${locked?'disabled':''}></label><label>满分<input data-rubric-max type="number" min="0.5" max="100" step="0.5" value="${criterion.max}" ${locked?'disabled':''}></label>${locked?'':'<button type="button" data-remove-criterion aria-label="移除这项评分">移除</button>'}`;
  $('rubric-rows').append(row);
}
$('add-criterion').addEventListener('click',()=>{if(document.querySelectorAll('.rubric-row').length<10)addRubricRow();else $('form-error').textContent='最多设置 10 个评分项目。';});
$('rubric-rows').addEventListener('click',e=>{if(e.target.closest('[data-remove-criterion]'))e.target.closest('.rubric-row').remove();});
$('new-assessment').addEventListener('click',()=>examForm());
$('edit-assessment').addEventListener('click',()=>examForm(true));
$('textbook-select').addEventListener('change',()=>lessonOptions());
$('source-type').addEventListener('change',sourceFields);
$('rubric-mode').addEventListener('change',()=>{$('custom-rubric').hidden=$('rubric-mode').value!=='custom';});
$('cancel-assessment').addEventListener('click',()=>$('assessment-dialog').close());
$('assessment-form').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  try {
    let rubric;
    const mode=$('rubric-mode').value;
    if(editingAssessment)rubric=editingAssessment.rubric;
    else if(mode==='total')rubric=[{name:'总分',max:10,step:.5,description:'由教师根据本次任务评分。'}];
    else if(mode==='five'){
      const existing=state.classes.find(c=>c.year===2 && c.assessments.length)?.assessments[0].rubric;
      if(!existing)throw new Error('五项标准不可用，请自定义');
      rubric=JSON.parse(JSON.stringify(existing));
    }else rubric=Array.from(document.querySelectorAll('.rubric-row'),row=>({name:row.querySelector('[data-rubric-name]').value.trim(),max:Number(row.querySelector('[data-rubric-max]').value),step:.5,description:''}));
    const source={type:$('source-type').value,textbook_id:$('textbook-select').value,lesson_keys:Array.from($('lesson-select').querySelectorAll('input:checked'),o=>o.value),activity:$('activity-name').value.trim()};
    if(source.type==='textbook'&&!source.lesson_keys.length)throw new Error('请选择至少一课');
    if(source.type==='extra'&&!source.activity)throw new Error('请填写课外活动名称');
    busy=true;$('submit-assessment').disabled=true;
    const r=await api('/api/assessment',{class_id:classId,revision:state.revision,assessment_id:editingAssessment?.id,source,title:$('assessment-title').value,date:$('assessment-date').value,instructions:$('assessment-instructions').value,rubric});
    $('assessment-dialog').close();view='score';assessmentId=r.assessment_id;studentCode=null;dirty=false;await refresh();message(r.warning||(editingAssessment?'考试信息已保存。':'考试已建立。'),!!r.warning);
  }catch(err){$('form-error').textContent=err.message;}finally{busy=false;$('submit-assessment').disabled=false;render();}
});
$('close-history').addEventListener('click',()=>$('history-dialog').close());
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&view==='score'&&!$('assessment-dialog').open){e.preventDefault();save(true);}});
refresh().catch(e=>message('无法读取本机资料：'+e.message,true));

$('mobile-access').addEventListener('click', async () => {
  try {
    const result = await api('/api/mobile');
    $('mobile-link').textContent = result.url;
    $('mobile-link').href = result.url;
    $('mobile-dialog').showModal();
  } catch (error) { message(error.message, true); }
});
$('close-mobile').addEventListener('click', () => $('mobile-dialog').close());
