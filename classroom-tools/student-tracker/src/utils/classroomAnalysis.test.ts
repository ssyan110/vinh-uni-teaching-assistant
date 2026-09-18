import {test,expect,vi} from 'vitest'
import {emptySnapshot,type LearningEvent,type RandomizerAttempt} from '../types'
import {equalStudentMean,evidenceRows,isEvaluated,currentNotes,factDistribution} from './classroomAnalysis'
import {csvCell,exportClassroomCsv} from './classroomExport'
import {DemoRepository} from '../data/repository'
const score=(id:string,value:number):LearningEvent=>({id,owner_id:'o',student_id:id,course_id:'c',session_id:'s',occurred_at:'2026-09-08T00:00:00Z',source:'random_call',lesson_label:'L1',activity_label:'test',task_completion:value,comprehensibility:null,language_control:null,interaction:null,needs_review:false})
test('student weighting prevents frequent speakers dominating and preserves real zero',()=>{
 const rows=evidenceRows({...emptySnapshot,learningEvents:[score('a',3),score('a',3),score('b',0)]})
 expect(equalStudentMean(rows,0)).toEqual({value:1.5,students:2,events:3})
 expect(equalStudentMean(rows,1).value).toBeNull()
 expect(isEvaluated({...rows[0],included:false})).toBe(false)
})
test('full attempts include unscored participation and deduplicate mirrored numeric events',()=>{
 const attempt={id:'a',client_attempt_id:'same',course_id:'c',student_id:'a',student_name:'甲',outcome:'not_answered',assessment_status:'not_applicable',record_status:'valid',drawn_at:'2026-09-08',performance_level:null,task_completion:null,comprehensibility:null,language_control_vocabulary:null,content_interaction:null,total_score:null} as RandomizerAttempt
 const rows=evidenceRows({...emptySnapshot,attempts:[attempt],learningEvents:[{...score('a',3),client_event_id:'same'}]})
 expect(rows).toHaveLength(1);expect(rows[0].status).toBe('未回答');expect(isEvaluated(rows[0])).toBe(false)
})
test('facts persist as correction history, reject cross-class changes and keep CSV safe',async()=>{
 const values=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(k:string)=>values.get(k),setItem:(k:string,v:string)=>values.set(k,v)})
 const repo=new DemoRepository();const s=await repo.load();const enrollment=s.enrollments[0]
 const input={course_id:enrollment.course_id,student_id:enrollment.student_id,note_date:'2026-09-08',category:'other' as const,body:'=HYPERLINK("bad")',supersedes_id:null,correction_reason:null}
 await repo.addNote(input);let snapshot=await new DemoRepository().load();const first=snapshot.studentNotes[0]
 await repo.addNote({...input,body:'已確認補交',supersedes_id:first.id,correction_reason:'原備註日期有誤'})
 snapshot=await new DemoRepository().load();expect(snapshot.studentNotes).toHaveLength(2);expect(currentNotes(snapshot.studentNotes)).toHaveLength(1)
 await expect(repo.addNote({...input,student_id:s.enrollments.find(e=>e.course_id!==enrollment.course_id)!.student_id})).rejects.toThrow()
 await expect(repo.addNote({...input,supersedes_id:first.id,correction_reason:'再次修改舊版'})).rejects.toThrow()
 expect(csvCell(' =SUM(1,2)')).toContain("' =SUM")
 const csv=exportClassroomCsv(snapshot,[],input.course_id,input.student_id)
 expect(csv.startsWith('\uFEFF')).toBe(true);expect(csv).toContain("'=HYPERLINK")
 expect(csv).toContain('已確認補交')
})

test('FACT denominators preserve zero and separate NA, insufficient, missing and voided evidence',()=>{
 const base=evidenceRows({...emptySnapshot,learningEvents:[score('a',0)]})[0]
 const rows=[{...base,factVersion:'1.0',fact:{F:0 as const}},{...base,studentId:'b',factVersion:'1.0',fact:{F:4 as const}},{...base,factVersion:'1.0',fact:{F:'na' as const}},{...base,factVersion:'1.0',fact:{F:'insufficient' as const}},{...base,factVersion:'1.0',fact:{}},{...base,included:false,factVersion:'1.0',fact:{F:2 as const}}]
 expect(factDistribution(rows,'F')).toEqual({counts:[1,0,0,0,1],valid:2,students:2,na:1,insufficient:1,pending:1})
 expect(isEvaluated({...base,dimensions:[null,null,null,null],fact:{F:0}})).toBe(true)
 expect(isEvaluated({...base,dimensions:[null,null,null,null],fact:{F:'insufficient'}})).toBe(false)
})
test('CSV keeps response records and notes without exporting assessment fields or class leaks',()=>{
 const note={id:'note1',owner_id:'o',course_id:'c',student_id:'s',note_date:'2026-09-08',category:'other' as const,body:'fact body',correction_reason:'correction',supersedes_id:'old',created_at:'stamp'}
 const snapshot={...emptySnapshot,studentNotes:[note,{...note,id:'other',course_id:'other',body:'DO NOT EXPORT'}]}
 const base=evidenceRows({...emptySnapshot,learningEvents:[score('s',0)]})[0]
 const csv=exportClassroomCsv(snapshot,[{...base,factVersion:'1.0',fact:{F:0,A:'na',C:'insufficient'},assistance:false}], 'c')
 // These fixtures have no embedded commas/quotes; browser download QA also parses with Python csv.
 const cells=csv.slice(1).split('\r\n').map(line=>line.split(',').map(s=>s.slice(1,-1)))
 const at=(row:number,key:string)=>cells[row][cells[0].indexOf(key)]
 expect(at(1,'回答狀態')).toBe(base.status);expect(at(1,'納入回答次數')).toBe('是')
 expect(at(2,'事實／備註')).toBe('fact body');expect(at(2,'修正原因')).toBe('correction');expect(at(2,'原始識別')).toBe('note1');expect(at(2,'修正前識別')).toBe('old');expect(at(2,'建立時間')).toBe('stamp')
 expect(cells[0]).not.toContain('FACT 版本')
 expect(csv).not.toContain('DO NOT EXPORT')
})
