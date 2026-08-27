import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useTracker } from '../state/TrackerContext'
import type { AttendanceStatus, ObservationResult } from '../types'

type SessionMode = 'attendance' | 'observation' | 'close'

const attendanceActions: { value: AttendanceStatus; label: string }[] = [
  { value: 'late', label: '遲到' }, { value: 'absent', label: '缺席' }, { value: 'excused', label: '請假' }, { value: 'present', label: '到課' },
]

const observationActions: { value: ObservationResult; label: string; hint: string }[] = [
  { value: 'independent', label: '獨立完成', hint: '不需要協助' },
  { value: 'with_prompt', label: '提示後完成', hint: '提醒後能做到' },
  { value: 'not_yet', label: '尚未完成', hint: '下次再觀察' },
]

function nextWeek() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

function readReflectionDraft(sessionId: string | undefined, fallback: { whatWorked: string; commonDifficulty: string; nextAdjustment: string }) {
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
  const { snapshot, busy, saveAttendance, confirmRemainingPresent, saveObservation, closeSession, addFollowup } = useTracker()
  const [mode, setMode] = useState<SessionMode>('attendance')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [observationNote, setObservationNote] = useState('')
  const [privacy, setPrivacy] = useState(true)
  const session = snapshot.sessions.find((item) => item.id === sessionId)
  const course = snapshot.courses.find((item) => item.id === session?.course_id)
  const initialReflection = readReflectionDraft(sessionId, {
    whatWorked: session?.what_worked ?? '',
    commonDifficulty: session?.common_difficulty ?? '',
    nextAdjustment: session?.next_adjustment ?? '',
  })
  const [whatWorked, setWhatWorked] = useState(initialReflection.whatWorked)
  const [commonDifficulty, setCommonDifficulty] = useState(initialReflection.commonDifficulty)
  const [nextAdjustment, setNextAdjustment] = useState(initialReflection.nextAdjustment)

  useEffect(() => {
    if (!sessionId) return
    sessionStorage.setItem(`keji-session-reflection-${sessionId}`, JSON.stringify({ whatWorked, commonDifficulty, nextAdjustment }))
  }, [sessionId, whatWorked, commonDifficulty, nextAdjustment])

  const roster = useMemo(() => {
    if (!course) return []
    return snapshot.enrollments.filter((item) => item.course_id === course.id && item.status === 'active')
      .sort((a, b) => (a.seat_number ?? 999) - (b.seat_number ?? 999))
      .map((enrollment) => ({ enrollment, student: snapshot.students.find((item) => item.id === enrollment.student_id)! }))
      .filter((item) => item.student)
  }, [course, snapshot.enrollments, snapshot.students])

  if (!sessionId || !session || !course) return <Navigate to="/today" replace />

  const sessionAttendance = snapshot.attendance.filter((item) => item.session_id === session.id)
  const sessionObservations = snapshot.observations.filter((item) => item.session_id === session.id)
  const unconfirmed = roster.length - sessionAttendance.length
  const observedIds = new Set(sessionObservations.map((item) => item.student_id))
  const suggestedIds = new Set(roster.filter((item) => !observedIds.has(item.student.id)).slice(0, 6).map((item) => item.student.id))
  const selected = roster.find((item) => item.student.id === selectedStudent)

  const markAttendance = async (studentId: string, status: AttendanceStatus) => {
    try { await saveAttendance(session.id, studentId, status) } catch { /* provider displays the error */ }
  }

  const recordObservation = async (result: ObservationResult) => {
    if (!selectedStudent) return
    try {
      await saveObservation(session.id, selectedStudent, result, observationNote)
      setSelectedStudent(null)
      setObservationNote('')
    } catch { /* provider displays the error */ }
  }

  const finish = async () => {
    try {
      await closeSession(session.id, {
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
        <div><p className="eyebrow">{session.session_date} · {session.starts_at ?? '本堂課'}</p><h1>{course.name}</h1></div>
        <button type="button" className={privacy ? 'privacy-button active' : 'privacy-button'} onClick={() => setPrivacy((value) => !value)}>{privacy ? '隱私模式開啟' : '開啟隱私模式'}</button>
      </header>

      <div className="session-tabs" role="tablist" aria-label="課堂操作">
        <button className={mode === 'attendance' ? 'active' : ''} onClick={() => setMode('attendance')} role="tab"><span>01</span>點名<b>{unconfirmed > 0 ? `${unconfirmed} 未確認` : '完成'}</b></button>
        <button className={mode === 'observation' ? 'active' : ''} onClick={() => setMode('observation')} role="tab"><span>02</span>觀察<b>{sessionObservations.length} 筆</b></button>
        <button className={mode === 'close' ? 'active' : ''} onClick={() => setMode('close')} role="tab"><span>03</span>收尾<b>下堂提醒</b></button>
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
          <div className="workspace-next"><span>點名完成後</span><button type="button" onClick={() => setMode('observation')}>開始課堂觀察 →</button></div>
        </section>
      )}

      {mode === 'observation' && (
        <section className="session-workspace observation-workspace">
          <div className="workspace-heading"><div><p className="section-kicker">點學生，再點本次任務結果</p><h2>課堂觀察</h2></div><div className="observation-count"><strong>{sessionObservations.length}</strong><span>已觀察</span></div></div>
          <div className="observation-layout">
            <div className="student-picker">
              <div className="picker-note"><span className="suggestion-dot" />前 6 名是本堂建議觀察，可自由更換。</div>
              <div className="student-tile-grid">
                {roster.map(({ enrollment, student }) => {
                  const observation = sessionObservations.find((item) => item.student_id === student.id)
                  return <button type="button" key={student.id} onClick={() => setSelectedStudent(student.id)} className={`${selectedStudent === student.id ? 'selected ' : ''}${observation ? 'observed' : ''}`}>
                    <span>{String(enrollment.seat_number ?? '—').padStart(2, '0')}</span><strong>{student.chinese_name}</strong>
                    {observation ? <StatusPill value={observation.result} /> : suggestedIds.has(student.id) ? <small>建議</small> : null}
                  </button>
                })}
              </div>
            </div>
            <aside className={selected ? 'observation-entry open' : 'observation-entry'}>
              {selected ? <>
                <p className="section-kicker">本次任務結果</p>
                <h3>{selected.enrollment.seat_number} 號 · {selected.student.chinese_name}</h3>
                <label className="note-field">補充一句（選填）<input value={observationNote} onChange={(event) => setObservationNote(event.target.value)} placeholder="例：需要提示追問句" /></label>
                <div className="result-buttons">{observationActions.map((action) => <button type="button" key={action.value} disabled={busy} className={`result-${action.value}`} onClick={() => recordObservation(action.value)}><strong>{action.label}</strong><small>{action.hint}</small></button>)}</div>
              </> : <div className="select-prompt"><span>點一名學生</span><p>再選本次任務的結果。一般紀錄不必打字。</p></div>}
            </aside>
          </div>
          {sessionObservations.some((item) => item.result === 'not_yet') && <div className="followup-suggestion"><div><strong>有人需要下次再看一次</strong><span>把尚未完成的學生加入待辦，避免下課後忘記。</span></div><button type="button" className="secondary-button" disabled={busy} onClick={async () => {
            const target = sessionObservations.find((item) => item.result === 'not_yet' && !snapshot.followups.some((followup) => followup.session_id === session.id && followup.student_id === item.student_id && followup.status === 'open'))
            if (target) await addFollowup({ courseId: course.id, studentId: target.student_id, sessionId: session.id, kind: 'reobserve', title: '下次再觀察本次任務', dueOn: nextWeek() })
          }}>加入一筆再觀察</button></div>}
          <div className="workspace-next"><span>課堂結束前</span><button type="button" onClick={() => setMode('close')}>留下下堂提醒 →</button></div>
        </section>
      )}

      {mode === 'close' && (
        <section className="session-workspace close-workspace">
          <div className="workspace-heading"><div><p className="section-kicker">趁記憶還清楚，寫下短句即可</p><h2>課後收尾</h2></div><span className="time-hint">約 2 分鐘</span></div>
          <div className="reflection-form">
            <label><span>哪一個做法有效？</span><textarea rows={3} value={whatWorked} onChange={(event) => setWhatWorked(event.target.value)} placeholder="例：先示範一輪，學生比較快進入活動。" /></label>
            <label><span>全班共同卡在哪裡？</span><textarea rows={3} value={commonDifficulty} onChange={(event) => setCommonDifficulty(event.target.value)} placeholder="例：追問時容易只重複原問題。" /></label>
            <label className="featured-field"><span>下一堂要調整什麼？</span><textarea rows={3} value={nextAdjustment} onChange={(event) => setNextAdjustment(event.target.value)} placeholder="例：板書兩個追問句，先讓同桌練一次。" /></label>
          </div>
          <div className="close-summary"><div><strong>{sessionAttendance.length}/{roster.length}</strong><span>已確認出席</span></div><div><strong>{sessionObservations.length}</strong><span>本堂觀察</span></div><div><strong>{snapshot.followups.filter((item) => item.session_id === session.id && item.status === 'open').length}</strong><span>留下待辦</span></div></div>
          <div className="close-actions"><button type="button" className="text-button" onClick={() => navigate('/today')}>保留進行中</button><button type="button" className="primary-button" disabled={busy} onClick={finish}>{busy ? '儲存中…' : '完成這堂課'}</button></div>
        </section>
      )}
    </div>
  )
}
