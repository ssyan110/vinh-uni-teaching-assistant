import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useTracker } from '../state/TrackerContext'

type Filter = 'open' | 'completed'

function dueLabel(date: string | null) {
  if (!date) return '未設日期'
  const today = new Date().toISOString().slice(0, 10)
  if (date < today) return `已逾期 · ${date}`
  if (date === today) return '今天'
  return date
}

export function FollowupsPage() {
  const { snapshot, setFollowupStatus, busy } = useTracker()
  const [filter, setFilter] = useState<Filter>('open')
  const items = snapshot.followups.filter((item) => item.status === filter).sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999'))

  return (
    <div className="page">
      <header className="page-heading split-heading"><div><p className="eyebrow">不讓口頭承諾消失</p><h1>待辦</h1><p>只保留再觀察、提醒與補做。處理完就劃掉。</p></div><div className="headline-count"><strong>{snapshot.followups.filter((item) => item.status === 'open').length}</strong><span>未完成</span></div></header>
      <div className="filter-tabs"><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>待處理</button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>已完成</button></div>
      <section className="panel followup-list-panel">
        {items.length ? <div className="followup-list">{items.map((item) => {
          const student = snapshot.students.find((entry) => entry.id === item.student_id)
          const course = snapshot.courses.find((entry) => entry.id === item.course_id)
          const overdue = filter === 'open' && item.due_on && item.due_on < new Date().toISOString().slice(0, 10)
          return <article className="followup-row" key={item.id}>
            <button type="button" className={filter === 'completed' ? 'check-button checked' : 'check-button'} disabled={busy} onClick={() => setFollowupStatus(item.id, filter === 'open' ? 'completed' : 'open')} aria-label={filter === 'open' ? '標記完成' : '恢復待辦'}>{filter === 'completed' ? '✓' : ''}</button>
            <div className="followup-body"><div><StatusPill value={item.kind} /><span className={overdue ? 'due-date overdue' : 'due-date'}>{dueLabel(item.due_on)}</span></div><h2>{item.title}</h2><p>{course?.name ?? '未分類課程'}{student && <> · <Link to={`/students/${student.id}`}>{student.chinese_name}</Link></>}</p></div>
          </article>
        })}</div> : <div className="large-empty"><span>清</span><h2>{filter === 'open' ? '目前沒有待辦' : '還沒有完成紀錄'}</h2><p>{filter === 'open' ? '需要再看一次的學生，可以在課堂工作台直接加入。' : '完成待辦後會保留在這裡。'}</p></div>}
      </section>
    </div>
  )
}
