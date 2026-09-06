import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { parseRosterCsv } from '../utils/csv'
import { useTracker } from '../state/TrackerContext'
import type { ImportStudentRow } from '../types'

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadFile(filename: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function MorePage() {
  const { snapshot, importStudents, addCourse, signOut, busy } = useTracker()
  const [courseId, setCourseId] = useState(snapshot.courses[0]?.id ?? '')
  const [csv, setCsv] = useState('學號,中文姓名,原名,常用名,座號\n')
  const [importMessage, setImportMessage] = useState('')
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseDraft, setCourseDraft] = useState({ code: '', name: '', room: '', scheduleText: '' })
  const parsed = useMemo(() => parseRosterCsv(csv), [csv])

  useEffect(() => {
    if (!courseId && snapshot.courses[0]) setCourseId(snapshot.courses[0].id)
  }, [courseId, snapshot.courses])

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const doImport = async () => {
    if (!courseId || !parsed.rows.length || parsed.errors.length) return
    try {
      await importStudents(courseId, parsed.rows as ImportStudentRow[])
      setImportMessage(`已匯入 ${parsed.rows.length} 名學生。`)
    } catch { /* provider displays the error */ }
  }

  const createCourse = async (event: FormEvent) => {
    event.preventDefault()
    await addCourse(courseDraft)
    setCourseDraft({ code: '', name: '', room: '', scheduleText: '' })
    setShowCourseForm(false)
  }

  const exportStudents = () => {
    const header = ['學號', '中文姓名', '原名', '常用名', '狀態']
    const rows = snapshot.students.map((student) => [student.student_code, student.chinese_name, student.original_name, student.preferred_name, student.status].map(csvEscape).join(','))
    downloadFile(`荣市大学-学生名册-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${header.join(',')}\n${rows.join('\n')}`, 'text/csv;charset=utf-8')
  }

  const exportBackup = () => downloadFile(`荣市大学-完整备份-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json')

  return (
    <div className="page more-page">
      <header className="page-heading"><p className="eyebrow">低頻管理</p><h1>更多</h1><p>課程、名冊與資料匯出集中在這裡，不佔用每天的操作空間。</p></header>

      <section className="panel settings-section">
        <div className="panel-heading"><div><p className="section-kicker">本學期</p><h2>課程</h2></div><button className="secondary-button compact" onClick={() => setShowCourseForm((value) => !value)}>新增課程</button></div>
        {showCourseForm && <form className="course-form" onSubmit={createCourse}>
          <label>課程代碼<input required value={courseDraft.code} onChange={(event) => setCourseDraft({ ...courseDraft, code: event.target.value })} placeholder="例：CN201-A" /></label>
          <label>課程名稱<input required value={courseDraft.name} onChange={(event) => setCourseDraft({ ...courseDraft, name: event.target.value })} placeholder="例：華語聽說二 A 班" /></label>
          <label>教室<input value={courseDraft.room} onChange={(event) => setCourseDraft({ ...courseDraft, room: event.target.value })} placeholder="例：A302" /></label>
          <label>上課時間<input value={courseDraft.scheduleText} onChange={(event) => setCourseDraft({ ...courseDraft, scheduleText: event.target.value })} placeholder="例：週一、週三 08:00" /></label>
          <button className="primary-button compact" disabled={busy}>建立</button>
        </form>}
        <div className="settings-list">{snapshot.courses.map((course) => <div key={course.id}><span className="course-code">{course.code}</span><span><strong>{course.name}</strong><small>{course.schedule_text ?? '未設定時間'} · {course.room ?? '教室未定'}</small></span><b>{snapshot.enrollments.filter((item) => item.course_id === course.id && item.status === 'active').length} 人</b></div>)}</div>
      </section>

      <section className="panel settings-section import-section">
        <div className="panel-heading"><div><p className="section-kicker">CSV 名冊</p><h2>匯入學生</h2></div><label className="file-button">選擇 CSV<input type="file" accept=".csv,text/csv" onChange={readFile} /></label></div>
        <div className="import-grid">
          <div className="import-editor">
            <label>加入哪一門課<select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{snapshot.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
            <label>名冊內容<textarea value={csv} onChange={(event) => { setCsv(event.target.value); setImportMessage('') }} rows={9} spellCheck={false} /></label>
            <p className="field-help">標題至少要有「學號、中文姓名」；也可加入原名、常用名、座號。</p>
          </div>
          <div className="import-preview">
            <div className="preview-count"><strong>{parsed.rows.length}</strong><span>筆可匯入</span></div>
            {parsed.errors.length ? <ul className="import-errors">{parsed.errors.slice(0, 5).map((message) => <li key={message}>{message}</li>)}</ul> : <div className="preview-sample">{parsed.rows.slice(0, 4).map((row) => <div key={row.student_code}><span>{row.seat_number ?? '—'}</span><strong>{row.chinese_name}</strong><small>{row.student_code}</small></div>)}</div>}
            {importMessage && <p className="success-message">{importMessage}</p>}
            <button className="primary-button full" disabled={busy || !courseId || !parsed.rows.length || parsed.errors.length > 0} onClick={doImport}>確認匯入</button>
          </div>
        </div>
      </section>

      <section className="panel settings-section">
        <div className="panel-heading"><div><p className="section-kicker">帶走自己的資料</p><h2>匯出與帳號</h2></div></div>
        <div className="export-actions"><button className="secondary-button" onClick={exportStudents}>匯出學生名冊 CSV</button><button className="secondary-button" onClick={exportBackup}>下載完整備份</button><button className="text-button danger" onClick={signOut}>登出</button></div>
      </section>
    </div>
  )
}
