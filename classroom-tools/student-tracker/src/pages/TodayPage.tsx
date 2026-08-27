import { useNavigate } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { StatusPill } from '../components/StatusPill'

function dateHeading() {
  return new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
}

export function TodayPage() {
  const { snapshot, startSession, busy } = useTracker()
  const navigate = useNavigate()
  const active = snapshot.sessions.find((session) => session.status === 'in_progress')
  const primaryCourse = active ? snapshot.courses.find((course) => course.id === active.course_id) : snapshot.courses[0]
  const lastCompleted = primaryCourse
    ? snapshot.sessions.filter((session) => session.course_id === primaryCourse.id && session.status === 'completed').sort((a, b) => b.session_date.localeCompare(a.session_date))[0]
    : undefined
  const dueFollowups = snapshot.followups.filter((item) => item.status === 'open').sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999')).slice(0, 5)

  const launch = async (courseId: string) => {
    const id = await startSession(courseId)
    navigate(`/sessions/${id}`)
  }

  return (
    <div className="page today-page">
      <header className="page-heading split-heading">
        <div><p className="eyebrow">{dateHeading()}</p><h1>今天先做哪一件事？</h1></div>
        <div className="term-chip">{snapshot.terms.find((term) => term.is_active)?.name ?? '本學期'}</div>
      </header>

      {primaryCourse ? (
        <section className="next-class-card">
          <div className="next-class-main">
            <p className="section-kicker">{active ? '進行中的課堂' : '下一堂課'}</p>
            <h2>{primaryCourse.name}</h2>
            <p>{primaryCourse.schedule_text ?? '尚未設定時間'}<span className="dot-separator">·</span>{primaryCourse.room ?? '教室未定'}</p>
            <button className="primary-button" disabled={busy} onClick={() => launch(primaryCourse.id)}>{active ? '繼續課堂' : '開始課堂'}<span aria-hidden="true">→</span></button>
          </div>
          <div className="next-class-note">
            <p className="section-kicker">上次留下的提醒</p>
            {lastCompleted ? (
              <>
                <div className="reflection-line"><span>共同卡點</span><strong>{lastCompleted.common_difficulty || '尚未記錄'}</strong></div>
                <div className="reflection-line"><span>這堂調整</span><strong>{lastCompleted.next_adjustment || '尚未記錄'}</strong></div>
              </>
            ) : <p className="muted">完成第一堂課後，這裡會帶回你的教學提醒。</p>}
          </div>
        </section>
      ) : (
        <section className="empty-card"><h2>先建立第一門課</h2><p>到「更多」新增課程，再匯入學生名冊。</p><button className="secondary-button" onClick={() => navigate('/more')}>前往設定</button></section>
      )}

      <div className="dashboard-grid">
        <section className="panel action-panel">
          <div className="panel-heading"><div><p className="section-kicker">其他班級</p><h2>快速開課</h2></div><span>{snapshot.courses.length} 門</span></div>
          <div className="course-list">
            {snapshot.courses.map((course) => {
              const running = snapshot.sessions.find((session) => session.course_id === course.id && session.status === 'in_progress')
              const count = snapshot.enrollments.filter((enrollment) => enrollment.course_id === course.id && enrollment.status === 'active').length
              return (
                <button type="button" className="course-row" key={course.id} onClick={() => launch(course.id)} disabled={busy}>
                  <span className="course-code">{course.code}</span>
                  <span><strong>{course.name}</strong><small>{course.schedule_text ?? '未設定時間'} · {count} 人</small></span>
                  <b>{running ? '繼續' : '開始'} →</b>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel followup-panel">
          <div className="panel-heading"><div><p className="section-kicker">今天要記得</p><h2>待辦</h2></div><button type="button" className="text-button" onClick={() => navigate('/followups')}>查看全部</button></div>
          {dueFollowups.length ? <div className="compact-list">
            {dueFollowups.map((item) => {
              const student = snapshot.students.find((entry) => entry.id === item.student_id)
              return <div className="compact-item" key={item.id}><StatusPill value={item.kind} /><div><strong>{item.title}</strong><small>{student?.chinese_name ?? '全班'} · {item.due_on ?? '未設日期'}</small></div></div>
            })}
          </div> : <div className="quiet-empty">目前沒有待辦。</div>}
        </section>
      </div>
    </div>
  )
}
