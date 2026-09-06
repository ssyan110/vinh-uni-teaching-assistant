import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'
import { Icon } from './Icon'

const navigation = [
  { to: '/today', label: '今日', mark: 'house' },
  { to: '/students', label: '學生', mark: 'users' },
  { to: '/outcomes', label: '成效', mark: 'chart-no-axes-combined' },
  { to: '/followups', label: '待辦', mark: 'clipboard-check' },
  { to: '/more', label: '更多', mark: 'settings' },
]

export function AppShell() {
  const { snapshot, busy, error, clearError, mode } = useTracker()
  const location = useLocation()
  const openFollowups = snapshot.followups.filter((item) => item.status === 'open').length

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <NavLink to="/today" className="brand" aria-label="荣市大学_学生管理系统首页">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
          <span><strong>荣市大学</strong><small>学生管理系统</small></span>
        </NavLink>
        <nav className="side-nav" aria-label="主要導覽">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-mark"><Icon name={item.mark} /></span><span>{item.label}</span>
              {item.to === '/followups' && openFollowups > 0 && <span className="nav-count">{openFollowups}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-summary">
          <span>{snapshot.students.length}</span>
          <small>名學生 · {snapshot.courses.length} 門課</small>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
      <div className="mobile-brand"><img className="brand-logo small" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" /><strong>荣市大学</strong></div>
          <div className="save-state" aria-live="polite">
            <span className={busy ? 'state-dot saving' : 'state-dot'} />
            {busy ? '儲存中' : mode === 'demo' ? '範例資料' : '已儲存'}
          </div>
        </header>

        {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={clearError}>關閉</button></div>}
        <main className={location.pathname.startsWith('/sessions/') ? 'content session-content' : 'content'}>
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="手機主要導覽">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'bottom-item active' : 'bottom-item'}>
            <Icon name={item.mark} /><small>{item.label}</small>
            {item.to === '/followups' && openFollowups > 0 && <i>{Math.min(openFollowups, 9)}</i>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
