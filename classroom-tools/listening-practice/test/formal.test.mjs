import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createApp} from '../server.mjs';
const tempRoot=path.resolve('qa');
const set={id:'test',version:'v1',lessonKey:'demo-textbook:lesson-01',title:'Synthetic fixture only',status:'demo',sourceStatus:'Synthetic, not classroom approved',audio:{label:'External test',url:''},questions:[{id:'one',prompt:'Choose A',grading:'automatic',points:2,options:['A','B'],answer:'A'},{id:'open',prompt:'Write',grading:'manual',points:3}]};
test('formal server authentication, isolation, versions, grading, retry, durability',async()=>{
 const dir=fs.mkdtempSync(path.join(tempRoot,'test-'));const origin='http://localhost:4173';const server=createApp({dataDir:dir,password:'synthetic-test-password',origin});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 async function call(route,body,cookie,headers={}){const r=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(cookie?{Cookie:cookie}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try{
 assert.equal((await call('teacher/dashboard')).status,401);assert.equal((await call('teacher/template')).status,401);
 assert.equal((await call('login',{password:'wrong'})).status,401);
 assert.equal((await call('login',{password:'synthetic-test-password'},null,{Origin:'https://evil.example'})).status,403);
 const teacher=(await call('login',{password:'synthetic-test-password'})).cookie;
 assert.equal((await call('teacher/sets',set,teacher)).status,201);
 assert.equal((await call('teacher/sets',set,teacher)).status,409);
 assert.equal((await call('teacher/sets',{...set,version:'invalid',questions:[{...set.questions[1],answer:'invented'}]},teacher)).status,400);
 const a=(await call('teacher/assignments',{setId:'test',version:'v1',classId:'class-a',title:'Fixture',roster:[{studentCode:'S01',pin:'private-001'},{studentCode:'S02',pin:'private-002'}]},teacher)).data;
 assert.equal((await call('join',{code:a.code,studentCode:'S01',pin:'private-002'})).status,401);
 const student=(await call('join',{code:a.code,studentCode:'S01',pin:'private-001'})).cookie;
 const student2=(await call('join',{code:a.code,studentCode:'S02',pin:'private-002'})).cookie;
 assert.equal((await call('teacher/dashboard',undefined,student)).status,403);assert.equal((await call('teacher/template',undefined,student)).status,403);
 const practice=(await call('student/practice',undefined,student)).data;
 assert.equal(JSON.stringify(practice).includes('"answer"'),false);
 assert.equal((await call('attempts',undefined,student)).status,404);
 assert.equal((await call('student/attempts',{submissionKey:'bad',answers:{one:'A'}},student)).status,400);
 assert.equal((await call('student/attempts',{submissionKey:'bad',answers:{one:'C',open:'test'}},student)).status,400);
 const body={submissionKey:'stable',answers:{one:'B',open:'My own answer'},studentCode:'S02',points:999};
 const concurrent=await Promise.all(Array.from({length:8},()=>call('student/attempts',body,student)));
 assert.equal(new Set(concurrent.map(r=>r.data.id)).size,1);assert.equal(concurrent.filter(r=>r.status===201).length,1);
 assert.equal((await call('student/attempts',{...body,answers:{one:'A',open:'Changed'}},student)).status,409);
 const id=concurrent[0].data.id;
 assert.equal((await call('teacher/sets',{...set,version:'v2',questions:[{...set.questions[0],answer:'B'},set.questions[1]]},teacher)).status,201);
 let dashboard=(await call('teacher/dashboard',undefined,teacher)).data;const report=dashboard.assignments[0];
 assert.equal(report.attempts.length,1);assert.equal(report.attempts[0].studentCode,'S01');assert.equal(report.attempts[0].version,'v1');assert.equal(report.attempts[0].responses[1].points,null);assert.equal(report.attempts[0].responses[0].points,0);assert.equal(report.errors[0].incorrect,1);assert.deepEqual(report.unsubmitted.map(r=>r.studentCode),['S02']);assert.equal(JSON.stringify(report).includes('pinHash'),false);
 const large=(await call('teacher/assignments',{setId:'test',version:'v1',classId:'large',title:'Shared proxy fixture',roster:Array.from({length:35},(_,i)=>({studentCode:'L'+i,pin:'personal-code-'+i}))},teacher)).data;
 const joins=await Promise.all(Array.from({length:35},(_,i)=>call('join',{code:large.code,studentCode:'L'+i,pin:'personal-code-'+i})));assert.ok(joins.every(r=>r.status===200),'35 legitimate students behind one proxy can join');
 assert.equal((await call('teacher/reviews',{attemptId:id,questionId:'one',points:2,feedback:''},teacher)).status,400);
 assert.equal((await call('teacher/reviews',{attemptId:id,questionId:'open',points:4,feedback:''},teacher)).status,400);
 for(const points of [1,2])assert.equal((await call('teacher/reviews',{attemptId:id,questionId:'open',points,feedback:'Reviewed'},teacher)).status,201);
 assert.equal((await call('student/results',undefined,student2)).data.length,0);
 const own=(await call('student/results',undefined,student)).data;assert.equal(own[0].reviews.length,2);assert.equal(JSON.stringify(own).includes('isCorrect'),false);
 assert.equal((await call('student/attempts',{submissionKey:'new-attempt',answers:{one:'A',open:'retry'}},student)).data.attemptNumber,2);
 assert.equal((await call('teacher/close',{assignmentId:a.id},teacher)).status,200);
 assert.equal((await call('student/attempts',body,student)).status,200); // Lost-response retry still works after closure.
 assert.equal((await call('student/attempts',{submissionKey:'after-close',answers:{one:'A',open:'no'}},student)).status,410);
 assert.equal((await call('student/practice',undefined,student)).status,410);
 assert.throws(()=>createApp({dataDir:dir,password:'synthetic-test-password',origin}),/EEXIST/);
 assert.ok(fs.readdirSync(dir).some(n=>n.includes('.backup-')));
 for(let i=0;i<21;i++){const r=await call('login',{password:'invalid'});if(i===20)assert.equal(r.status,429);}
 }finally{await new Promise(r=>server.close(r));}
 const restarted=createApp({dataDir:dir,password:'synthetic-test-password',origin});await new Promise(r=>restarted.listen(0,'127.0.0.1',r));assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'formal-state.json'))).attempts.length,2);await new Promise(r=>restarted.close(r));
});
test('startup fails closed for unsafe config and corrupt storage',()=>{
 assert.throws(()=>createApp({password:'short'}),/at least 12/);
 assert.throws(()=>createApp({password:'long-test-password',secure:true,origin:'http://example.com'}),/HTTPS/);
 const dir=fs.mkdtempSync(path.join(tempRoot,'corrupt-'));fs.writeFileSync(path.join(dir,'formal-state.json'),'broken');assert.throws(()=>createApp({dataDir:dir,password:'long-test-password'}));assert.equal(fs.readFileSync(path.join(dir,'formal-state.json'),'utf8'),'broken');
});
