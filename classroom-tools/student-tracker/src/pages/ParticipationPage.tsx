import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { participationRecords, participationRows } from '../utils/participation'
import { csvCell, downloadCsv } from '../utils/classroomExport'
import { studentCodeLastFour } from '../utils/studentIdentity'

type ParticipationRow = ReturnType<typeof participationRows>[number]
type QuickAdjustmentState = { status: 'saving' | 'saved' | 'error'; message: string }

export function ParticipationPage() {
  const { snapshot, busy, saveLearningEvent, correctClassroomRecord } = useTracker()
  const [params, setParams] = useSearchParams()
  const courseId = params.get('course') || ''
  const [date, setDate] = useState(() => params.get('date') || '')
  const [sessionId, setSessionId] = useState(() => params.get('session') || '')
  const [context, setContext] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [quickStates, setQuickStates] = useState<Record<string, QuickAdjustmentState>>({})
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
  const visibleRows = rows.filter(r => `${r.student.chinese_name} ${r.student.original_name} ${r.student.student_code} ${studentCodeLastFour(r.student.student_code)}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const sessionLabel = session?.session_number ? `第 ${session.session_number} 次上課` : '場次未編號'

  const setQuickState = (studentId: string, next: QuickAdjustmentState) => {
    setQuickStates(current => ({ ...current, [studentId]: next }))
  }

  const addVoluntaryAnswer = async (studentId: string, name: string) => {
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

  const adjustAnswerCount = async (row: ParticipationRow, delta: 1 | -1) => {
    if (!session || busy || row.enrollment.status !== 'active') return
    if (delta === -1 && row.total === 0) return
    const name = row.student.chinese_name
    setQuickState(row.student.id, { status: 'saving', message: '保存中…' })
    try {
      if (delta === 1) {
        await saveLearningEvent({
          course_id: courseId,
          session_id: session.id,
          student_id: row.student.id,
          source: 'manual_adjustment',
          textbook_id: null,
          lesson_id: null,
          lesson_label: null,
          activity_label: '回答次數快速加記',
          teacher_note: '回答次數管理頁使用 ＋ 快速調整。',
          response_status: 'answered',
          record_status: 'valid',
          counted_for_summary: true,
          counted_for_grade: false,
          task_completion: null,
          comprehensibility: null,
          language_control: null,
          interaction: null,
          needs_review: false,
        })
      } else {
        const latest = participationRecords(snapshot, courseId, session.id).find(record =>
          record.studentId === row.student.id || (!record.studentId && record.studentCode === row.student.student_code))
        if (!latest) throw new Error('找不到可減少的有效回答，請先更新資料。')
        await correctClassroomRecord({
          recordType: latest.recordType,
          recordId: latest.recordId,
          reason: '在回答次數管理頁使用 − 快速調整。',
        })
      }
      setQuickState(row.student.id, { status: 'saved', message: delta === 1 ? '已增加 1 次' : '已減少 1 次' })
    } catch (caught) {
      setQuickState(row.student.id, { status: 'error', message: caught instanceof Error ? caught.message : '保存失敗，請再試一次。' })
    }
  }

  const exportTable = () => {
    if (!session || !course) return
    const values = [['班級', '日期', '上課場次', '學號', '姓名', '抽問回答', '自願發言', '快速調整', '總回答次數'],
      ...rows.map(r => [course.code, date, sessionLabel, r.student.student_code, r.student.chinese_name, r.random, r.voluntary, r.manual, r.total])]
    downloadCsv('\uFEFF' + values.map(row => row.map(csvCell).join(',')).join('\r\n'), `${course.code}-${date}-${sessionLabel.replaceAll(' ', '')}-回答次數.csv`)
  }

  return <div className="participation-page">
    <header className="page-heading"><h1>每堂課回答次數</h1><p>先選班級、日期和上課場次，再查看全班紀錄。每回答一次就計一次；回答次數可在本頁直接快速調整。</p></header>
    <div className="participation-filters">
      <label>班級<select value={courseId} onChange={e => { setParams(e.target.value ? { course: e.target.value } : {}); setDate(''); setSessionId(''); setContext(''); setNotice(''); setQuickStates({}) }}><option value="">選擇班級</option>{snapshot.courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></label>
      <label>上課日期<select value={date} disabled={!course} onChange={e => { setDate(e.target.value); const matches = sessions.filter(s => s.session_date === e.target.value); setSessionId(matches.length === 1 ? matches[0].id : ''); setContext(''); setNotice(''); setQuickStates({}) }}><option value="">選擇日期</option>{dates.map(d => <option key={d}>{d}</option>)}</select></label>
      <label>上課場次<select value={session?.id || ''} disabled={!date} onChange={e => { setSessionId(e.target.value); setContext(''); setNotice(''); setQuickStates({}) }}><option value="">選擇上課場次</option>{sessions.filter(s => s.session_date === date).map(s => <option key={s.id} value={s.id}>{s.session_number ? `第 ${s.session_number} 次上課` : '場次未編號'}{s.starts_at ? ` · ${s.starts_at}` : ''}{s.topic ? ` · ${s.topic}` : ''}</option>)}</select></label>
    </div>
    {!session ? <p className="empty-state">{course && !sessions.length ? '這個班級尚未建立上課紀錄。請先到「班級」開始一堂課。' : '選好上課場次後，這裡會列出每位學生，包括回答 0 次的學生。'}</p> : <>
      <div className="participation-toolbar"><h2>{course?.code} · {date} · {sessionLabel}</h2><button className="secondary-button" onClick={exportTable}>匯出 CSV（Excel 可開啟）</button></div>
      <p>{rows.length} 名學生 · 總回答 {rows.reduce((sum, r) => sum + r.total, 0)} 次</p>
      <p className="field-help">抽問工具按「記錄回答」後會自動累計；未回答及撤銷紀錄不計入。<a href="https://classroom-randomizer-opal.vercel.app" target="_blank" rel="noreferrer">開啟課堂抽問 ↗</a></p>
      <label>新增自願發言的教材課次<select value={selectedContext} onChange={e => setContext(e.target.value)}><option value="">選擇本次發言的課次</option>{contextOptions.map(c => <option key={c} value={c}>{c.split(':')[0] === 'boya-quasi-intermediate-i' ? '準中級加速篇 I' : '中級衝刺篇 I'} · 第 {Number(c.split('lesson-')[1])} 課</option>)}</select></label>
      {!selectedContext && <p className="field-help" role="status">只有記錄「自願發言」時需要選教材課次；表格內的 ＋／− 可直接快速調整回答次數。</p>}
      <div className="quick-adjustment-guide" role="note"><strong>快速調整回答次數</strong><span>＋新增一筆快速調整；−更正最近一筆有效回答。每次操作會立即保存，並保留原始紀錄與更正原因。</span></div>
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      <label>找學生<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="姓名、原名或學號末四位" /></label>
      <div className="participation-table-wrap"><table className="participation-table"><caption>本堂課每位學生的回答紀錄</caption><thead><tr>{['學號末四位', '姓名', '抽問回答', '自願發言', '總回答次數', '快速調整', '明細'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{visibleRows.map(r => {
        const quickState = quickStates[r.student.id]
        const disabled = busy || r.enrollment.status !== 'active'
        return <tr key={r.student.id}><td>{studentCodeLastFour(r.student.student_code)}</td><th scope="row">{r.student.chinese_name}<small>{r.student.original_name}</small></th><td>{r.random}</td><td>{r.voluntary}</td><td className="participation-total-cell"><strong>{r.total}</strong><small className="manual-adjustment-count">快速調整 {r.manual} 次</small></td><td className="quick-adjustment-cell"><div className="quick-adjustment-controls" aria-label={`${r.student.chinese_name}的回答次數快速調整`}><button type="button" className="quick-adjustment-button" disabled={disabled || r.total === 0} onClick={() => void adjustAnswerCount(r, -1)} aria-label={`${r.student.chinese_name}減少一次回答`} title="更正最近一筆有效回答">−</button><button type="button" className="quick-adjustment-button plus" disabled={disabled} onClick={() => void adjustAnswerCount(r, 1)} aria-label={`${r.student.chinese_name}增加一次回答`} title="新增一筆快速調整">＋</button></div>{quickState && <span className={`quick-adjustment-status ${quickState.status}`} role={quickState.status === 'error' ? 'alert' : 'status'} aria-live="polite">{quickState.message}</span>}</td><td><button className="secondary-button compact" disabled={busy || !selectedContext || r.enrollment.status !== 'active'} onClick={() => void addVoluntaryAnswer(r.student.id, r.student.chinese_name)} aria-label={`${r.student.chinese_name}自願發言加一次`}>自願發言 +1</button><Link className="text-button" to={`/students/${r.student.id}?course=${encodeURIComponent(courseId)}`}>查看明細</Link></td></tr>
      })}</tbody></table></div>
      <p className="field-help">「−」不會刪除回答，而是把最近一筆有效回答標記為更正；需要查看來源或修改原因時，再開啟學生明細。</p>
    </>}
  </div>
}
