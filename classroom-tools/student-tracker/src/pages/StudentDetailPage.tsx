import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useTracker } from '../state/TrackerContext'
import type { FollowupKind } from '../types'

export function StudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { snapshot, addFollowup, busy } = useTracker()
  const student = snapshot.students.find((item) => item.id === studentId)
  const enrollment = snapshot.enrollments.find((item) => item.student_id === studentId && item.status === 'active')
  const course = snapshot.courses.find((item) => item.id === enrollment?.course_id)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<FollowupKind>('reobserve')
  const [dueOn, setDueOn] = useState('')

  if (!student || !course || !enrollment) return <Navigate to="/students" replace />

  const observations = snapshot.observations.filter((item) => item.student_id === student.id)
  const attendance = snapshot.attendance.filter((item) => item.student_id === student.id)
  const followups = snapshot.followups.filter((item) => item.student_id === student.id)
  const timeline = [
    ...observations.map((item) => ({ id: item.id, date: item.observed_at.slice(0, 10), type: 'observation' as const, record: item })),
    ...attendance.map((item) => ({ id: item.id, date: snapshot.sessions.find((session) => session.id === item.session_id)?.session_date ?? '', type: 'attendance' as const, record: item })),
    ...followups.map((item) => ({ id: item.id, date: item.due_on ?? '', type: 'followup' as const, record: item })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await addFollowup({ courseId: course.id, studentId: student.id, kind, title, dueOn: dueOn || undefined })
    setTitle('')
    setDueOn('')
    setShowForm(false)
  }

  return (
    <div className="page student-detail-page">
      <button className="back-link" onClick={() => navigate('/students')}>← 回到學生名單</button>
      <header className="student-profile">
        <span className="profile-avatar">{student.chinese_name.slice(-2)}</span>
        <div><p className="eyebrow">{course.code} · {enrollment.seat_number ?? '—'} 號</p><h1>{student.chinese_name}</h1><p>{student.original_name ?? student.student_code} · {student.student_code}</p></div>
        <button className="primary-button compact" onClick={() => setShowForm((value) => !value)}>新增待辦</button>
      </header>

      {showForm && <form className="inline-form panel" onSubmit={submit}>
        <label>類型<select value={kind} onChange={(event) => setKind(event.target.value as FollowupKind)}><option value="reobserve">再觀察</option><option value="remind">提醒</option><option value="makeup">補做</option></select></label>
        <label className="grow">要記得什麼<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：下次再看追問表現" /></label>
        <label>日期<input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} /></label>
        <button className="primary-button compact" disabled={busy}>儲存</button>
      </form>}

      <div className="student-stats">
        <div><strong>{observations.length}</strong><span>課堂觀察</span></div>
        <div><strong>{observations.filter((item) => item.result === 'independent').length}</strong><span>獨立完成</span></div>
        <div><strong>{attendance.filter((item) => item.status === 'late' || item.status === 'absent').length}</strong><span>出席例外</span></div>
        <div><strong>{followups.filter((item) => item.status === 'open').length}</strong><span>未完成待辦</span></div>
      </div>

      <section className="panel timeline-panel">
        <div className="panel-heading"><div><p className="section-kicker">最近在前</p><h2>教學歷程</h2></div></div>
        {timeline.length ? <div className="timeline">{timeline.map((item) => {
          if (item.type === 'observation') return <div className="timeline-item" key={item.id}><time>{item.date}</time><span className="timeline-line" /><div><StatusPill value={item.record.result} /><strong>{snapshot.sessions.find((session) => session.id === item.record.session_id)?.observation_target || '課堂任務觀察'}</strong>{item.record.note && <p>{item.record.note}</p>}</div></div>
          if (item.type === 'attendance') return <div className="timeline-item" key={item.id}><time>{item.date}</time><span className="timeline-line" /><div><StatusPill value={item.record.status} /><strong>出席紀錄</strong></div></div>
          return <div className="timeline-item" key={item.id}><time>{item.date || '未定'}</time><span className="timeline-line" /><div><StatusPill value={item.record.kind} /><strong>{item.record.title}</strong><p>{item.record.status === 'open' ? '尚未完成' : '已處理'}</p></div></div>
        })}</div> : <div className="quiet-empty">這名學生還沒有課堂紀錄。</div>}
      </section>
    </div>
  )
}
