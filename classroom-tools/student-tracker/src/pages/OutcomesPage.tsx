import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useState, type FormEvent } from 'react'
import { useTracker } from '../state/TrackerContext'
import type { LearningEventSource } from '../types'

const dimensions = [
  ['task_completion', '完成任務'], ['comprehensibility', '表達清楚'],
  ['language_control', '語言運用'], ['interaction', '互動回應'],
] as const

const sourceLabel = { class_observation: '課堂觀察', random_call: '隨機抽問', voluntary_answer: '自願發言' }

export function OutcomesPage() {
  const { snapshot, saveLearningEvent, startSession, busy } = useTracker()
  const [courseId, setCourseId] = useState(snapshot.courses[0]?.id ?? '')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [source, setSource] = useState<LearningEventSource>('class_observation')
  const [scores, setScores] = useState({ task_completion: 2, comprehensibility: 2, language_control: 2, interaction: 2 })
  const [saved, setSaved] = useState(false)
  const [lesson, setLesson] = useState('lesson-01')
  const [textbook, setTextbook] = useState('boya-quasi-intermediate-i')
  const [activity, setActivity] = useState('口語練習')
  const course = snapshot.courses.find((item) => item.id === courseId)
  const enrollments = snapshot.enrollments.filter((item) => item.course_id === courseId && item.status === 'active')
  const roster = enrollments.flatMap((entry) => {
    const student = snapshot.students.find((item) => item.id === entry.student_id)
    return student ? [[student.id, student.chinese_name, String(entry.seat_number ?? '')] as const] : []
  })
  const events = snapshot.learningEvents.filter((item) => item.course_id === courseId).sort((a,b) => b.occurred_at.localeCompare(a.occurred_at))
  const observedIds = new Set(events.map((item) => item.student_id))
  const openFollowups = snapshot.followups.filter((item) => item.course_id === courseId && item.status === 'open')
  const reviewIds = new Set([...events.filter((item) => item.needs_review).map((item) => item.student_id), ...openFollowups.map((item) => item.student_id).filter(Boolean) as string[]])
  const average = (key: typeof dimensions[number][0]) => {
    const values = events.map((item) => item[key]).filter((value): value is number => value !== null)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  }
  const studentName = (id: string) => snapshot.students.find((item) => item.id === id)?.chinese_name ?? '未命名學生'
  const recentSession = snapshot.sessions.filter((item) => item.course_id === courseId && item.status === 'completed').sort((a,b) => b.session_date.localeCompare(a.session_date))[0]
  const saveRecord = async (event: FormEvent) => {
    event.preventDefault()
    if (!roster.some(([id]) => id === selectedStudent)) return
    try {
      const sessionId = await startSession(courseId)
      await saveLearningEvent({ course_id: courseId, session_id: sessionId, student_id: selectedStudent, source, textbook_id: textbook, lesson_id: lesson, lesson_label: `第 ${Number(lesson.slice(-2))} 課`, activity_label: activity.trim(), ...scores, needs_review: Object.values(scores).some((value) => value <= 1) })
    } catch { return }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return <div className="page outcomes-page">
    <header className="page-heading split-heading">
      <div><p className="eyebrow">學習成效</p><h1>從這堂課，看見下一步</h1><p>把課堂觀察、隨機抽問與自願發言放在同一條學習歷程中。</p></div>
      <label className="course-picker">查看班級<select value={courseId} onChange={(event) => { setCourseId(event.target.value); setSelectedStudent(''); setSaved(false) }}>{snapshot.courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </header>

    <section className="flow-strip" aria-label="教師使用流程">
      <div><b>課前</b><span>看上次卡點與關注學生</span></div><i>→</i><div><b>課堂</b><span>記錄真實表現與出席</span></div><i>→</i><div><b>課後</b><span>確認趨勢並安排重做</span></div>
    </section>

      <div className="outcome-metrics">
      <div><span>全班學生</span><strong>{enrollments.length}</strong><small>{course?.code ?? '—'}</small></div>
      <div><span>已有表現紀錄</span><strong>{observedIds.size}</strong><small>覆蓋 {enrollments.length ? Math.round(observedIds.size / enrollments.length * 100) : 0}%</small></div>
      <div><span>最近學習事件</span><strong>{events.length}</strong><small>含三種課堂來源</small></div>
      <div className="attention"><span>需要關注</span><strong>{reviewIds.size}</strong><small>待再次觀察或補做</small></div>
      </div>

    <section className="panel record-entry-panel"><div className="panel-heading"><div><p className="section-kicker">課堂中隨手記</p><h2>新增一筆學習表現</h2></div><span>選學生 → 記表現 → 儲存</span></div>
      <form className="record-entry-form" onSubmit={saveRecord}>
        <label>教材<select value={textbook} onChange={(event) => {setTextbook(event.target.value); setLesson('lesson-01')}}><option value="boya-quasi-intermediate-i">準中級加速篇 I</option><option value="boya-intermediate-i">中級衝刺篇 I</option></select></label>
        <label>課次<select value={lesson} onChange={(event) => setLesson(event.target.value)}>{Array.from({length:textbook === 'boya-quasi-intermediate-i' ? 12 : 8},(_,i) => <option key={i} value={`lesson-${String(i+1).padStart(2,'0')}`}>第 {i+1} 課</option>)}</select></label>
        <label>活動<input required maxLength={300} value={activity} onChange={(event) => setActivity(event.target.value)} /></label>
        <label>學生<select required value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="">選擇學生</option>{roster.map(([code, name, seat]) => <option key={code} value={code}>{seat} 號　{name}</option>)}</select></label>
        <label>來源<select value={source} onChange={(event) => setSource(event.target.value as LearningEventSource)}><option value="class_observation">課堂觀察</option><option value="random_call">隨機抽問</option><option value="voluntary_answer">自願發言</option></select></label>
        {dimensions.map(([key, label]) => <label key={key}>{label}<select value={scores[key]} onChange={(event) => setScores((current) => ({ ...current, [key]: Number(event.target.value) }))}><option value="3">3　獨立完成</option><option value="2">2　大致完成</option><option value="1">1　需要協助</option><option value="0">0　尚未展現</option></select></label>)}
        <button className="primary-button compact" disabled={busy || !selectedStudent || !activity.trim()}><Icon name="save" />儲存紀錄</button>
      </form>
      <p className="field-help">紀錄會存入目前進行中的課堂；尚未開課時會建立今天的課堂。</p>
      {saved && <p className="success-message" role="status">已保存這筆學習表現。</p>}
      <div className="shared-roster"><div className="shared-roster-heading"><span>本班學生</span><small>點姓名快速選擇 · {roster.length} 人</small></div><div className="shared-roster-list">{roster.map(([code, name, seat]) => <button type="button" className={selectedStudent === code ? 'selected' : ''} key={code} onClick={() => setSelectedStudent(code)}><b>{seat}</b><span>{name}</span></button>)}</div></div>
    </section>

    <div className="outcomes-grid">
      <section className="panel ability-panel"><div className="panel-heading"><div><p className="section-kicker">全班能力輪廓</p><h2>四個表現面向</h2></div><span>0–3 分</span></div>
        <div className="ability-list">{dimensions.map(([key,label]) => { const value=average(key); return <div className="ability-row" key={key}><div><strong>{label}</strong><span>{value === null ? '—' : value.toFixed(1)}</span></div><div className="ability-track"><i style={{width:`${(value ?? 0)/3*100}%`}} /></div></div> })}</div>
      </section>
      <section className="panel teaching-panel"><div className="panel-heading"><div><p className="section-kicker">課後整理</p><h2>下一堂怎麼教</h2></div></div>
        <div className="teaching-note"><span>共同卡點</span><strong>{recentSession?.common_difficulty || '完成課堂整理後會顯示在這裡'}</strong></div>
        <div className="teaching-note next"><span>建議調整</span><strong>{recentSession?.next_adjustment || '先累積一堂課的觀察再決定'}</strong></div>
      </section>
    </div>

    <div className="outcomes-grid lower">
      <section className="panel"><div className="panel-heading"><div><p className="section-kicker">需要先看</p><h2>關注名單</h2></div><span>{reviewIds.size} 人</span></div>
        {reviewIds.size ? <div className="attention-list">{[...reviewIds].map((id) => <Link to={`/students/${id}`} key={id}><span className="mini-avatar">{studentName(id).slice(-1)}</span><div><strong>{studentName(id)}</strong><small>{openFollowups.find((item) => item.student_id === id)?.title ?? '下次再觀察一次課堂表現'}</small></div><b>查看 →</b></Link>)}</div> : <div className="quiet-empty">目前沒有需要特別關注的學生。</div>}
      </section>
      <section className="panel"><div className="panel-heading"><div><p className="section-kicker">最近發生</p><h2>學習事件</h2></div><span>{events.length} 筆</span></div>
        {events.length ? <div className="event-list">{events.slice(0,6).map((event) => <div key={event.id}><time>{new Date(event.occurred_at).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}</time><span className={`event-source ${event.source}`}>{sourceLabel[event.source]}</span><div><strong>{studentName(event.student_id)}</strong><small>{event.lesson_label} · {event.activity_label}</small></div><b>{event.task_completion ?? '—'} / 3</b></div>)}</div> : <div className="quiet-empty">這個班級還沒有學習事件。</div>}
      </section>
    </div>
  </div>
}
