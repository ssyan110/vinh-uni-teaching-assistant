import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { compareSessions, latestParticipationSession, participationRows } from '../utils/participation'
import { studentCodeLastFour } from '../utils/studentIdentity'
import type { ClassSession } from '../types'

const MAX_URGENT_STUDENTS = 8

function participationHref(courseId: string, session?: ClassSession) {
  const params = new URLSearchParams({ course: courseId })
  if (session) {
    params.set('date', session.session_date)
    params.set('session', session.id)
  }
  return `/participation?${params.toString()}`
}

export function TodayPage() {
  const { snapshot } = useTracker()

  const classViews = snapshot.courses
    .filter((course) => !course.archived_at)
    .map((course, courseIndex) => {
      const latest = latestParticipationSession(snapshot, course.id)
      const activeEnrollments = snapshot.enrollments.filter((enrollment) => enrollment.course_id === course.id && enrollment.status === 'active')
      const roster = activeEnrollments.flatMap((enrollment) => {
        const student = snapshot.students.find((item) => item.id === enrollment.student_id)
        return student ? [{ enrollment, student }] : []
      })
      const latestRows = participationRows(snapshot, course.id, latest?.id ?? '').filter((row) => row.enrollment.status === 'active')
      const answeredStudents = latest ? latestRows.filter((row) => row.total > 0).length : null
      const openFollowupsFor = (studentId: string) => snapshot.followups.filter((followup) =>
        followup.status === 'open' && followup.course_id === course.id && followup.student_id === studentId)
      const candidates = latestRows
        .map((row) => {
          const followups = openFollowupsFor(row.student.id)
          const hasNoAnswer = Boolean(latest) && row.total === 0
          return {
            course,
            courseIndex,
            latest,
            row,
            followups,
            hasNoAnswer,
            priority: hasNoAnswer && followups.length ? 0 : hasNoAnswer ? 1 : 2,
          }
        })
        .filter((item) => item.hasNoAnswer || item.followups.length > 0)

      return {
        course,
        latest,
        roster,
        classSize: activeEnrollments.length,
        answeredStudents,
        zeroAnswerStudents: latest ? Math.max(activeEnrollments.length - (answeredStudents ?? 0), 0) : null,
        randomAnswers: latest ? latestRows.reduce((sum, row) => sum + row.random, 0) : null,
        teacherAnswers: latest ? latestRows.reduce((sum, row) => sum + row.teacher, 0) : null,
        voluntaryAnswers: latest ? latestRows.reduce((sum, row) => sum + row.voluntary, 0) : null,
        candidates,
      }
    })

  const urgentStudents = classViews
    .flatMap((view) => view.candidates)
    .sort((a, b) => a.priority - b.priority
      || a.courseIndex - b.courseIndex
      || (a.row.enrollment.seat_number ?? 999) - (b.row.enrollment.seat_number ?? 999))
    .slice(0, MAX_URGENT_STUDENTS)
  const totalUrgentStudents = classViews.reduce((sum, view) => sum + view.candidates.length, 0)
  const history = [...snapshot.sessions].sort(compareSessions)
  const courseForSession = (session: ClassSession) => snapshot.courses.find((course) => course.id === session.course_id)
  const hasNotes = (session: ClassSession) => [
    session.class_status,
    session.progress_text,
    session.what_worked,
    session.common_difficulty,
    session.next_adjustment,
  ].some(Boolean)

  return <div className="page today-page">
    <header className="page-heading">
      <h1>班级总览</h1>
      <p>查看最近一堂课的回答记录，继续课后跟进。</p>
    </header>

    <section className="class-cards" aria-label="三个班级摘要">
      {classViews.map((view) => (
        <article className="panel class-card" key={view.course.id}>
          <div className="class-card-heading">
            <div>
              <span className="eyebrow">{view.course.code}</span>
              <h2>{view.course.name}</h2>
            </div>
            <span className="class-card-latest">最近一堂课<br /><strong>{view.latest?.session_date ?? '尚无记录'}</strong></span>
          </div>
          <p className="class-card-meta">{view.course.schedule_text || '尚未登记课表'} · {view.course.room || '教室未登记'}</p>

          <div className="class-participation" aria-label={`${view.course.name}最近一堂课的回答摘要`}>
            <div className="class-participation-heading"><span>最近一堂课的回答摘要</span><small>{view.latest ? '每个回答事件各记一次' : '有课堂记录后显示'}</small></div>
            <div className="participation-metrics">
              <div><strong>{view.classSize}</strong><span>班级人数</span></div>
              <div><strong>{view.answeredStudents ?? '—'}</strong><span>已记录回答人数</span></div>
              <div className={view.zeroAnswerStudents ? 'attention' : ''}><strong>{view.zeroAnswerStudents ?? '—'}</strong><span>零回答人数</span></div>
              <div><strong>{view.randomAnswers ?? '—'}</strong><span>随机抽问</span></div>
              <div><strong>{view.voluntaryAnswers ?? '—'}</strong><span>自愿发言</span></div>
              <div><strong>{view.teacherAnswers ?? '—'}</strong><span>老师主动叫</span></div>
            </div>
          </div>

          <div className="class-card-actions" aria-label={`${view.course.name}重要行动`}>
            <Link className="secondary-button compact" to={participationHref(view.course.id, view.latest)}>查看回答次数</Link>
            {view.latest
              ? <Link className="secondary-button compact" to={participationHref(view.course.id, view.latest)}>记录自愿发言</Link>
              : <span className="secondary-button compact disabled-action" aria-disabled="true">记录自愿发言</span>}
            {view.latest
              ? <Link className="primary-button compact" to={`/sessions/${view.latest.id}?view=reflection`}>记录课后状况</Link>
              : <span className="primary-button compact disabled-action" aria-disabled="true">记录课后状况</span>}
          </div>
        </article>
      ))}
    </section>

    {!classViews.length && <section className="panel empty-state">尚无班级。请先到「更多」新增班级并导入名册。</section>}

    <section className="panel urgent-panel" aria-labelledby="urgent-heading">
      <div className="panel-heading">
        <div><h2 id="urgent-heading">需要跟进的学生</h2></div>
        <span>{urgentStudents.length ? `显示 ${urgentStudents.length} 人` : '目前没有'}</span>
      </div>
      <p className="section-lead">优先显示最近一堂课零回答或有当前待办的学生，最多显示 8 人。</p>
      {urgentStudents.length ? <div className="urgent-student-list">
        {urgentStudents.map((item) => {
          const reason = [item.hasNoAnswer ? '零回答' : '', item.followups.length ? `${item.followups.length} 项待办` : ''].filter(Boolean).join(' · ')
          return <article className="urgent-student-row" key={`${item.course.id}-${item.row.student.id}`}>
            <span className="urgent-seat" aria-label={`學號末四位 ${studentCodeLastFour(item.row.student.student_code)}`}>{studentCodeLastFour(item.row.student.student_code)}</span>
            <div className="urgent-student-identity"><strong>{item.row.student.chinese_name}</strong><small>{item.course.code} · {reason}</small></div>
            <div className="urgent-actions">
              <Link to={participationHref(item.course.id, item.latest)}>查看回答次数</Link>
              {item.latest
                ? <Link to={participationHref(item.course.id, item.latest)}>记录自愿发言</Link>
                : <Link to={`/students/${item.row.student.id}?course=${item.course.id}`}>查看待办</Link>}
            </div>
          </article>
        })}
      </div> : <p className="empty-inline">{history.length ? '最近一堂课没有零回答学生，也没有学生待办。' : '建立第一堂课后，这里会列出零回答或有待办的学生。'}</p>}
      {totalUrgentStudents > urgentStudents.length && <p className="field-help">还有 {totalUrgentStudents - urgentStudents.length} 人符合条件；完整名单已放在下方，默认收起。</p>}
    </section>

    <section className="on-demand-grid" aria-label="按需查看的资料">
      <details className="panel on-demand-panel">
        <summary><span>完整学生名单</span><small>{classViews.reduce((sum, view) => sum + view.roster.length, 0)} 人</small></summary>
        <div className="roster-grid">
          {classViews.map((view) => <section className="roster-class" key={view.course.id}>
            <div className="roster-class-heading"><strong>{view.course.code}</strong><span>{view.roster.length} 人</span></div>
            <ol className="roster-list">
              {view.roster.map(({ student }) => <li key={student.id}><span aria-label={`學號末四位 ${studentCodeLastFour(student.student_code)}`}>{studentCodeLastFour(student.student_code)}</span><strong>{student.chinese_name}</strong><small>{student.original_name ?? ''}</small></li>)}
            </ol>
          </section>)}
        </div>
      </details>

      <details className="panel on-demand-panel">
        <summary><span>历史课堂记录</span><small>{history.length} 堂</small></summary>
        {history.length ? <div className="history-list">
          {history.map((session) => {
            const course = courseForSession(session)
            return <article className="history-row" key={session.id}>
              <div><strong>{course?.code ?? '未命名班级'}</strong><Link to={`/sessions/${session.id}?view=reflection`}>{session.session_date}</Link></div>
              <small>{session.topic || '课堂记录'} · {session.status === 'in_progress' ? '进行中' : '已完成'}</small>
            </article>
          })}
        </div> : <p className="empty-inline">尚无历史课堂记录。</p>}
      </details>

      <details className="panel on-demand-panel">
        <summary><span>课后备注</span><small>{history.filter(hasNotes).length} 堂有记录</small></summary>
        {history.filter(hasNotes).length ? <div className="notes-list">
          {history.filter(hasNotes).map((session) => {
            const course = courseForSession(session)
            return <article className="after-class-note" key={session.id}>
              <div className="history-row-heading"><strong>{course?.code ?? '未命名班级'}</strong><time>{session.session_date}</time></div>
              {session.class_status && <p><b>上课状况：</b>{session.class_status}</p>}
              {session.progress_text && <p><b>本次进度：</b>{session.progress_text}</p>}
              {session.what_worked && <p><b>有效做法：</b>{session.what_worked}</p>}
              {session.common_difficulty && <p><b>共同困难：</b>{session.common_difficulty}</p>}
              {session.next_adjustment && <p><b>下次调整：</b>{session.next_adjustment}</p>}
            </article>
          })}
        </div> : <p className="empty-inline">尚无课后备注。</p>}
      </details>
    </section>

    <p className="external-attendance-note">出席在外部 QR 点名表处理；本页不重复记录出席。</p>
  </div>
}
