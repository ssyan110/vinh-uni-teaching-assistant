import type { TrackerSnapshot } from '../types'

export function filterAttendanceExceptions(snapshot: TrackerSnapshot, filters: { courseId?: string; sessionId?: string; studentId?: string; from?: string; to?: string; status?: string }) {
  return (snapshot.attendanceExceptions ?? []).filter(r => {
    const session = snapshot.sessions.find(s => s.id === r.session_id)
    return session && (!filters.courseId || session.course_id === filters.courseId) && (!filters.sessionId || r.session_id === filters.sessionId) && (!filters.studentId || r.student_id === filters.studentId) && (!filters.from || session.session_date >= filters.from) && (!filters.to || session.session_date <= filters.to) && (!filters.status || filters.status === 'all' || (filters.status === 'unverified' ? r.official_status === 'unverified' : r.makeup_status === filters.status))
  }).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}
