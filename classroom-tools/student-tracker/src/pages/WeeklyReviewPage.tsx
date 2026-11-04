import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { localWeek, validReviewRange, weeklyReview, weeklyReviewExport, sessionReviewLink } from '../utils/weeklyReview'

function download(body: string, filename: string, format: string) {
  const url = URL.createObjectURL(new Blob([body], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function AdjustmentDraft({ storageKey, onDraft }: { storageKey: string; onDraft: (value: string) => void }) {
  const [draft, setDraft] = useState(() => { try { return localStorage.getItem(storageKey) || '' } catch { return '' } })
  const [notice, setNotice] = useState('')
  useEffect(() => { onDraft(draft) }, [draft, onDraft])
  return <section className="panel settings-section"><h2>下週調整草稿</h2><p className="field-help">寫下要調整的活動、做法與要觀察的結果。草稿依班級與回顧日期保存在此裝置，不會改寫課堂反思或建立待辦；匯出時會一併保留。</p>
    <label>下週打算怎麼調整<textarea rows={5} value={draft} onChange={e => { setDraft(e.target.value); setNotice('尚未儲存') }} /></label>
    <button className="secondary-button" onClick={() => { try { localStorage.setItem(storageKey, draft); setNotice('已儲存在此裝置') } catch { setNotice('此裝置無法儲存，請匯出保留草稿。') } }}>儲存草稿</button><p role="status">{notice}</p>
  </section>
}
export function WeeklyReviewPage() {
  const { snapshot, mode, lastRefreshed } = useTracker()
  const [courseId, setCourseId] = useState(snapshot.courses[0]?.id || '')
  const [range, setRange] = useState(localWeek)
  const [draft, setDraft] = useState('')
  useEffect(() => { if (!courseId && snapshot.courses[0]) setCourseId(snapshot.courses[0].id) }, [courseId, snapshot.courses])
  const course = snapshot.courses.find(c => c.id === courseId)
  const valid = validReviewRange(range.from, range.to)
  const review = weeklyReview(snapshot, courseId, range.from, range.to)
  const draftKey = `keji-weekly-draft:${mode}:${course?.owner_id || ''}:${courseId}:${range.from}:${range.to}`
  const exportReview = (format: 'md' | 'csv') => download(weeklyReviewExport(review, course?.name || '未選班級', range.from, range.to, draft, format, window.location.origin), `教學回顧-${range.from}-${range.to}.${format}`, format)
  return <div className="page analysis-page weekly-review-page">
    <header className="page-heading"><p className="eyebrow">從課堂紀錄回顧教學</p><h1>每週教學回顧</h1><p>選擇班級與日期，核對進度、回答紀錄、教師反思及未完成待辦，再寫下下週調整。</p></header>
    <section className="panel filter-panel">
      <label>班級<select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">選擇班級</option>{snapshot.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>開始日期<input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></label>
      <label>結束日期<input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></label>
      <button className="secondary-button" onClick={() => setRange(localWeek())}>本週（週一至週日）</button>
    </section>
    <p className="field-help">日期依越南時間；預設本週。資料更新：{lastRefreshed ? new Date(lastRefreshed).toLocaleString('zh-TW', { timeZone: 'Asia/Ho_Chi_Minh' }) : '尚未載入'}。{mode === 'demo' ? '目前使用範例資料。' : ''}</p>
    {!valid ? <p role="alert">請輸入有效日期，結束日期須在開始日期之後或同一天。</p> : !course ? <p>請先選擇班級。</p> : <>
      <div className="export-actions"><button className="secondary-button" onClick={() => exportReview('md')}>匯出 Markdown</button><button className="secondary-button" onClick={() => exportReview('csv')}>匯出 CSV</button></div>
      <section className="panel settings-section"><h2>本期紀錄</h2><div className="participation-metrics">
        <div><strong>{review.sessions.length}</strong><span>場已登記課堂（{review.sessions.filter(s => s.status === 'completed').length} 場已結束）</span></div>
        <div><strong>{review.answeredStudents} / {review.denominator}</strong><span>目前有效修課學生有回答紀錄</span></div>
        <div><strong>{review.answers}</strong><span>次有效回答紀錄</span></div>
      </div><p className="field-help">回答覆蓋以目前可辨識的有效修課學生為分母，非歷史名冊。已更正、撤銷與重複鏡像不計入；回答次數不代表能力或成績。{review.unmatchedAnswers} 次回答不屬於目前名冊；{review.rosterMissing} 筆修課缺少學生資料。</p>
      <p>出席記錄覆蓋：{review.attendanceCoverage} / {review.attendanceDenominator} 筆學生×場次已確認。未確認或沒有出席紀錄不推定為出席或缺席。</p></section>
      <section className="panel settings-section"><h2>實際進度與教師反思</h2>{!review.sessions.length && <p>此範圍沒有已登記的課堂；無法判斷實際教學進度。</p>}{review.sessions.map(s => <article className="weekly-source" key={s.id}>
        <h3><Link to={`/sessions/${encodeURIComponent(s.id)}`}>{s.session_date} · {s.topic || '未記錄主題'}{s.session_number ? ` · 第 ${s.session_number} 次` : ''}</Link></h3><p>{s.status === 'completed' ? '已結束' : '尚未結束'}</p>
        <dl>{([['progress_text', '實際進度'], ['common_difficulty', '共同問題'], ['what_worked', '有效做法'], ['next_adjustment', '原課堂調整']] as const).map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{s[field] || '教師尚未記錄'}</dd></div>)}</dl>
        <Link to={sessionReviewLink(courseId, s.session_date, s.id)}>查看這場的回答原始紀錄</Link>
      </article>)}<p className="field-help">共同問題與反思只呈現教師明確寫下的內容。</p></section>
      <section className="panel settings-section"><h2>學生回答與缺席紀錄</h2><p className="field-help">零回答只表示沒有有效回答紀錄。缺席欄僅計入明確登記為缺席的場次。</p>
      <div className="participation-table-wrap"><table className="participation-table"><thead><tr><th scope="col">學生</th><th scope="col">回答次數</th><th scope="col">記錄缺席場數</th><th scope="col">回答來源課堂</th></tr></thead><tbody>{review.rows.map(r => <tr key={r.student.id}><td><Link to={`/students/${encodeURIComponent(r.student.id)}`}>{r.student.chinese_name}</Link></td><td>{r.answers === 0 ? '零回答紀錄' : r.answers}</td><td>{r.absent}</td><td>{r.sessionIds.map(id => { const s = review.sessions.find(s => s.id === id)!; return <Link className="weekly-session-link" key={id} to={sessionReviewLink(courseId, s.session_date, id)}>{s.session_date}{s.session_number ? `（第 ${s.session_number} 次）` : ''}</Link> })}</td></tr>)}</tbody></table></div>{!review.denominator && <p>沒有可辨識的有效修課名冊，無法計算學生覆蓋率。</p>}</section>
      <section className="panel settings-section"><h2>未完成待辦（{review.followups.length}）</h2><p className="field-help">列出此班目前全部未完成待辦，包含所選日期以外及未設日期者。</p>{review.followups.length ? <ul>{review.followups.map(f => <li key={f.id}><Link to={`/followups#followup-${encodeURIComponent(f.id)}`}>{f.title}</Link> · {f.due_on || '未設日期'}{f.student_id && <> · <Link to={`/students/${encodeURIComponent(f.student_id)}`}>{snapshot.students.find(s => s.id === f.student_id)?.chinese_name || '學生資料未載入'}</Link></>}{f.session_id && <> · <Link to={`/sessions/${encodeURIComponent(f.session_id)}`}>來源課堂</Link></>}</li>)}</ul> : <p>此班目前沒有未完成待辦。</p>}</section>
      <AdjustmentDraft key={draftKey} storageKey={draftKey} onDraft={setDraft} />
    </>}
  </div>
}
