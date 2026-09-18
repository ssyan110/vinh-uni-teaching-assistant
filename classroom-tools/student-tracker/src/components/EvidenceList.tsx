import {useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import type {Evidence} from '../utils/classroomAnalysis'
type CorrectionTarget = {recordType:'randomizer_attempt'|'learning_event';recordId:string}

export function EvidenceList({rows,onCorrect}:{rows:Evidence[];onCorrect?:(target:CorrectionTarget,reason:string)=>Promise<void>}) {
 const [target,setTarget]=useState<string|null>(null)
 const [reason,setReason]=useState('')
 const [error,setError]=useState('')
 const [saving,setSaving]=useState(false)
 const submit=async(e:FormEvent)=>{
  e.preventDefault()
  if(!target||!onCorrect)return
  const row=rows.find(item=>item.id===target)
  if(!row)return
  setError('');setSaving(true)
  try {
   const separator=row.id.indexOf(':')
   await onCorrect({recordType:row.kind==='attempt'?'randomizer_attempt':'learning_event',recordId:separator===-1?row.id:row.id.slice(separator+1)},reason.trim())
   setTarget(null);setReason('')
  } catch(caught) { setError(caught instanceof Error?caught.message:'修正失敗，請再試一次。') }
  finally { setSaving(false) }
 }
 return <div className="evidence-list">{rows.length?rows.map(r=><details key={r.id} className="evidence-row"><summary><time>{new Date(r.date).toLocaleString('zh-TW',{timeZone:'Asia/Ho_Chi_Minh'})}</time><>{r.studentId?<Link to={`/students/${r.studentId}?course=${encodeURIComponent(r.courseId)}`}>{r.studentName}</Link>:<span>{r.studentName}</span>}</><span>{r.source}</span><strong>回答紀錄</strong>{r.correction&&<span>已更正</span>}{!r.included&&<span>不納入統計</span>}</summary><p>{r.textbook} · {r.lesson} · {r.prompt||r.task||'未登記活動'}</p>{r.note&&<p>備註：{r.note}</p>}{r.correction&&<p>修正：{r.correction}</p>}{onCorrect&&r.included&&r.studentId&&<><button type="button" className="text-button" disabled={saving} onClick={()=>{setTarget(r.id);setReason('');setError('')}}>更正這筆回答</button>{target===r.id&&<form className="note-form" onSubmit={submit}><label className="wide">修正原因<input required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="例如：學生缺席，誤按記錄回答。" /></label><button type="submit" className="primary-button compact" disabled={saving}>{saving?'保存中…':'確認更正'}</button><button type="button" className="secondary-button compact" disabled={saving} onClick={()=>{setTarget(null);setReason('');setError('')}}>取消</button>{error&&<p role="alert">{error}</p>}</form>}</>}</details>):<p className="quiet-empty">這個範圍尚無回答紀錄。</p>}</div>
}
