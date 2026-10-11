import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
import { SessionPage } from './pages/SessionPage'
import { StudentsPage } from './pages/StudentsPage'
import { StudentDetailPage } from './pages/StudentDetailPage'
import { FollowupsPage } from './pages/FollowupsPage'
import { MorePage } from './pages/MorePage'
import { ParticipationPage } from './pages/ParticipationPage'
import { WeeklyReviewPage } from './pages/WeeklyReviewPage'
import { AttendancePage } from './pages/AttendancePage'
import { useTracker } from './state/TrackerContext'

export function App() {
  const { access } = useTracker()
  const location = useLocation()

  if (access === 'checking') return <LoginPage />

  if (access === 'signed_out') return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage key={location.pathname} />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/participation" element={<ParticipationPage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage key={location.pathname} />} />
        <Route path="/followups" element={<FollowupsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  )
}
