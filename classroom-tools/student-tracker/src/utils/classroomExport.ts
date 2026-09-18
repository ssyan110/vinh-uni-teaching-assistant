import type { Evidence } from './classroomAnalysis'
import {noteLabels} from './classroomAnalysis'
import type {TrackerSnapshot} from '../types'
export function csvCell(value:unknown) {
 let text=String(value??'')
 if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text)) text="'"+text
 return `"${text.replaceAll('"','""')}"`
}
export function exportClassroomCsv(snapshot:TrackerSnapshot,rows:Evidence[],courseId:string,studentId?:string,from='',to='',filterLabel='全部課次') {
 const course=snapshot.courses.find(c=>c.id===courseId)
 const headers=['資料類型','班級','學號','姓名','日期','篩選範圍','來源／類別','教材','課次','題目識別','題目／活動','回答狀態','納入回答次數','事實／備註','修正原因','原始識別','修正前識別','建立時間']
 const identity=(id:string|null,name='')=>{const s=snapshot.students.find(s=>s.id===id);return [course?.code||courseId,s?.student_code||'',s?.chinese_name||name]}
 const output:unknown[][]=rows.map(r=>['回答紀錄',...identity(r.studentId,r.studentName),r.date,filterLabel,r.source,r.textbook,r.lesson,r.questionId||'未登記',r.prompt||r.task,r.correction?'已更正':r.status,r.included?'是':'否',r.note,r.correction,r.id,'',''])
 for(const enrollment of snapshot.enrollments.filter(e=>e.course_id===courseId&&(!studentId||e.student_id===studentId))) output.push(['學生名冊',...identity(enrollment.student_id),'','完整修課名冊；不按日期或題目縮減','','','','','',enrollment.status==='active'?'有效修課':enrollment.status==='withdrawn'?'已退選':enrollment.status,'',`座號：${enrollment.seat_number??'未登記'}`,enrollment.id,'','',''])
 const inDate=(d:string)=>(!from||d.slice(0,10)>=from)&&(!to||d.slice(0,10)<=to)
 for(const n of snapshot.studentNotes.filter(n=>n.course_id===courseId&&(!studentId||n.student_id===studentId)&&inDate(n.note_date))) output.push(['事實備註',...identity(n.student_id),n.note_date,'備註依日期篩選；不套用題目篩選',noteLabels[n.category],...Array.from({length:6},()=>''),n.body,n.correction_reason,n.id,n.supersedes_id,n.created_at])
 for(const f of snapshot.followups.filter(f=>f.course_id===courseId&&(!studentId||f.student_id===studentId)&&(!from&&!to||f.due_on&&inDate(f.due_on)))) output.push(['待辦',...identity(f.student_id,'全班'),f.due_on||'未定日期','待辦依到期日篩選；不套用題目篩選',({reobserve:'再觀察',remind:'提醒',makeup:'補做'})[f.kind],...Array.from({length:4},()=>''),({open:'待處理',completed:'已完成',cancelled:'已取消'})[f.status],'',f.title,'',f.id,'',''])
 return '\uFEFF'+[headers,...output].map(row=>Array.from({length:headers.length},(_,i)=>csvCell(row[i])).join(',')).join('\r\n')
}
export function downloadCsv(text:string,name:string) {
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
