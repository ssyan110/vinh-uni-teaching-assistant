import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useTracker } from '../state/TrackerContext'
import { todayIso } from '../data/repository'

type Filter = 'open' | 'completed'

function dueLabel(date: string | null) {
  if (!date) return '未設日期'
  const today = todayIso()
  if (date < today) return `已逾期 · ${date}`
  if (date === today) return '今天'
  return date
}

export function FollowupsPage() {
  const { snapshot, setFollowupStatus, busy } = useTracker()
  const [filter, setFilter] = useState<Filter>('open')
  const { hash } = useLocation()
  const [params, setParams] = useSearchParams()
  const courseId = params.get('course') || ''
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'center' }) })
    return () => cancelAnimationFrame(frame)
  }, [hash, snapshot.followups, filter, courseId])
  const items = snapshot.followups.filter((item) => item.status === filter && (!courseId || item.course_id === courseId)).sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999'))

  return (
    <div className="page">
      <header className="page-heading split-heading"><div><p className="eyebrow">不讓口頭承諾消失</p><h1>待辦</h1><p>只保留再觀察、提醒與補做。處理完就劃掉。</p></div><div className="headline-count"><strong>{snapshot.followups.filter((item) => item.status === 'open' && (!courseId || item.course_id === courseId)).length}</strong><span>未完成</span></div></header>
      <section className="panel filter-panel"><label>查看班級<select value={courseId} onChange={e => setParams(e.target.value ? { course: e.target.value } : {})}><option value="">全部班級</option>{snapshot.courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label></section>
      <div className="filter-tabs"><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>待處理</button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>已完成</button></div>
      <section className="panel followup-list-panel">
        {items.length ? <div className="followup-list">{items.map((item) => {
          const student = snapshot.students.find((entry) => entry.id === item.student_id)
          const course = snapshot.courses.find((entry) => entry.id === item.course_id)
          const overdue = filter === 'open' && item.due_on && item.due_on < todayIso()
          return <article className="followup-row" id={`followup-${item.id}`} key={item.id}>
            <button type="button" className={filter === 'completed' ? 'check-button checked' : 'check-button'} disabled={busy} onClick={() => setFollowupStatus(item.id, filter === 'open' ? 'completed' : 'open')} aria-label={filter === 'open' ? '標記完成' : '恢復待辦'}>{filter === 'completed' ? '✓' : ''}</button>
            <div className="followup-body"><div><StatusPill value={item.kind} /><span className={overdue ? 'due-date overdue' : 'due-date'}>{dueLabel(item.due_on)}</span></div><h2>{item.title}</h2><p>{course?.name ?? '未分類課程'}{student && <> · <Link to={`/students/${student.id}?course=${encodeURIComponent(item.course_id)}`}>{student.chinese_name}</Link></>}</p></div>
          </article>
        })}</div> : <div className="large-empty"><span>清</span><h2>{filter === 'open' ? '目前沒有待辦' : '還沒有完成紀錄'}</h2><p>{filter === 'open' ? '需要再看一次的學生，可以在課堂工作台直接加入。' : '完成待辦後會保留在這裡。'}</p></div>}
      </section>
    </div>
  )
}
