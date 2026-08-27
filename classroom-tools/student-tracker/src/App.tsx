import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
import { SessionPage } from './pages/SessionPage'
import { StudentsPage } from './pages/StudentsPage'
import { StudentDetailPage } from './pages/StudentDetailPage'
import { FollowupsPage } from './pages/FollowupsPage'
import { MorePage } from './pages/MorePage'
import { useTracker } from './state/TrackerContext'

export function App() {
  const { access } = useTracker()

  if (access === 'checking') {
    return <div className="app-loading" aria-live="polite"><span className="loading-mark">課</span><p>正在整理今天的課堂…</p></div>
  }

  if (access === 'signed_out') return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/followups" element={<FollowupsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  )
}
