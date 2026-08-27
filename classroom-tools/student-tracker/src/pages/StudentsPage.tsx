import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { StatusPill } from '../components/StatusPill'

export function StudentsPage() {
  const { snapshot } = useTracker()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')

  const students = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const allowed = courseId === 'all' ? null : new Set(snapshot.enrollments.filter((item) => item.course_id === courseId && item.status === 'active').map((item) => item.student_id))
    return snapshot.students.filter((student) => student.status === 'active' && (!allowed || allowed.has(student.id)) && (!normalized || [student.student_code, student.chinese_name, student.original_name, student.preferred_name].filter(Boolean).some((value) => value!.toLocaleLowerCase().includes(normalized))))
  }, [snapshot.students, snapshot.enrollments, query, courseId])

  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">學生歷程</p><h1>先找到人，再看最近發生什麼。</h1><p>只顯示教學會用到的出席、任務觀察與未完成待辦。</p></header>
      <section className="panel student-directory">
        <div className="directory-tools">
          <label className="search-field"><span>搜尋學生</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、原名或學號" /></label>
          <label className="select-field"><span>課程</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="all">全部課程</option>{snapshot.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select></label>
        </div>
        <div className="directory-count">找到 {students.length} 名學生</div>
        <div className="student-list">
          {students.map((student) => {
            const enrollments = snapshot.enrollments.filter((item) => item.student_id === student.id && item.status === 'active')
            const courseNames = enrollments.map((item) => snapshot.courses.find((course) => course.id === item.course_id)?.code).filter(Boolean).join('、')
            const lastObservation = snapshot.observations.filter((item) => item.student_id === student.id).sort((a, b) => b.observed_at.localeCompare(a.observed_at))[0]
            const open = snapshot.followups.filter((item) => item.student_id === student.id && item.status === 'open').length
            return <Link className="student-row" to={`/students/${student.id}`} key={student.id}>
              <span className="student-avatar">{student.chinese_name.slice(-2)}</span>
              <span className="student-main"><strong>{student.chinese_name}</strong><small>{student.original_name ?? student.student_code}</small></span>
              <span className="course-mini">{courseNames || '未分班'}</span>
              <span className="student-latest">{lastObservation ? <StatusPill value={lastObservation.result} /> : <span className="muted">尚無觀察</span>}</span>
              <span className={open ? 'open-count visible' : 'open-count'}>{open ? `${open} 待辦` : '無待辦'}</span>
              <b aria-hidden="true">→</b>
            </Link>
          })}
        </div>
      </section>
    </div>
  )
}
