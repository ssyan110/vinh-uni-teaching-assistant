import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { evidenceRows } from '../utils/classroomAnalysis'

export function StudentsPage() {
  const { snapshot } = useTracker()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')

  const students = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const allowed = courseId === 'all' ? null : new Set(snapshot.enrollments.filter((item) => item.course_id === courseId && item.status === 'active').map((item) => item.student_id))
    return snapshot.students.filter((student) => student.status === 'active' && (!allowed || allowed.has(student.id)) && (!normalized || [student.student_code, student.chinese_name, student.original_name, student.preferred_name].filter(Boolean).some((value) => value!.toLocaleLowerCase().includes(normalized))))
  }, [snapshot.students, snapshot.enrollments, query, courseId])

  const evidence=evidenceRows(snapshot)
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">學生歷程</p><h1>先找到人，再看最近發生什麼。</h1><p>查看每次回答、日期事實備註與跟進待辦。</p></header>
      <section className="panel student-directory">
        <div className="directory-tools">
          <label className="search-field"><span>搜尋學生</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、原名或學號" /></label>
          <label className="select-field"><span>課程</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="all">全部課程</option>{snapshot.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select></label>
        </div>
        <div className="directory-count">找到 {students.length} 名學生</div>
        <div className="student-list">
          {students.map((student) => {
            const enrollments = snapshot.enrollments.filter((item) => item.student_id === student.id && item.status === 'active')
            const courseNames = snapshot.courses.filter(course => enrollments.some(item => item.course_id === course.id)).map(course => course.code).join('、')
            const lastActivity = evidence.find(item=>item.studentId===student.id&&(courseId==='all'||item.courseId===courseId))
            const open = snapshot.followups.filter((item) => item.student_id === student.id && item.status === 'open' && (courseId==='all'||item.course_id===courseId)).length
            return <Link className="student-row" to={`/students/${student.id}${courseId==='all'?'':`?course=${encodeURIComponent(courseId)}`}`} key={student.id}>
              <span className="student-avatar">{student.chinese_name.slice(-2)}</span>
              <span className="student-main"><strong>{student.chinese_name}</strong><small>{student.original_name ?? student.student_code}</small></span>
              <span className="course-mini">{courseNames || '未分班'}</span>
              <span className="student-latest">{lastActivity ? <span>{lastActivity.source} · {new Date(lastActivity.date).toLocaleDateString('zh-TW')}</span> : <span className="muted">尚無回答</span>}</span>
              <span className={open ? 'open-count visible' : 'open-count'}>{open ? `${open} 待辦` : '無待辦'}</span>
              <b aria-hidden="true">→</b>
            </Link>
          })}
        </div>
      </section>
    </div>
  )
}
