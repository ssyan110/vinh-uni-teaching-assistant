import type { ClassSession, RandomizerAttempt, TrackerSnapshot } from '../types'
import { includedInSummary } from './learningEvents'

export function isAnsweredAttempt(attempt: RandomizerAttempt) {
  // Raw answer counts do not depend on the legacy assessment-summary flag.
  return attempt.outcome === 'answered' && attempt.record_status !== 'voided' && attempt.record_status !== 'corrected'
}

export function compareSessions(a: ClassSession, b: ClassSession) {
  return b.session_date.localeCompare(a.session_date)
    || (b.session_number ?? 0) - (a.session_number ?? 0)
    || (b.created_at ?? '').localeCompare(a.created_at ?? '')
    || b.id.localeCompare(a.id)
}

export function latestParticipationSession(snapshot: TrackerSnapshot, courseId: string) {
  return snapshot.sessions.filter(session => session.course_id === courseId && (
    session.status === 'completed'
    || snapshot.attempts.some(attempt => attempt.course_id === courseId && attempt.randomizer_sessions?.class_session_id === session.id)
    || snapshot.learningEvents.some(event => event.course_id === courseId && event.session_id === session.id)
    || snapshot.attendance.some(record => record.session_id === session.id)
    || snapshot.observations.some(record => record.session_id === session.id)
    || snapshot.attendanceExceptions?.some(record => record.session_id === session.id)
    || [session.class_status, session.progress_text, session.what_worked, session.common_difficulty, session.next_adjustment].some(Boolean)
  )).sort(compareSessions)[0]
}

export type ParticipationRecord = {
  recordType: 'randomizer_attempt' | 'learning_event'
  recordId: string
  studentId: string | null
  studentCode: string | null
  occurredAt: string
  source: 'random' | 'voluntary' | 'teacher' | 'manual'
}

export function participationRecords(snapshot: TrackerSnapshot, courseId: string, sessionId: string): ParticipationRecord[] {
  const attempts = snapshot.attempts.filter(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === sessionId)
  // A legacy mirror is the same answer, even when the original was withdrawn.
  const mirrored = new Set(snapshot.attempts.filter(a => a.course_id === courseId).map(a => a.client_attempt_id))
  const events = snapshot.learningEvents.filter(e => e.course_id === courseId && e.session_id === sessionId
    && (!e.client_event_id || !mirrored.has(e.client_event_id)) && includedInSummary(e)
    && e.source !== 'class_observation')
  const seen = new Set<string>()
  const answerAttempts = attempts.filter(a => {
    if (seen.has(a.client_attempt_id)) return false
    seen.add(a.client_attempt_id)
    return isAnsweredAttempt(a)
  })
  const attemptRecords: ParticipationRecord[] = answerAttempts.map(a => ({
    recordType: 'randomizer_attempt',
    recordId: a.id,
    studentId: a.student_id,
    studentCode: a.student_code || null,
    occurredAt: a.completed_at || a.drawn_at || '',
    source: a.selection_method === 'volunteer' ? 'voluntary' : a.selection_method === 'teacher' ? 'teacher' : 'random',
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
      const teacher = own.filter(record => record.source === 'teacher').length
      const manual = own.filter(record => record.source === 'manual').length
      return [{ enrollment, student, random, voluntary, teacher, manual, total: own.length }]
    })
}
