import type { TrackerSnapshot } from '../types'

export function participationRows(snapshot: TrackerSnapshot, courseId: string, sessionId: string) {
  const attempts = snapshot.attempts.filter(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === sessionId)
  // A legacy mirror is the same answer, even when the original was withdrawn.
  const mirrored = new Set(snapshot.attempts.filter(a => a.course_id === courseId).map(a => a.client_attempt_id))
  const events = snapshot.learningEvents.filter(e => e.course_id === courseId && e.session_id === sessionId
    && (!e.client_event_id || !mirrored.has(e.client_event_id)) && e.record_status !== 'voided' && e.record_status !== 'corrected'
    && e.counted_for_summary !== false
    && !['no_response', 'declined', 'unobserved'].includes(e.response_status || '')
    && e.source !== 'class_observation')
  const seen = new Set<string>()
  const answers = attempts.filter(a => {
    if (seen.has(a.client_attempt_id)) return false
    seen.add(a.client_attempt_id)
    return a.outcome === 'answered' && a.record_status !== 'voided' && a.record_status !== 'corrected'
  })
  return snapshot.enrollments.filter(e => e.course_id === courseId)
    .sort((a, b) => (a.seat_number ?? 999) - (b.seat_number ?? 999))
    .flatMap(enrollment => {
      const student = snapshot.students.find(s => s.id === enrollment.student_id)
      if (!student) return []
      const own = answers.filter(a => a.student_id === student.id || (!a.student_id && a.student_code === student.student_code))
      const manual = events.filter(e => e.student_id === student.id)
      const random = own.filter(a => a.selection_method === 'random').length + manual.filter(e => e.source === 'random_call').length
      const voluntary = own.filter(a => a.selection_method === 'volunteer').length + manual.filter(e => e.source === 'voluntary_answer').length
      return [{ enrollment, student, random, voluntary, total: random + voluntary }]
    })
}
