import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, createHash, timingSafeEqual, scrypt } from 'node:crypto';

import { promisify } from 'node:util';
const derive = promisify(scrypt);
async function pinDigest(pin, salt = randomBytes(16).toString('hex')) { return `${salt}:${(await derive(pin,salt,32)).toString('hex')}`; }
async function checkPin(pin,stored) { if(typeof stored !== 'string' || !stored.includes(':')) return false; return equal(await pinDigest(pin,stored.split(':')[0]),stored); }

const root = path.dirname(fileURLToPath(import.meta.url));
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const token = () => randomBytes(24).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
const clone = value => JSON.parse(JSON.stringify(value));
function noSymlinks(target) {
  let current = target;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) fail(500, 'Storage/static symlink is not allowed');
    current = path.dirname(current);
  }
}
function validateSet(s) {
  if (!s || !text(s.id, 80) || !text(s.version, 80) || !/^[a-z0-9-]+:lesson-\d{2}$/.test(s.lessonKey || '') || !text(s.title) || !text(s.sourceStatus, 2000) || !['demo', 'approved'].includes(s.status)) fail(400, '题组身份、版本或来源状态不完整');
  if (s.status === 'approved' && !text(s.approvalReference, 1000)) fail(400, '正式题组须填写批准证据位置');
  if (!s.audio || !text(s.audio.label) || (s.audio.url && !/^https:\/\//.test(s.audio.url))) fail(400, '音频须使用 HTTPS 地址，或留空由教师外部播放');
  if (!Array.isArray(s.questions) || !s.questions.length || s.questions.length > 100) fail(400, '题目数量须为 1 到 100');
  const ids = new Set();
  for (const q of s.questions) {
    if (!text(q.id, 80) || ids.has(q.id) || !text(q.prompt, 4000) || !Number.isInteger(q.points) || q.points < 1 || q.points > 100 || !['manual', 'automatic'].includes(q.grading)) fail(400, '题目字段无效');
    ids.add(q.id);
    if (q.grading === 'automatic' && (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 10 || !q.options.every(o => text(o, 1000)) || new Set(q.options).size !== q.options.length || !q.options.includes(q.answer))) fail(400, '自动评分仅支持有明确答案的选择题');
    if (q.grading === 'manual' && q.answer != null) fail(400, '开放题不接受标准答案');
  }
  // Store only the supported fields, never arbitrary imported client properties.
  return { id:s.id, version:s.version, lessonKey:s.lessonKey, title:s.title, sourceStatus:s.sourceStatus, status:s.status, approvalReference:s.approvalReference || null, audio:{label:s.audio.label,url:s.audio.url || ''}, questions:s.questions.map(q => ({id:q.id,prompt:q.prompt,points:q.points,grading:q.grading,...(q.grading === 'automatic' ? {options:q.options,answer:q.answer} : {})})) };
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''; let size = 0; let exceeded = false;
    req.on('data', chunk => { size += chunk.length; if (size > 1_000_000) { exceeded = true; return; } raw += chunk; });
    req.on('end', () => { if (exceeded) return reject(Object.assign(new Error('请求过大'),{status:413})); try { resolve(JSON.parse(raw || '{}')); } catch { reject(Object.assign(new Error('JSON 无效'),{status:400})); } });
    req.on('error', reject);
  });
}
export function createApp({ dataDir = process.env.DATA_DIR || path.join(root, 'data'), password = process.env.TEACHER_PASSWORD, origin = process.env.PUBLIC_ORIGIN || 'http://localhost:4173', secure = process.env.NODE_ENV === 'production', distDir = path.join(root, 'dist') } = {}) {
  if (!password || password.length < 12) throw new Error('Set TEACHER_PASSWORD with at least 12 characters');
  const publicURL = new URL(origin);
  if (publicURL.origin !== origin || (secure && publicURL.protocol !== 'https:')) throw new Error('PUBLIC_ORIGIN must be an exact origin; production requires HTTPS');
  dataDir = path.resolve(dataDir);
  if (dataDir === path.parse(dataDir).root || dataDir === process.env.HOME) throw new Error('Unsafe DATA_DIR');
  noSymlinks(dataDir); noSymlinks(distDir);
  fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
  const lockPath = path.join(dataDir,'formal.lock');
  const lock = fs.openSync(lockPath,'wx',0o600); fs.writeFileSync(lock, String(process.pid));
  const file = path.join(dataDir,'formal-state.json');
  let state;
  try { noSymlinks(file); state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {schema:1,sets:[],assignments:[],attempts:[],reviews:[]}; if (state.schema !== 1 || !['sets','assignments','attempts','reviews'].every(k => Array.isArray(state[k]))) throw new Error('Invalid state schema'); }
  catch (e) { fs.closeSync(lock); fs.unlinkSync(lockPath); throw e; }
  const sessions = new Map(); const limits = new Map(); let queue = Promise.resolve();
  function persist(next) {
    const tmp = path.join(dataDir,`state-${randomUUID()}.tmp`);
    if (fs.existsSync(file)) { const backup = `${file}.backup-${Date.now()}-${randomUUID()}`; fs.copyFileSync(file,backup,fs.constants.COPYFILE_EXCL); fs.chmodSync(backup,0o600); }
    const fd = fs.openSync(tmp,'wx',0o600);
    try { fs.writeFileSync(fd,JSON.stringify(next)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp,file);
    const dirfd = fs.openSync(dataDir,'r'); try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
    state = next;
  }
  function mutate(fn) { const result = queue.then(() => {const next = clone(state); const value = fn(next); persist(next); return value;}); queue = result.catch(()=>{}); return result; }
  const send = (res,status,value) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
  const session = req => { const key = (req.headers.cookie || '').match(/(?:^|; )lp_session=([A-Za-z0-9_-]+)/)?.[1]; const s = sessions.get(key); if (!s || s.until < Date.now()) { sessions.delete(key); return null; } return s; };
  function login(res, identity) { const key = token(); if (sessions.size >= 10000) for (const [k,s] of sessions) if (s.until < Date.now()) sessions.delete(k); if(sessions.size >= 10000) fail(503,'登录人数已达上限，请联系教师'); sessions.set(key,{...identity,until:Date.now()+8*3600_000}); res.setHeader('Set-Cookie',`lp_session=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure ? '; Secure' : ''}`); }
  function throttle(req, identity = 'login', cap = 20) { const key = `${req.socket.remoteAddress}:${identity}`; const now = Date.now(); let l = limits.get(key); if (!l || now > l.until) { l = {count:0,until:now+60000}; limits.set(key,l); } if (++l.count > cap) fail(429,'尝试次数过多，请稍后再试'); if (limits.size > 10000) for (const [k,v] of limits) if (v.until < now) limits.delete(k); }
  const active = a => a && !a.closed && (!a.expiresAt || Date.parse(a.expiresAt) > Date.now());
  function publicSet(s) { return {...s,approvalReference:undefined,questions:s.questions.map(({answer,...q})=>q)}; }
  function report(a) {
    const attempts = state.attempts.filter(t=>t.assignmentId===a.id);
    const set = state.sets.find(s=>s.id===a.setId&&s.version===a.version);
    return { ...a, studentLink:`${origin}/#student?code=${encodeURIComponent(a.code)}`, attempts:attempts.map(t=>({...t,reviews:state.reviews.filter(r=>r.attemptId===t.id)})), unsubmitted:a.roster.filter(r=>!attempts.some(t=>t.studentCode===r.studentCode)).map(({pinHash,...r})=>r), errors:set.questions.filter(q=>q.grading==='automatic').map(q=>({questionId:q.id,prompt:q.prompt,submitted:attempts.length,incorrect:attempts.filter(t=>t.responses.find(r=>r.questionId===q.id)?.isCorrect===false).length})), roster:a.roster.map(({pinHash,...r})=>r) };
  }
  const server = http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' https:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (secure) res.setHeader('Strict-Transport-Security','max-age=31536000');
    try {
      const url = new URL(req.url,origin); const route = url.pathname;
      if (route.startsWith('/api/')) {
        if (!['GET','POST'].includes(req.method)) fail(405,'请求方法不支持');
        if (req.method==='POST' && req.headers.origin!==origin) fail(403,'请求来源不允许');
        if (req.method==='POST' && !(req.headers['content-type'] || '').startsWith('application/json')) fail(415,'请使用 JSON');
        const s = session(req);
        if (route==='/api/health'&&req.method==='GET') return send(res,200,{ok:true,mode:'self-hosted'});
        if (route==='/api/login'&&req.method==='POST') { throttle(req); const b=await readBody(req); if (!text(b.password,1000)||!equal(b.password,password)) fail(401,'密码不正确'); login(res,{role:'teacher'}); return send(res,200,{role:'teacher'}); }
        if (route==='/api/join'&&req.method==='POST') {
          const b=await readBody(req); throttle(req,'join-global',1000);
          if(!text(b.code,100)||!text(b.studentCode,80)) fail(400,'进入字段无效');
          throttle(req,`join:${hash(b.code+':'+b.studentCode)}`); const a=state.assignments.find(a=>a.code===b.code); const r=a?.roster.find(r=>r.studentCode===b.studentCode);
          if (!active(a)||!r||!text(b.pin,200)||!(await checkPin(b.pin,r.pinHash))) fail(401,'练习码、学生编号或个人进入码不正确，或练习已关闭');
          login(res,{role:'student',assignmentId:a.id,studentCode:r.studentCode}); return send(res,200,{role:'student'});
        }
        if (route==='/api/session'&&req.method==='GET') return send(res,200,s ? {role:s.role,studentCode:s.studentCode} : {role:null});
        if (route==='/api/logout'&&req.method==='POST') { const key=(req.headers.cookie||'').match(/lp_session=([A-Za-z0-9_-]+)/)?.[1]; sessions.delete(key); res.setHeader('Set-Cookie','lp_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(res,200,{ok:true}); }
        if (!s) fail(401,'请先登录');
        if (route.startsWith('/api/teacher/')) {
          if (s.role!=='teacher') fail(403,'仅教师可访问');
          if (route==='/api/teacher/template'&&req.method==='GET') return send(res,200,{id:'workflow-demo',version:'demo-v1',lessonKey:'demo-textbook:lesson-01',title:'流程测试示例（非课堂教材）',status:'demo',sourceStatus:'合成测试内容，未经课堂批准。',audio:{label:'测试音频（请教师外部播放）',url:''},questions:[{id:'q1',prompt:'流程测试：请选择测试选项 A。',points:2,grading:'automatic',options:['测试选项 A','测试选项 B'],answer:'测试选项 A'},{id:'q2',prompt:'流程测试：写一句话检查开放题提交。',points:3,grading:'manual'}]});
          if (route==='/api/teacher/dashboard'&&req.method==='GET') return send(res,200,{sets:state.sets,assignments:state.assignments.map(report)});
          if (route==='/api/teacher/sets'&&req.method==='POST') { const b=await readBody(req); const set=validateSet(b); return send(res,201,await mutate(next=>{ if(next.sets.some(x=>x.id===set.id&&x.version===set.version)) fail(409,'版本已存在，请使用新的版本号'); next.sets.push(set); return set; })); }
          if (route==='/api/teacher/assignments'&&req.method==='POST') {
            const b=await readBody(req); if (!text(b.classId,100)||!text(b.title)||!Array.isArray(b.roster)||!b.roster.length||b.roster.length>500||!b.roster.every(r=>text(r.studentCode,80)&&text(r.pin,200)&&r.pin.length>=8)||new Set(b.roster.map(r=>r.studentCode)).size!==b.roster.length) fail(400,'班级、标题及学生名单无效；个人进入码至少 8 位且编号不能重复');
            if(b.expiresAt && (!Number.isFinite(Date.parse(b.expiresAt))||Date.parse(b.expiresAt)<=Date.now())) fail(400,'截止时间须在未来');
            const roster=await Promise.all(b.roster.map(async r=>({studentCode:r.studentCode,pinHash:await pinDigest(r.pin)})));
            const a=await mutate(next=>{if(!next.sets.some(s=>s.id===b.setId&&s.version===b.version)) fail(400,'题组版本不存在'); const a={id:randomUUID(),title:b.title,classId:b.classId,setId:b.setId,version:b.version,code:token(),expiresAt:b.expiresAt||null,closed:false,roster}; next.assignments.push(a); return a;}); return send(res,201,report(a));
          }
          if (route==='/api/teacher/close'&&req.method==='POST') { const b=await readBody(req); return send(res,200,await mutate(next=>{const a=next.assignments.find(a=>a.id===b.assignmentId); if(!a) fail(404,'练习不存在'); a.closed=true; return {ok:true};})); }
          if (route==='/api/teacher/reviews'&&req.method==='POST') {
            const b=await readBody(req); return send(res,201,await mutate(next=>{const t=next.attempts.find(t=>t.id===b.attemptId); const set=t&&next.sets.find(s=>s.id===t.setId&&s.version===t.version); const q=set?.questions.find(q=>q.id===b.questionId); if(!q||q.grading!=='manual'||typeof b.points!=='number'||!Number.isFinite(b.points)||b.points<0||b.points>q.points||typeof b.feedback!=='string'||b.feedback.length>4000) fail(400,'批阅对象或分数无效'); const r={id:randomUUID(),attemptId:t.id,questionId:q.id,points:b.points,feedback:b.feedback,reviewedAt:new Date().toISOString()}; next.reviews.push(r); return r;}));
          }
        }
        if (route==='/api/student/practice'&&req.method==='GET') {
          if(s.role!=='student') fail(403,'请使用学生入口'); const a=state.assignments.find(a=>a.id===s.assignmentId); if(!active(a)) fail(410,'练习已关闭'); const set=state.sets.find(x=>x.id===a.setId&&x.version===a.version); return send(res,200,{assignment:{id:a.id,title:a.title,classId:a.classId},set:publicSet(set),studentCode:s.studentCode});
        }
        if (route==='/api/student/results'&&req.method==='GET') {
          if(s.role!=='student') fail(403,'请使用学生入口');
          return send(res,200,state.attempts.filter(t=>t.assignmentId===s.assignmentId&&t.studentCode===s.studentCode).map(t=>({id:t.id,attemptNumber:t.attemptNumber,submittedAt:t.submittedAt,responses:t.responses.map(r=>({questionId:r.questionId,answer:r.answer,grading:r.grading,points:r.points})),reviews:state.reviews.filter(r=>r.attemptId===t.id)})));
        }
        if (route==='/api/student/attempts'&&req.method==='POST') {
          if(s.role!=='student') fail(403,'请使用学生入口'); const b=await readBody(req); if(!text(b.submissionKey,100)||!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers)) fail(400,'提交字段无效');
          const result=await mutate(next=>{ const fingerprint=hash(JSON.stringify(Object.entries(b.answers).sort())); const duplicate=next.attempts.find(t=>t.assignmentId===s.assignmentId&&t.studentCode===s.studentCode&&t.submissionKey===b.submissionKey); if(duplicate){if(duplicate.fingerprint!==fingerprint) fail(409,'重试编号已用于另一份答案'); return {id:duplicate.id,attemptNumber:duplicate.attemptNumber,duplicate:true};}
            const a=next.assignments.find(a=>a.id===s.assignmentId); if(!active(a)) fail(410,'练习已关闭'); const set=next.sets.find(x=>x.id===a.setId&&x.version===a.version);
            if(Object.keys(b.answers).length!==set.questions.length||set.questions.some(q=>!text(b.answers[q.id],4000)||(q.grading==='automatic'&&!q.options.includes(b.answers[q.id])))) fail(400,'请完成所有题目，并使用有效的选项');
            const t={id:randomUUID(),assignmentId:a.id,classId:a.classId,studentCode:s.studentCode,setId:set.id,version:set.version,lessonKey:set.lessonKey,submittedAt:new Date().toISOString(),submissionKey:b.submissionKey,fingerprint,attemptNumber:next.attempts.filter(t=>t.assignmentId===a.id&&t.studentCode===s.studentCode).length+1,responses:set.questions.map(q=>({questionId:q.id,answer:b.answers[q.id],grading:q.grading,isCorrect:q.grading==='automatic'?b.answers[q.id]===q.answer:null,points:q.grading==='manual'?null:(b.answers[q.id]===q.answer?q.points:0)}))}; next.attempts.push(t); return {id:t.id,attemptNumber:t.attemptNumber,duplicate:false}; }); return send(res,result.duplicate?200:201,result);
        }
        fail(404,'接口不存在');
      }
      if(!['GET','HEAD'].includes(req.method)) fail(405,'请求方法不支持');
      const pathname = decodeURIComponent(url.pathname);
      let target=path.resolve(distDir,`.${pathname==='/'?'/index.html':pathname}`);
      if(!target.startsWith(path.resolve(distDir)+path.sep)) fail(403,'路径不允许'); noSymlinks(target);
      if(!fs.existsSync(target)||!fs.statSync(target).isFile()) fail(404,'文件不存在；请先运行 npm run build');
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(req.method==='HEAD'?undefined:fs.readFileSync(target));
    } catch(e) { send(res,e.status||500,{error:e.status?e.message:'服务器保存失败，请联系教师；请保留答案并重试'}); }
  });
  server.on('close',()=>{fs.closeSync(lock);fs.unlinkSync(lockPath);});
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=createApp(); server.listen(Number(process.env.PORT||4173),process.env.HOST||'127.0.0.1',()=>console.log('Listening practice server started (self-hosted; no cloud configured).'));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
