import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
import { SessionPage } from './pages/SessionPage'
import { StudentsPage } from './pages/StudentsPage'
import { StudentDetailPage } from './pages/StudentDetailPage'
import { FollowupsPage } from './pages/FollowupsPage'
import { MorePage } from './pages/MorePage'
import { OutcomesPage } from './pages/OutcomesPage'
import { useTracker } from './state/TrackerContext'

export function App() {
  const { access } = useTracker()

  if (access === 'checking') return <LoginPage />

  if (access === 'signed_out') return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/outcomes" element={<OutcomesPage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/followups" element={<FollowupsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  )
}
