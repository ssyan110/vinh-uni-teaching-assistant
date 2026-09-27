import type { TrackerSnapshot } from '../types'

export type ParticipationRecord = {
  recordType: 'randomizer_attempt' | 'learning_event'
  recordId: string
  studentId: string | null
  studentCode: string | null
  occurredAt: string
  source: 'random' | 'voluntary' | 'manual'
}

export function participationRecords(snapshot: TrackerSnapshot, courseId: string, sessionId: string): ParticipationRecord[] {
  const attempts = snapshot.attempts.filter(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === sessionId)
  // A legacy mirror is the same answer, even when the original was withdrawn.
  const mirrored = new Set(snapshot.attempts.filter(a => a.course_id === courseId).map(a => a.client_attempt_id))
  const events = snapshot.learningEvents.filter(e => e.course_id === courseId && e.session_id === sessionId
    && (!e.client_event_id || !mirrored.has(e.client_event_id)) && e.record_status !== 'voided' && e.record_status !== 'corrected'
    && e.counted_for_summary !== false
    && !['no_response', 'declined', 'unobserved'].includes(e.response_status || '')
    && e.source !== 'class_observation')
  const seen = new Set<string>()
  const answerAttempts = attempts.filter(a => {
    if (seen.has(a.client_attempt_id)) return false
    seen.add(a.client_attempt_id)
    return a.outcome === 'answered' && a.record_status !== 'voided' && a.record_status !== 'corrected'
  })
  const attemptRecords: ParticipationRecord[] = answerAttempts.map(a => ({
    recordType: 'randomizer_attempt',
    recordId: a.id,
    studentId: a.student_id,
    studentCode: a.student_code || null,
    occurredAt: a.completed_at || a.drawn_at || '',
    source: a.selection_method === 'volunteer' ? 'voluntary' : 'random',
  }))
  const eventRecords: ParticipationRecord[] = events.map(e => ({
    recordType: 'learning_event',
    recordId: e.id,
    studentId: e.student_id,
    studentCode: snapshot.students.find(s => s.id === e.student_id)?.student_code || null,
    occurredAt: e.occurred_at,
    source: e.source === 'manual_adjustment' ? 'manual' : e.source === 'voluntary_answer' ? 'voluntary' : 'random',
  }))
  return [...attemptRecords, ...eventRecords].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt) || b.recordId.localeCompare(a.recordId))
}

export function participationRows(snapshot: TrackerSnapshot, courseId: string, sessionId: string) {
  const records = participationRecords(snapshot, courseId, sessionId)
  return snapshot.enrollments.filter(e => e.course_id === courseId)
    .sort((a, b) => (a.seat_number ?? 999) - (b.seat_number ?? 999))
    .flatMap(enrollment => {
      const student = snapshot.students.find(s => s.id === enrollment.student_id)
      if (!student) return []
      const own = records.filter(record => record.studentId === student.id || (!record.studentId && record.studentCode === student.student_code))
      const random = own.filter(record => record.source === 'random').length
      const voluntary = own.filter(record => record.source === 'voluntary').length
      const manual = own.filter(record => record.source === 'manual').length
      return [{ enrollment, student, random, voluntary, manual, total: own.length }]
    })
}
