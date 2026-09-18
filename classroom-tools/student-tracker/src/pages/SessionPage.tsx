import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useTracker } from '../state/TrackerContext'
import { validateSessionEdit } from '../data/repository'
import type { AttendanceStatus } from '../types'

type SessionMode = 'attendance' | 'close'

const attendanceActions: { value: AttendanceStatus; label: string }[] = [
  { value: 'late', label: '遲到' }, { value: 'absent', label: '缺席' }, { value: 'excused', label: '請假' }, { value: 'present', label: '到課' },
]

function readReflectionDraft(sessionId: string | undefined, fallback: { classStatus: string; progressText: string; whatWorked: string; commonDifficulty: string; nextAdjustment: string }) {
  if (!sessionId) return fallback
  try {
    const saved = sessionStorage.getItem(`keji-session-reflection-${sessionId}`)
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback
  } catch {
    return fallback
  }
}

export function SessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { snapshot, busy, saveAttendance, confirmRemainingPresent, closeSession, updateSession } = useTracker()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<SessionMode>(params.get('view')==='reflection'?'close':'attendance')
  const [privacy, setPrivacy] = useState(true)
  const session = snapshot.sessions.find((item) => item.id === sessionId)
  const course = snapshot.courses.find((item) => item.id === session?.course_id)
  const initialReflection = readReflectionDraft(sessionId, {
    classStatus: session?.class_status ?? '',
    progressText: session?.progress_text ?? '',
    whatWorked: session?.what_worked ?? '',
    commonDifficulty: session?.common_difficulty ?? '',
    nextAdjustment: session?.next_adjustment ?? '',
  })
  const [classStatus, setClassStatus] = useState(initialReflection.classStatus)
  const [progressText, setProgressText] = useState(initialReflection.progressText)
  const [whatWorked, setWhatWorked] = useState(initialReflection.whatWorked)
  const [commonDifficulty, setCommonDifficulty] = useState(initialReflection.commonDifficulty)
  const [nextAdjustment, setNextAdjustment] = useState(initialReflection.nextAdjustment)
  const [editingSession, setEditingSession] = useState(false)
  const [sessionDate, setSessionDate] = useState('')
  const [sessionNumber, setSessionNumber] = useState('')
  const [sessionEditReason, setSessionEditReason] = useState('')
  const [sessionEditError, setSessionEditError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    sessionStorage.setItem(`keji-session-reflection-${sessionId}`, JSON.stringify({ classStatus, progressText, whatWorked, commonDifficulty, nextAdjustment }))
  }, [sessionId, classStatus, progressText, whatWorked, commonDifficulty, nextAdjustment])

  const roster = useMemo(() => {
    if (!course) return []
    return snapshot.enrollments.filter((item) => item.course_id === course.id && item.status === 'active')
      .sort((a, b) => (a.seat_number ?? 999) - (b.seat_number ?? 999))
      .map((enrollment) => ({ enrollment, student: snapshot.students.find((item) => item.id === enrollment.student_id)! }))
      .filter((item) => item.student)
  }, [course, snapshot.enrollments, snapshot.students])

  if (!sessionId || !session || !course) return <Navigate to="/today" replace />

  const sessionAttendance = snapshot.attendance.filter((item) => item.session_id === session.id)
  const unconfirmed = roster.length - sessionAttendance.length
  const courseSessions = snapshot.sessions.filter((item) => item.course_id === course.id).sort((a, b) => a.session_date.localeCompare(b.session_date) || a.created_at?.localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id))
  const displayedSessionNumber = session.session_number ?? courseSessions.findIndex((item) => item.id === session.id) + 1

  const openSessionEditor = () => {
    setSessionDate(session.session_date)
    setSessionNumber(String(displayedSessionNumber))
    setSessionEditReason('')
    setSessionEditError('')
    setEditingSession(true)
  }

  const saveSessionEdit = async () => {
    const parsedNumber = sessionNumber.trim() ? Number(sessionNumber) : null
    try {
      validateSessionEdit({ sessionDate, sessionNumber: parsedNumber, reason: sessionEditReason })
      await updateSession(session.id, { sessionDate, sessionNumber: parsedNumber, reason: sessionEditReason })
      setEditingSession(false)
    } catch (caught) {
      setSessionEditError(caught instanceof Error ? caught.message : '課堂場次保存失敗。')
    }
  }

  const markAttendance = async (studentId: string, status: AttendanceStatus) => {
    try { await saveAttendance(session.id, studentId, status) } catch { /* provider displays the error */ }
  }

  const finish = async () => {
    try {
      await closeSession(session.id, {
        class_status: classStatus.trim() || null,
        progress_text: progressText.trim() || null,
        what_worked: whatWorked.trim() || null,
        common_difficulty: commonDifficulty.trim() || null,
        next_adjustment: nextAdjustment.trim() || null,
      })
      sessionStorage.removeItem(`keji-session-reflection-${session.id}`)
      navigate('/today')
    } catch { /* provider displays the error */ }
  }

  return (
    <div className={privacy ? 'session-page privacy-on' : 'session-page'}>
      <header className="session-header">
        <button type="button" className="back-button" onClick={() => navigate('/today')} aria-label="回到今日">←</button>
        <div><p className="eyebrow">{session.session_date} · 第 {displayedSessionNumber} 次上課 · {session.starts_at ?? '本堂課'}</p><h1>{course.name}</h1></div>
        <button type="button" className={privacy ? 'privacy-button active' : 'privacy-button'} onClick={() => setPrivacy((value) => !value)}>{privacy ? '隱私模式開啟' : '開啟隱私模式'}</button>
      </header>

      <Link className="primary-button" to={`/participation?${new URLSearchParams({ course: course.id, date: session.session_date, session: session.id })}`}>記錄自願發言 +1／查看回答次數</Link>

      {editingSession ? <section className="panel session-edit-panel"><div className="panel-heading"><div><p className="section-kicker">教師專用</p><h2>編輯上課場次</h2></div></div><p>這裡編輯的是課堂日期與場次序號，不會修改任何學生回答次數或原始課堂事件。每次修正都會保留日期、次數、原因與時間。</p><div className="reflection-form"><label>上課日期<input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} /></label><label>第幾次上課<input type="number" min="1" max="999" value={sessionNumber} onChange={(event) => setSessionNumber(event.target.value)} /></label><label className="wide">修正原因<textarea required maxLength={500} value={sessionEditReason} onChange={(event) => setSessionEditReason(event.target.value)} placeholder="例如：原先把正式第一堂課誤記為第 2 次。" /></label></div>{sessionEditError && <p role="alert">{sessionEditError}</p>}<div className="close-actions"><button type="button" className="text-button" onClick={() => setEditingSession(false)}>取消</button><button type="button" className="primary-button" disabled={busy} onClick={() => void saveSessionEdit()}>保存場次</button></div></section> : <button type="button" className="secondary-button session-edit-trigger" disabled={busy} onClick={openSessionEditor}>編輯上課日期／次數</button>}

      <div className="session-tabs" role="tablist" aria-label="課堂操作">
        <button className={mode === 'attendance' ? 'active' : ''} onClick={() => setMode('attendance')} role="tab"><span>01</span>點名<b>{unconfirmed > 0 ? `${unconfirmed} 未確認` : '完成'}</b></button>
        <button className={mode === 'close' ? 'active' : ''} onClick={() => setMode('close')} role="tab"><span>02</span>收尾<b>下堂提醒</b></button>
      </div>

      {mode === 'attendance' && (
        <section className="session-workspace">
          <div className="workspace-heading"><div><p className="section-kicker">先記例外，再確認其餘學生</p><h2>點名</h2></div><button className="primary-button compact" disabled={busy || unconfirmed === 0} onClick={() => confirmRemainingPresent(session.id, roster.map((item) => item.student.id))}>確認其餘到課</button></div>
          <div className="attendance-summary">
            <span><strong>{roster.length}</strong>全班</span>
            <span><strong>{sessionAttendance.filter((item) => item.status === 'present').length}</strong>到課</span>
            <span><strong>{sessionAttendance.filter((item) => item.status === 'late').length}</strong>遲到</span>
            <span><strong>{sessionAttendance.filter((item) => item.status === 'absent' || item.status === 'excused').length}</strong>未到</span>
          </div>
          <div className="attendance-list">
            {roster.map(({ enrollment, student }) => {
              const record = sessionAttendance.find((item) => item.student_id === student.id)
              return <div className="attendance-row" key={student.id}>
                <span className="seat-number">{String(enrollment.seat_number ?? '—').padStart(2, '0')}</span>
                <span className="student-identity"><strong>{student.chinese_name}</strong><small>{privacy ? student.student_code : student.original_name ?? student.student_code}</small></span>
                <StatusPill value={record?.status ?? 'unconfirmed'} />
                <div className="row-actions">{attendanceActions.map((action) => <button type="button" key={action.value} className={record?.status === action.value ? 'selected' : ''} disabled={busy} onClick={() => markAttendance(student.id, action.value)}>{action.label}</button>)}</div>
              </div>
            })}
          </div>
          <div className="workspace-next"><span>點名完成後</span><button type="button" onClick={() => setMode('close')}>留下課後記錄 →</button></div>
        </section>
      )}

      {mode === 'close' && (
        <section className="session-workspace close-workspace">
          <div className="workspace-heading"><div><p className="section-kicker">趁記憶還清楚，寫下短句即可</p><h2>課後收尾</h2></div><span className="time-hint">約 2 分鐘</span></div>
          <div className="reflection-form session-note-form">
            <label><span>上課狀況</span><textarea rows={3} maxLength={2000} value={classStatus} onChange={(event) => setClassStatus(event.target.value)} placeholder="例：整體順利；學生能投入活動。" /></label>
            <label className="featured-field"><span>本次進度</span><textarea rows={3} maxLength={2000} value={progressText} onChange={(event) => setProgressText(event.target.value)} placeholder="例：完成教材 P12–13，做到口語練習 2。" /></label>
          </div>
          <details className="optional-reflection">
            <summary>更詳細的教學回顧（可選）</summary>
          <div className="reflection-form">
            <label><span>哪一個做法有效？</span><textarea rows={3} value={whatWorked} onChange={(event) => setWhatWorked(event.target.value)} placeholder="例：先示範一輪，學生比較快進入活動。" /></label>
            <label><span>全班共同卡在哪裡？</span><textarea rows={3} value={commonDifficulty} onChange={(event) => setCommonDifficulty(event.target.value)} placeholder="例：追問時容易只重複原問題。" /></label>
            <label className="featured-field"><span>下一堂要調整什麼？</span><textarea rows={3} value={nextAdjustment} onChange={(event) => setNextAdjustment(event.target.value)} placeholder="例：板書兩個追問句，先讓同桌練一次。" /></label>
          </div>
          </details>
          <div className="close-summary"><div><strong>{sessionAttendance.length}/{roster.length}</strong><span>已確認出席</span></div><div><strong>{snapshot.followups.filter((item) => item.session_id === session.id && item.status === 'open').length}</strong><span>留下待辦</span></div></div>
          <div className="close-actions"><button type="button" className="text-button" onClick={() => navigate('/today')}>保留進行中</button><button type="button" className="primary-button" disabled={busy} onClick={finish}>{busy ? '儲存中…' : '完成這堂課'}</button></div>
        </section>
      )}
    </div>
  )
}
