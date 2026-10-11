import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { todayIso } from '../data/repository'
import type { AttendanceExceptionInput } from '../types'
import { filterAttendanceExceptions } from '../utils/attendanceExceptions'

const labels = { present: '到課', late: '遲到', absent: '缺席', excused: '請假' }
const blank = (sessionId = '', studentId = ''): AttendanceExceptionInput => ({ session_id: sessionId, student_id: studentId, observed_status: 'present', arrival_time: null, departure_time: null, reason: '', makeup_status: 'pending', makeup_date: null, official_status: 'unverified', verified_on: null })

export function AttendanceExceptions({ sessionId, studentId, courseId: fixedCourse }: { sessionId?: string; studentId?: string; courseId?: string }) {
  const { snapshot, busy, saveAttendanceException } = useTracker()
  const [courseId, setCourseId] = useState(fixedCourse ?? snapshot.sessions.find(s => s.id === sessionId)?.course_id ?? '')
  const [filter, setFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [draft, setDraft] = useState<AttendanceExceptionInput | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const selectedCourse = fixedCourse ?? courseId
  const sessions = snapshot.sessions.filter(s => s.course_id === selectedCourse && (!sessionId || s.id === sessionId)).sort((a, b) => b.session_date.localeCompare(a.session_date))
  const roster = snapshot.students.filter(s => snapshot.enrollments.some(e => e.course_id === selectedCourse && e.student_id === s.id))
  const records = filterAttendanceExceptions(snapshot, { courseId: selectedCourse, sessionId, studentId, from, to, status: filter })
  const change = <K extends keyof AttendanceExceptionInput>(key: K, value: AttendanceExceptionInput[K]) => setDraft(d => d ? { ...d, [key]: value } : d)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!draft) return
    setError(''); setMessage('')
    if (!editing && (snapshot.attendanceExceptions ?? []).some(r => r.session_id === draft.session_id && r.student_id === draft.student_id)) { setError('這個學生本堂已有補登紀錄，請取消後使用「編輯補登紀錄」。'); return }
    try { await saveAttendanceException(draft); setDraft(null); setMessage('補登紀錄已保存。') }
    catch (err) { setError(err instanceof Error ? err.message : '保存失敗。') }
  }
  return <section className="panel attendance-exceptions">
    <div className="panel-heading"><h2>點名例外／補登</h2><button type="button" className="primary-button compact" disabled={busy || !!draft || !sessions.length || snapshot.attendanceExceptionsAvailable === false} onClick={() => { setEditing(false); setDraft(blank(sessionId ?? sessions[0]?.id, studentId)); setMessage(''); setError('') }}>新增補登紀錄</button></div>
    <p>正式出席以另一位教師的 QR 點名系統為準。這裡只記需要補登或核對的學生；沒有紀錄不代表缺席，也不會自動同步。</p>
    {snapshot.attendanceExceptionsAvailable === false && <p role="status">補登資料表尚未啟用，請先套用資料庫 migration；既有資料仍可查看。</p>}
    <div className="filter-panel">
      {!fixedCourse && !sessionId && <label>班級<select value={courseId} onChange={e => { setCourseId(e.target.value); setDraft(null) }}><option value="">全部班級</option>{snapshot.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <label>補登篩選<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部</option><option value="pending">待補登</option><option value="completed">已補登</option><option value="unverified">官方尚未核對</option></select></label>
      <label>起始日期<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>結束日期<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
    </div>
    {!sessions.length && <p>請選擇班級，並先從班級頁建立上課場次。</p>}
    {draft && <form className="note-form attendance-exception-form" onSubmit={submit}>
      <label>上課日期／場次<select required disabled={!!sessionId || editing} value={draft.session_id} onChange={e => change('session_id', e.target.value)}><option value="">選擇場次</option>{sessions.map(s => <option key={s.id} value={s.id}>{s.session_date} · {s.session_number ? `第 ${s.session_number} 次` : s.starts_at ?? '課堂'} · {s.topic ?? s.status}</option>)}</select></label>
      <label>學生<select required disabled={!!studentId || editing} value={draft.student_id} onChange={e => change('student_id', e.target.value)}><option value="">選擇學生</option>{roster.map(s => <option key={s.id} value={s.id}>{s.chinese_name} · {s.student_code}</option>)}</select></label>
      <label>教師觀察狀態<select value={draft.observed_status} onChange={e => change('observed_status', e.target.value as AttendanceExceptionInput['observed_status'])}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>觀察到達時間（選填）<input type="time" value={draft.arrival_time?.slice(0, 5) ?? ''} onChange={e => change('arrival_time', e.target.value || null)} /></label>
      <label>觀察離開時間（選填）<input type="time" value={draft.departure_time?.slice(0, 5) ?? ''} onChange={e => change('departure_time', e.target.value || null)} /></label>
      <label className="wide">例外原因<textarea required maxLength={500} value={draft.reason} onChange={e => change('reason', e.target.value)} placeholder="例如：學生已到課，但 QR 掃描失敗。" /></label>
      <label>補登進度<select value={draft.makeup_status} onChange={e => setDraft(d => d ? { ...d, makeup_status: e.target.value as 'pending' | 'completed', makeup_date: e.target.value === 'completed' ? d.makeup_date ?? todayIso() : null, official_status: 'unverified', verified_on: null } : d)}><option value="pending">待補登</option><option value="completed">已手動補登</option></select></label>
      {draft.makeup_status === 'completed' && <label>補登日期<input type="date" required value={draft.makeup_date ?? ''} onChange={e => change('makeup_date', e.target.value)} /></label>}
      <label>官方系統核對<select disabled={draft.makeup_status !== 'completed'} value={draft.official_status} onChange={e => setDraft(d => d ? { ...d, official_status: e.target.value as 'unverified' | 'confirmed', verified_on: e.target.value === 'confirmed' ? todayIso() : null } : d)}><option value="unverified">尚未核對</option><option value="confirmed">已人工確認官方更新</option></select></label>
      {draft.official_status === 'confirmed' && <label>官方核對日期<input type="date" required value={draft.verified_on ?? ''} onChange={e => change('verified_on', e.target.value)} /></label>}
      <p className="wide">只有實際完成官方補登與核對後，才選擇「已人工確認官方更新」。</p>
      <button type="submit" className="primary-button" disabled={busy}>保存補登紀錄</button><button type="button" className="text-button" disabled={busy} onClick={() => setDraft(null)}>取消</button>
    </form>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p role="status">{records.length} 筆例外紀錄</p>
    {records.map(r => { const s = snapshot.sessions.find(s => s.id === r.session_id)!; const student = snapshot.students.find(s => s.id === r.student_id); return <article key={r.id} className="fact-note">
      <p><Link to={`/students/${r.student_id}?course=${s.course_id}`}>{student?.chinese_name ?? '學生'}</Link> · {snapshot.courses.find(c => c.id === s.course_id)?.name} · <Link to={`/sessions/${s.id}`}>{s.session_date}{s.session_number ? ` · 第 ${s.session_number} 次` : ''}</Link></p>
      <p>教師觀察：{labels[r.observed_status]} · 到達 {r.arrival_time?.slice(0, 5) ?? '未記錄'} · 離開 {r.departure_time?.slice(0, 5) ?? '未記錄'}</p><p>{r.reason}</p>
      <p>{r.makeup_status === 'pending' ? '待補登' : `已手動補登：${r.makeup_date}`} · {r.official_status === 'confirmed' ? `已人工確認官方更新：${r.verified_on}` : '官方尚未核對'}</p>
      <button type="button" className="text-button" disabled={busy || !!draft || snapshot.attendanceExceptionsAvailable === false} aria-label={`編輯 ${student?.chinese_name ?? '學生'} ${s.session_date} 補登紀錄`} onClick={() => { setEditing(true); setCourseId(s.course_id); setDraft({ ...r }); setMessage(''); setError('') }}>編輯補登紀錄</button>
    </article> })}
  </section>
}
