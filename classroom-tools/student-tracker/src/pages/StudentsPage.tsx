import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { currentNotes, evidenceRows } from '../utils/classroomAnalysis'
import { studentCodeLastFour } from '../utils/studentIdentity'

export function StudentsPage() {
  const { snapshot } = useTracker()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const selectionTrigger = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => { if (selectedId) previewRef.current?.focus() }, [selectedId])

  const students = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const allowed = courseId === 'all' ? null : new Set(snapshot.enrollments.filter((item) => item.course_id === courseId && item.status === 'active').map((item) => item.student_id))
    return snapshot.students.filter((student) => student.status === 'active' && (!allowed || allowed.has(student.id)) && (!normalized || [student.student_code, student.chinese_name, student.original_name, student.preferred_name].filter(Boolean).some((value) => value!.toLocaleLowerCase().includes(normalized))))
  }, [snapshot.students, snapshot.enrollments, query, courseId])

  const evidence=evidenceRows(snapshot)
  const selected = students.find(student => student.id === selectedId)
  const selectedRecords = selected ? evidence.filter(row => row.studentId === selected.id && (courseId === 'all' || row.courseId === courseId)).slice(0, 4) : []
  const selectedNotes = selected ? currentNotes(snapshot.studentNotes.filter(note => note.student_id === selected.id && (courseId === 'all' || note.course_id === courseId))).slice(0, 2) : []
  const selectedEnrollments = selected ? snapshot.enrollments.filter(item => item.student_id === selected.id && item.status === 'active' && (courseId === 'all' || item.course_id === courseId)) : []
  return (
    <div className="page">
      <header className="page-heading"><h1>学生</h1><p>找到学生，查看最近的课堂记录与跟进待办。</p></header>
      <div className={`student-directory-layout${selected ? ' has-selection' : ''}`}>
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
            return <Link className="student-row" to={`/students/${student.id}${courseId==='all'?'':`?course=${encodeURIComponent(courseId)}`}`} key={student.id} aria-current={selectedId === student.id ? 'true' : undefined} onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              selectionTrigger.current = event.currentTarget
              setSelectedId(student.id)
            }}>
              <span className="student-seat-number" aria-label={`學號末四位 ${studentCodeLastFour(student.student_code)}`}>{studentCodeLastFour(student.student_code)}</span>
              <span className="student-main"><strong>{student.chinese_name}</strong><small>{[student.original_name, `學號末四位 ${studentCodeLastFour(student.student_code)}`].filter(Boolean).join(' · ')}</small></span>
              <span className="course-mini">{courseNames || '未分班'}</span>
              <span className="student-latest">{lastActivity ? <span>{lastActivity.source} · {new Date(lastActivity.date).toLocaleDateString('zh-TW')}</span> : <span className="muted">尚無回答</span>}</span>
              <span className={open ? 'open-count visible' : 'open-count'}>{open ? `${open} 待辦` : '無待辦'}</span>
              <b aria-hidden="true">→</b>
            </Link>
          })}
        </div>
      </section>
      {selected && <aside className="student-preview" ref={previewRef} tabIndex={-1} aria-label={`${selected.chinese_name}的课堂记录`}>
        <header><div><h2>{selected.chinese_name}</h2><p>學號末四位 {studentCodeLastFour(selected.student_code)}{selected.original_name ? ` · ${selected.original_name}` : ''}</p></div><button className="text-button" aria-label="关闭学生预览" onClick={() => { setSelectedId(null); selectionTrigger.current?.focus() }}>×</button></header>
        <p className="field-help">修讀班級：{selectedEnrollments.map(item => snapshot.courses.find(course => course.id === item.course_id)?.code).filter(Boolean).join(' / ') || '未分班'}</p>
        <section><h3>最近课堂记录</h3>{selectedRecords.length ? selectedRecords.map(row => <div className="preview-event" key={row.id}><time>{new Date(row.date).toLocaleDateString('zh-CN')}</time><strong>{row.source} · {row.included ? '已回答' : row.status}</strong></div>) : <p className="muted">尚无课堂回答记录。</p>}</section>
        <section><h3>教师备注</h3>{selectedNotes.length ? selectedNotes.map(note => <div className="preview-event" key={note.id}><time>{note.note_date}</time><p>{note.body}</p></div>) : <p className="muted">尚无备注。</p>}</section>
        <Link className="secondary-button" to={`/students/${selected.id}${courseId === 'all' ? '' : `?course=${encodeURIComponent(courseId)}`}`}>查看完整记录与待办 →</Link>
      </aside>}
      </div>
    </div>
  )
}
