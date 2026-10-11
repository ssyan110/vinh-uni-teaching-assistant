import './styles.css';
const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(route, body) {
  const r = await fetch(`/api/${route}`,{credentials:'same-origin',...(body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
  const data = await r.json(); if(!r.ok) throw Object.assign(new Error(data.error || '请求失败'),{status:r.status}); return data;
}
const field = (label,name,type='text',extra='') => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" required ${extra}></div>`;
function shell(content) {
  app.innerHTML=`<header class="topbar"><a class="brand" href="#"><strong>荣市大学 · 听力练习</strong></a><nav><a href="#student">学生入口</a> <a href="#teacher">教师入口</a> <a href="#results">我的反馈</a> <button id="logout" class="text-button">退出</button></nav></header><main class="page-shell">${content}<p id="notice" role="status" aria-live="polite"></p></main>`;
  app.querySelector('#logout').onclick=async()=>{await api('logout',{});location.hash='';await route();};
}
function message(error) { const n=app.querySelector('#notice'); if(n) n.textContent=error.message || error; }
function bindForm(id, handler) {
  app.querySelector(id).onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button[type="submit"]'); button.disabled=true;try{await handler(new FormData(e.currentTarget));}catch(error){message(error);}finally{button.disabled=false;}};
}
function teacherLogin() {
  shell(`<section class="start-page"><h1>教师登录</h1><p>登录后可发布练习、查看提交和批阅开放题。</p><form id="login" class="panel">${field('教师密码','password','password','autocomplete="current-password"')}<button class="primary" type="submit">登录</button></form></section>`);
  bindForm('#login',async f=>{await api('login',{password:f.get('password')});await teacher();});
}
async function teacher() {
  let data; try{data=await api('teacher/dashboard');}catch(error){if((await api('session')).role!=='teacher')return teacherLogin();throw error;}
  const options=data.sets.map(s=>`<option value="${esc(JSON.stringify([s.id,s.version]))}">${esc(s.title)} · ${esc(s.version)}${s.status==='demo'?' · 测试示例':''}</option>`).join('');
  shell(`<section class="teacher-header"><div><h1>教师工作台</h1><p>题组每次修改须使用新版本。已发布的练习和历史答案保留原版本。</p></div><button id="refresh" class="secondary">刷新记录</button></section>
    <section class="teacher-tools"><h2>导入题组</h2><p>上传 JSON。正式内容须已获批准，并填写 lessonKey、sourceStatus 和 approvalReference。示例仅用于测试流程。</p><input id="import" type="file" accept=".json,application/json" aria-label="导入题组 JSON"><button id="template" class="secondary">下载流程测试模板</button><p>已保存 ${data.sets.length} 个题组版本。</p></section>
    <section class="teacher-tools"><h2>发布班级练习</h2><form id="publish"><div class="field"><label for="set">题组版本</label><select name="set" id="set" required>${options}</select></div>${field('班级标识（发布后固定）','classId')}${field('练习名称','title')}${field('截止时间（可选）','expiresAt','datetime-local').replace(' required','')}<div class="field"><label for="roster">学生名单：每行“学生编号,个人进入码”；进入码至少 8 位。请分别私下交给各学生。</label><textarea id="roster" name="roster" required placeholder="DEMO01,personal-code-01"></textarea></div><button class="primary" type="submit" ${data.sets.length?'':'disabled'}>发布练习</button></form></section>
    ${data.assignments.map(a=>`<section class="teacher-panel panel"><h2>${esc(a.title)} · ${esc(a.classId)}</h2><p>${esc(a.setId)} / ${esc(a.version)} · ${a.closed?'已关闭':'可进入'}${a.expiresAt?' · 截止 '+esc(a.expiresAt):''}</p><label>学生入口<input readonly value="${esc(a.studentLink)}" aria-label="学生入口链接"></label><p>练习码：<code>${esc(a.code)}</code></p><button class="secondary" data-close="${esc(a.id)}" ${a.closed?'disabled':''}>关闭练习</button><button class="secondary" data-export="${esc(a.id)}">导出本次记录 CSV</button><h3>未提交学生（${a.unsubmitted.length}）</h3><p>${esc(a.unsubmitted.map(r=>r.studentCode).join('、')||'名单中的学生均已提交')}</p><h3>客观题错误统计</h3><p>按本练习全部尝试统计，重做也计入。</p>${a.errors.map(q=>`<p>${esc(q.prompt)}：${q.incorrect} 次错误 / ${q.submitted} 次提交</p>`).join('')||'<p>本题组没有客观题。</p>'}<h3>提交记录（${a.attempts.length} 次）</h3>${a.attempts.map(t=>renderAttempt(t,data.sets)).join('')||'<p>暂无提交。</p>'}</section>`).join('')}`);
  app.querySelector('#refresh').onclick=()=>teacher().catch(message);
  app.querySelector('#template').onclick=async()=>{try{const example=await api('teacher/template');download('listening-workflow-demo.json',JSON.stringify(example,null,2),'application/json');}catch(e){message(e);}};
  app.querySelector('#import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;await api('teacher/sets',JSON.parse(await f.text()));await teacher();message('已保存新的题组版本。');}catch(error){message(error);}};
  bindForm('#publish',async f=>{const [setId,version]=JSON.parse(f.get('set'));const roster=String(f.get('roster')).trim().split(/\r?\n/).map(line=>{const [studentCode,pin,...rest]=line.split(',');if(rest.length)throw new Error('名单每行只填写编号和进入码');return {studentCode:studentCode?.trim(),pin:pin?.trim()};});await api('teacher/assignments',{setId,version,classId:f.get('classId'),title:f.get('title'),roster,expiresAt:f.get('expiresAt')?new Date(f.get('expiresAt')).toISOString():null});await teacher();message('已发布。复制学生入口，并私下发送每位学生的个人进入码。');});
  app.querySelectorAll('[data-close]').forEach(b=>b.onclick=async()=>{try{await api('teacher/close',{assignmentId:b.dataset.close});await teacher();}catch(e){message(e);}});
  app.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{const a=data.assignments.find(a=>a.id===b.dataset.export);const rows=[['assignment','studentCode','attempt','submittedAt','questionId','answer','grading','points','feedback']];for(const t of a.attempts)for(const r of t.responses){const review=t.reviews.filter(x=>x.questionId===r.questionId).at(-1);rows.push([a.title,t.studentCode,t.attemptNumber,t.submittedAt,r.questionId,r.answer,r.grading,review?.points??r.points??'',review?.feedback??'']);}download('listening-attempts.csv','\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv');});
  app.querySelectorAll('.review-form').forEach(form=>bindForm('#'+form.id,async f=>{await api('teacher/reviews',{attemptId:f.get('attemptId'),questionId:f.get('questionId'),points:Number(f.get('points')),feedback:f.get('feedback')});await teacher();message('批阅已保存；之前的批阅记录仍保留。');}));
}
function renderAttempt(t,sets) {
  const set=sets.find(s=>s.id===t.setId&&s.version===t.version);
  const latest=new Map(t.reviews.map(r=>[r.questionId,r]));
  const pending=t.responses.filter(r=>r.grading==='manual'&&!latest.has(r.questionId)).length;
  const total=t.responses.reduce((sum,r)=>sum+(latest.get(r.questionId)?.points??r.points),0);
  return `<details class="answer-details"><summary>${esc(t.studentCode)} · 第 ${t.attemptNumber} 次 · ${esc(t.submittedAt)} · ${pending?"已评分部分 ":"总分 "}${total} 分${pending?' · '+pending+' 题待批阅':' · 已评分'}</summary>${t.responses.map((r,i)=>{const q=set.questions.find(q=>q.id===r.questionId);const review=latest.get(r.questionId);return `<article class="question"><h3>${i+1}. ${esc(q.prompt)}</h3><p>学生答案：${esc(r.answer)}</p>${r.grading==='automatic'?`<p>${r.isCorrect?'正确':'错误'} · ${r.points} / ${q.points} 分；正确选项：${esc(q.answer)}</p>`:`<p>${review?'最近批阅：'+review.points+' / '+q.points+' 分；'+esc(review.feedback):'等待人工批阅'}</p><form class="review-form" id="review-${t.id}-${i}"><input type="hidden" name="attemptId" value="${esc(t.id)}"><input type="hidden" name="questionId" value="${esc(q.id)}"><label>分数（0–${q.points}）<input name="points" type="number" min="0" max="${q.points}" step="0.5" required value="${review?.points??''}"></label><label>给学生的反馈<textarea name="feedback" maxlength="4000">${esc(review?.feedback||'')}</textarea></label><button type="submit" class="secondary">保存批阅</button></form><details><summary>批阅历史（${t.reviews.filter(x=>x.questionId===r.questionId).length}）</summary>${t.reviews.filter(x=>x.questionId===r.questionId).map(x=>`<p>${esc(x.reviewedAt)} · ${x.points} 分 · ${esc(x.feedback)}</p>`).join('')}</details>`}</article>`;}).join('')}</details>`;
}
function download(name,content,type) {const a=document.createElement('a');const url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function studentJoin() {
  const code=new URLSearchParams(location.hash.split('?')[1]||'').get('code')||'';
  shell(`<section class="start-page"><h1>进入听力练习</h1><p>打开教师发来的链接，填写自己的学生编号和个人进入码。进入码由教师私下提供。</p><form id="join" class="panel">${field('练习码','code','text',`value="${esc(code)}" autocomplete="off"`)}${field('学生编号','studentCode','text','autocomplete="username"')}${field('个人进入码','pin','password','autocomplete="current-password"')}<button type="submit" class="primary">进入练习</button></form></section>`);
  bindForm('#join',async f=>{await api('join',Object.fromEntries(f));await student();});
}
async function student() {
  let data;try{data=await api('student/practice');}catch(e){studentJoin();message(e);return;}
  const {set,assignment,studentCode}=data;
  const draftKey=`lp-draft:${assignment.id}:${studentCode}`; let draft;
  try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch{draft=null;}
  draft ||= {submissionKey:crypto.randomUUID(),answers:{}};
  shell(`<section class="quiz-header"><h1>${esc(assignment.title)}</h1><p>${esc(assignment.classId)} · ${esc(studentCode)}</p></section>${set.status==='demo'?'<p class="notice">流程测试示例，非已批准课堂教材。</p>':''}<section class="quiz-main panel"><p>先看题目、找关键词，再听音频并记重点，最后回答所有题目。</p><h2>${esc(set.audio.label)}</h2>${set.audio.url?`<audio controls preload="none" src="${esc(set.audio.url)}"></audio>`:'<p>音频由教师外部播放。</p>'}<form id="quiz">${set.questions.map((q,i)=>`<article class="question"><h2>${i+1}. ${esc(q.prompt)}</h2><p>${q.points} 分${q.grading==='manual'?' · 教师批阅':''}</p>${q.options?`<div class="choice-list">${q.options.map(o=>`<label><input type="radio" name="${esc(q.id)}" value="${esc(o)}" required ${draft.answers[q.id]===o?'checked':''}>${esc(o)}</label>`).join('')}</div>`:`<textarea name="${esc(q.id)}" maxlength="4000" required aria-label="问题 ${i+1} 的答案">${esc(draft.answers[q.id]||'')}</textarea>`}</article>`).join('')}<p>网络中断时保留本页，恢复连接后点击提交重试。</p><button type="submit" class="primary">提交练习</button></form></section>`);
  const quiz=app.querySelector('#quiz');quiz.oninput=()=>{draft.answers=Object.fromEntries(new FormData(quiz));try{sessionStorage.setItem(draftKey,JSON.stringify(draft));}catch{message('此浏览器无法暂存答案，请保留本页直到提交成功。');}};
  bindForm('#quiz',async f=>{draft.answers=Object.fromEntries(f);try{sessionStorage.setItem(draftKey,JSON.stringify(draft));}catch{} let r;try{r=await api('student/attempts',draft);}catch(error){if(error.status===409){await conflictRecovery(draftKey);return;}throw error;}sessionStorage.removeItem(draftKey);shell(`<section class="success-page"><h1>练习提交成功</h1><p>${esc(studentCode)}，第 ${r.attemptNumber} 次提交已保存到教师的共享服务器。</p><p>开放题由教师批阅。</p><button id="results" class="secondary">查看自己的评分与反馈</button><button id="again" class="primary">重新练习（新增一次提交）</button></section>`);app.querySelector('#again').onclick=()=>student().catch(message);app.querySelector('#results').onclick=()=>results().catch(message);});
}
async function conflictRecovery(draftKey) {
  const saved=await api('student/results');
  shell(`<section class="teacher-panel panel"><h1>这次提交已保存，当前答案与记录不同</h1><p>服务器已保存同一提交编号的答案。你后来修改了本页答案，重试不会覆盖原记录，也不会自动新增提交。</p><h2>已保存的提交</h2>${saved.map(t=>`<article class="question"><h3>第 ${t.attemptNumber} 次 · ${esc(t.submittedAt)}</h3>${t.responses.map((r,i)=>`<p>问题 ${i+1}：${esc(r.answer)}</p>`).join('')}</article>`).join('')}<p>查看评分与反馈可保留当前草稿。选择“开始新一次练习”会清空当前草稿，重新答题后新增一次提交。</p><button id="conflict-results" class="secondary">查看自己的评分与反馈</button> <button id="new-attempt" class="primary">开始新一次练习（清空草稿）</button></section>`);
  app.querySelector('#conflict-results').onclick=()=>results().catch(message);
  app.querySelector('#new-attempt').onclick=async()=>{sessionStorage.removeItem(draftKey);await student();};
}
async function results() {
  const records=await api('student/results');
  shell(`<section class="teacher-panel panel"><h1>我的提交和反馈</h1>${records.map(t=>`<article class="question"><h2>第 ${t.attemptNumber} 次提交</h2><p>${esc(t.submittedAt)}</p>${t.responses.map((r,i)=>{const review=t.reviews.filter(x=>x.questionId===r.questionId).at(-1);return `<p>问题 ${i+1}：${esc(r.answer)} · ${r.grading==='manual'&&!review?'等待教师批阅':(review?.points??r.points)+' 分'}${review?' · '+esc(review.feedback):''}</p>`;}).join('')}</article>`).join('')||'<p>暂无提交。</p>'}<button id="back" class="primary">返回练习</button></section>`);
  app.querySelector('#back').onclick=()=>student().catch(message);
}
async function route() {
  try{if(location.hash.startsWith('#results'))await results();else if(location.hash.startsWith('#teacher'))await teacher();else if(location.hash.startsWith('#student')){const s=await api('session');if(s.role==='student'&&!location.hash.includes('?code='))await student();else studentJoin();}else shell('<section class="start-page"><h1>听力练习</h1><p>学生请使用教师提供的练习链接和个人进入码。教师登录后可发布练习和查看记录。</p><a class="primary" href="#student">学生入口</a> <a class="secondary" href="#teacher">教师入口</a></section>');}catch(e){message(e);}
}
window.addEventListener('hashchange',route);route();
