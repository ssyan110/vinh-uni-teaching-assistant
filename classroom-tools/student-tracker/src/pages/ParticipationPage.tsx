import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { participationRows } from '../utils/participation'
import { csvCell, downloadCsv } from '../utils/classroomExport'

export function ParticipationPage() {
  const { snapshot, busy, saveLearningEvent } = useTracker()
  const [params, setParams] = useSearchParams()
  const courseId = params.get('course') || ''
  const [date, setDate] = useState(() => params.get('date') || '')
  const [sessionId, setSessionId] = useState(() => params.get('session') || '')
  const [context, setContext] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const saving = useRef(false)
  const pendingSaves = useRef(new Map<string, string>())
  const course = snapshot.courses.find(c => c.id === courseId)
  const sessions = snapshot.sessions.filter(s => s.course_id === courseId).sort((a, b) =>
    a.session_date.localeCompare(b.session_date) || (a.starts_at || '').localeCompare(b.starts_at || '') || a.id.localeCompare(b.id))
  const session = sessions.find(s => s.id === sessionId && s.session_date === date)
  const dates = [...new Set(sessions.map(s => s.session_date))].reverse()
  const contexts = [...new Set([
    ...snapshot.attempts.filter(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === sessionId).map(a => `${a.textbook_id}:${a.lesson_id}`),
    ...snapshot.learningEvents.filter(e => e.course_id === courseId && e.session_id === sessionId && e.textbook_id && e.lesson_id).map(e => `${e.textbook_id}:${e.lesson_id}`),
  ])]
  const contextOptions = [...new Set([...contexts,
    ...Array.from({ length: 12 }, (_, i) => `boya-quasi-intermediate-i:lesson-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 8 }, (_, i) => `boya-intermediate-i:lesson-${String(i + 1).padStart(2, '0')}`),
  ])]
  const selectedContext = contextOptions.includes(context) ? context : contexts.length === 1 ? contexts[0] : ''
  const rows = session ? participationRows(snapshot, courseId, session.id) : []
  const visibleRows = rows.filter(r => `${r.student.chinese_name} ${r.student.original_name} ${r.student.student_code} ${r.enrollment.seat_number ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const number = session ? session.session_number ?? sessions.indexOf(session) + 1 : 0
  const add = async (studentId: string, name: string) => {
    if (!session || !selectedContext || saving.current) return
    saving.current = true
    setNotice('')
    const [textbook, lesson] = selectedContext.split(':')
    const intent = `${session.id}:${studentId}:${selectedContext}`
    const clientEventId = pendingSaves.current.get(intent) || `volunteer:${crypto.randomUUID()}`
    pendingSaves.current.set(intent, clientEventId)
    try {
      await saveLearningEvent({ course_id: courseId, session_id: session.id, student_id: studentId,
        client_event_id: clientEventId, counted_for_grade: false,
        source: 'voluntary_answer', textbook_id: textbook, lesson_id: lesson, lesson_label: lesson,
        activity_label: '自願發言', response_status: 'answered', record_status: 'valid', counted_for_summary: true,
        task_completion: null, comprehensibility: null, language_control: null, interaction: null, needs_review: false })
      pendingSaves.current.delete(intent)
      setNotice(`${name}：已記錄自願發言一次。`)
    } catch { /* Tracker displays the saving error. */ }
    finally { saving.current = false }
  }
  const exportTable = () => {
    if (!session || !course) return
    const values = [['班級', '日期', '上課場次', '座號', '學號', '姓名', '抽問回答', '自願發言', '總回答次數'],
      ...rows.map(r => [course.code, date, `第 ${number} 次上課`, r.enrollment.seat_number ?? '', r.student.student_code, r.student.chinese_name, r.random, r.voluntary, r.total])]
    downloadCsv('\uFEFF' + values.map(row => row.map(csvCell).join(',')).join('\r\n'), `${course.code}-${date}-第${number}次上課-回答次數.csv`)
  }
  return <div className="participation-page">
    <header className="page-heading"><h1>每堂課回答次數</h1><p>先選班級、日期和上課場次，再查看全班紀錄。每回答一次就計一次；誤記可到學生詳情逐筆更正。</p></header>
    <div className="participation-filters">
      <label>班級<select value={courseId} onChange={e => { setParams(e.target.value ? { course: e.target.value } : {}); setDate(''); setSessionId(''); setContext(''); setNotice('') }}><option value="">選擇班級</option>{snapshot.courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></label>
      <label>上課日期<select value={date} disabled={!course} onChange={e => { setDate(e.target.value); const matches = sessions.filter(s => s.session_date === e.target.value); setSessionId(matches.length === 1 ? matches[0].id : ''); setContext(''); setNotice('') }}><option value="">選擇日期</option>{dates.map(d => <option key={d}>{d}</option>)}</select></label>
      <label>上課場次<select value={session?.id || ''} disabled={!date} onChange={e => { setSessionId(e.target.value); setContext(''); setNotice('') }}><option value="">選擇上課場次</option>{sessions.filter(s => s.session_date === date).map(s => <option key={s.id} value={s.id}>第 {s.session_number ?? sessions.indexOf(s) + 1} 次上課{s.starts_at ? ` · ${s.starts_at}` : ''}{s.topic ? ` · ${s.topic}` : ''}</option>)}</select></label>
    </div>
    {!session ? <p className="empty-state">{course && !sessions.length ? '這個班級尚未建立上課紀錄。請先到「班級」開始一堂課。' : '選好上課場次後，這裡會列出每位學生，包括回答 0 次的學生。'}</p> : <>
      <div className="participation-toolbar"><h2>{course?.code} · {date} · 第 {number} 次上課</h2><button className="secondary-button" onClick={exportTable}>匯出 CSV（Excel 可開啟）</button></div>
      <p>{rows.length} 名學生 · 總回答 {rows.reduce((sum, r) => sum + r.total, 0)} 次</p>
      <p className="field-help">抽問工具按「記錄回答」後會自動累計；未回答及撤銷紀錄不計入。<a href="https://classroom-randomizer-opal.vercel.app" target="_blank" rel="noreferrer">開啟課堂抽問 ↗</a></p>
      <label>新增自願發言的教材課次<select value={selectedContext} onChange={e => setContext(e.target.value)}><option value="">選擇本次發言的課次</option>{contextOptions.map(c => <option key={c} value={c}>{c.split(':')[0] === 'boya-quasi-intermediate-i' ? '準中級加速篇 I' : '中級衝刺篇 I'} · 第 {Number(c.split('lesson-')[1])} 課</option>)}</select></label>
      {!selectedContext && <p className="field-help" role="status">加記前，先選這次發言使用的教材課次，再按學生那一列的「自願發言 +1」。</p>}
      <p role="status">{notice}</p>
      <label>找學生<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="姓名、學號或座號" /></label>
<div className="participation-table-wrap"><table className="participation-table"><caption>本堂課每位學生的回答紀錄</caption><thead><tr>{['座號', '學號', '姓名', '抽問回答', '自願發言', '總回答次數', '加記', '明細'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{visibleRows.map(r => <tr key={r.student.id}><td>{r.enrollment.seat_number ?? '—'}</td><td>{r.student.student_code}</td><th scope="row">{r.student.chinese_name}<small>{r.student.original_name}</small></th><td>{r.random}</td><td>{r.voluntary}</td><td><strong>{r.total}</strong></td><td><button className="secondary-button compact" disabled={busy || !selectedContext || r.enrollment.status !== 'active'} onClick={() => void add(r.student.id, r.student.chinese_name)} aria-label={`${r.student.chinese_name}自願發言加一次`}>自願發言 +1</button></td><td><Link className="text-button" to={`/students/${r.student.id}?course=${encodeURIComponent(courseId)}`}>查看並修正</Link></td></tr>)}</tbody></table></div>
      <p className="field-help">上課次數是課堂場次序號，不是學生回答次數；可在本堂課頁面編輯。</p>
    </>}
  </div>
}
