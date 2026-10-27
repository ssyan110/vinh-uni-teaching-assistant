import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { compareSessions, latestParticipationSession, participationRows } from '../utils/participation'
import { studentCodeLastFour } from '../utils/studentIdentity'
import { nextClassQueue } from '../utils/nextClassQueue'
import type { ClassSession } from '../types'

const MAX_QUEUE_ROWS = 8

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
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showAll, setShowAll] = useState(false)

  const classViews = snapshot.courses
    .filter((course) => !course.archived_at)
    .map((course) => {
      const latest = latestParticipationSession(snapshot, course.id)
      const activeEnrollments = snapshot.enrollments.filter((enrollment) => enrollment.course_id === course.id && enrollment.status === 'active')
      const roster = activeEnrollments.flatMap((enrollment) => {
        const student = snapshot.students.find((item) => item.id === enrollment.student_id)
        return student ? [{ enrollment, student }] : []
      })
      const latestRows = participationRows(snapshot, course.id, latest?.id ?? '').filter((row) => row.enrollment.status === 'active')
      const answeredStudents = latest ? latestRows.filter((row) => row.total > 0).length : null

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
      }
    })

  const queueCourse = classViews.find(view => view.course.id === selectedCourse)?.course ?? classViews[0]?.course
  const queue = nextClassQueue(snapshot, queueCourse?.id ?? '')
  const queueItems = showAll ? queue.items : queue.items.slice(0, MAX_QUEUE_ROWS)
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
      <div className="panel-heading"><h2 id="urgent-heading">下堂课跟进</h2><span>{queue.items.length} 项</span></div>
      <div className="filter-panel"><label>选择班级<select value={queueCourse?.id ?? ''} onChange={e => { setSelectedCourse(e.target.value); setShowAll(false) }}>
        {!classViews.length && <option value="">尚无班级</option>}{classViews.map(view => <option key={view.course.id} value={view.course.id}>{view.course.name}</option>)}
      </select></label>{queueCourse && <Link className="secondary-button compact" to={`/followups?course=${encodeURIComponent(queueCourse.id)}`}>处理本班待办</Link>}</div>
      <p className="section-lead">先处理已记录的提醒与补做，再安排口语观察。同一学生合并显示；观察建议来自最近一堂课{queue.latest ? `（${queue.latest.session_date}）` : ''}的最后一条有效口语记录。</p>
      {queueItems.length ? <div className="urgent-student-list">{queueItems.map(item => <article className="urgent-student-row" key={item.studentId ?? 'class'}>
        <span className="urgent-seat">{item.student ? studentCodeLastFour(item.student.student_code) : '—'}</span>
        <div className="urgent-student-identity"><strong>{item.student?.chinese_name ?? (item.studentId ? '学生资料未载入' : '全班待办')}</strong>
          {item.followups.map(task => <small key={task.id}><Link to={`/followups?course=${encodeURIComponent(queueCourse!.id)}#followup-${encodeURIComponent(task.id)}`}>{task.title}</Link> · {task.due_on || '未设日期'}</small>)}
          {item.observation && <small>{item.observation.reason} · {item.observation.evidence}</small>}
        </div>
        <div className="urgent-actions">{item.student && <Link to={`/students/${encodeURIComponent(item.student.id)}?course=${encodeURIComponent(queueCourse!.id)}`}>查看记录与跟进</Link>}
          {item.observation && queue.latest && <Link to={`/sessions/${encodeURIComponent(queue.latest.id)}?view=reflection`}>查看来源课堂</Link>}
        </div>
      </article>)}</div> : <p className="empty-inline">{queue.latest ? '本班目前没有待办或需要再观察的记录。' : '本班尚无待办或课堂记录；建立课堂记录后再安排观察。'}</p>}
      {queue.items.length > MAX_QUEUE_ROWS && <button type="button" className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? '收起名单' : `显示全部 ${queue.items.length} 项`}</button>}
      <p className="field-help">未观察不代表零分、缺席或未交作业。补做只依据已建立且未完成的待办；观察建议不会自动建立待办或修改成绩。</p>
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
