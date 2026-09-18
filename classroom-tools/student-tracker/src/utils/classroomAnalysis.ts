import type { TrackerSnapshot, PerformanceLevel, StudentNote, FactMarks, FactMark } from '../types'
export const levelLabels = { needs_support:'需要協助', mostly_complete:'大致完成', complete:'完成本題' }
export const noteLabels = {homework_missing:'未交作業',textbook_missing:'未帶課本',classroom_rule:'課堂規則事件',other:'其他事實'}
export interface Evidence {
 fact:FactMarks|null; factVersion:string|null; assistance:boolean|null
 id:string; courseId:string; studentId:string|null; studentName:string; date:string; source:string
 textbook:string; lesson:string; task:string; questionId:string|null; prompt:string; rubric:string
 status:string; level:PerformanceLevel|null; dimensions:(number|null)[]; total:number|null
 note:string; correction:string; included:boolean; kind:'attempt'|'legacy'
}
export function evidenceRows(snapshot:TrackerSnapshot):Evidence[] {
 const attemptIds=new Set(snapshot.attempts.map(a=>a.client_attempt_id))
 const attempts:Evidence[]=snapshot.attempts.map(a=>({fact:a.fact_marks??null,factVersion:a.fact_version??null,assistance:a.assistance??null,id:`attempt:${a.id}`,courseId:a.course_id,studentId:a.student_id,studentName:a.student_name,date:a.completed_at||a.drawn_at,source:a.selection_method==='volunteer'?'自願發言':'隨機抽問',textbook:a.textbook_id,lesson:a.lesson_id,task:a.task_target,questionId:a.question_id,prompt:a.task_prompt||'',rubric:a.fact_version?`FACT ${a.fact_version}`:a.assessment_status==='observed'?`描述 ${a.observation_version||'未登記'}`:`歷史評分 ${a.rubric_id}/${a.rubric_version}`,status:a.record_status==='voided'||a.outcome==='undone'?'已撤銷':a.outcome==='not_answered'?'未回答':a.outcome==='pending'?'尚未完成回答':a.assessment_status==='pending'?'已回答，待觀察':a.assessment_status==='observed'?'已觀察':'歷史評分',level:a.performance_level,dimensions:[a.task_completion,a.comprehensibility,a.language_control_vocabulary,a.content_interaction],total:a.total_score,note:a.note||'',correction:a.correction_note||'',included:a.record_status!=='voided'&&a.outcome==='answered'&&a.counted_for_summary!==false,kind:'attempt'}))
 const legacy:Evidence[]=snapshot.learningEvents.filter(e=>!e.client_event_id||!attemptIds.has(e.client_event_id)).map(e=>({fact:null,factVersion:null,assistance:null,id:`legacy:${e.id}`,courseId:e.course_id,studentId:e.student_id,studentName:snapshot.students.find(s=>s.id===e.student_id)?.chinese_name||'未連結學生',date:e.occurred_at,source:e.source==='voluntary_answer'?'自願發言':e.source==='random_call'?'隨機抽問':'課堂觀察',textbook:e.textbook_id||'未登記教材',lesson:e.lesson_id||e.lesson_label,task:e.activity_label,questionId:null,prompt:'',rubric:`歷史評分 ${e.rubric_version||'版本未登記'}`,status:e.record_status==='voided'?'已撤銷':'歷史評分',level:null,dimensions:[e.task_completion,e.comprehensibility,e.language_control,e.interaction],total:e.score??null,note:e.teacher_note||'',correction:e.correction_note||'',included:e.record_status!=='voided'&&e.counted_for_summary!==false&&!['no_response','unobserved','declined'].includes(e.response_status||''),kind:'legacy'}))
 return [...attempts,...legacy].sort((a,b)=>b.date.localeCompare(a.date))
}
export const isEvaluated=(e:Evidence)=>e.included&&(e.level!==null||Object.values(e.fact||{}).some(v=>typeof v==='number')||e.dimensions.some(v=>v!==null))
export function equalStudentMean(rows:Evidence[],dimension:number) {
 const grouped=new Map<string,number[]>()
 for(const r of rows) {
  const value=r.dimensions[dimension]
  if(!r.studentId||!isEvaluated(r)||value===null||!Number.isFinite(value)) continue
  grouped.set(r.studentId,[...(grouped.get(r.studentId)||[]),value])
 }
 const means=[...grouped.values()].map(v=>v.reduce((a,b)=>a+b,0)/v.length)
 return {value:means.length?means.reduce((a,b)=>a+b,0)/means.length:null,students:means.length,events:[...grouped.values()].reduce((sum,v)=>sum+v.length,0)}
}
export function currentNotes(notes:StudentNote[]) {
 const superseded=new Set(notes.map(n=>n.supersedes_id).filter(Boolean))
 return notes.filter(n=>!superseded.has(n.id)).sort((a,b)=>b.note_date.localeCompare(a.note_date))
}
export const lessonKey=(r:Evidence)=>`${r.textbook}:${r.lesson}`

export function eventDay(value:string) {
 if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
}

export const factLabels = {F:'功能與任務',A:'準確度與可理解度',C:'情境與內容',T:'表達形式與連貫性'} as const
export const factValueLabel=(value:FactMark|undefined)=>value===undefined?'未觀察':value==='na'?'本題不適用':value==='insufficient'?'證據不足':String(value)
export function factDistribution(rows:Evidence[],dimension:keyof FactMarks) {
 const eligible=rows.filter(r=>r.included&&r.factVersion)
 const valid=eligible.filter(r=>typeof r.fact?.[dimension]==='number')
 return {counts:[0,1,2,3,4].map(n=>valid.filter(r=>r.fact?.[dimension]===n).length),valid:valid.length,students:new Set(valid.map(r=>r.studentId).filter(Boolean)).size,na:eligible.filter(r=>r.fact?.[dimension]==='na').length,insufficient:eligible.filter(r=>r.fact?.[dimension]==='insufficient').length,pending:eligible.filter(r=>r.fact?.[dimension]===undefined).length}
}
