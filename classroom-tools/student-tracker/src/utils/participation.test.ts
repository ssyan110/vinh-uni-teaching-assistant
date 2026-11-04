import { expect, test } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { ClassSession, RandomizerAttempt } from '../types'
import { latestParticipationSession, participationRecords, participationRows } from './participation'
import { evidenceRows, eventDay } from './classroomAnalysis'

test('evidence uses the linked class date, preserves recording time and counts unscored answers consistently', () => {
  const snapshot = createDemoSnapshot()
  const course = snapshot.courses[0].id
  const session = snapshot.sessions.find(s => s.course_id === course)!
  session.session_date = '2026-09-30'
  const student = snapshot.enrollments.find(e => e.course_id === course)!.student_id
  snapshot.learningEvents = []
  snapshot.attempts = [{ id:'late-answer', client_attempt_id:'late-answer', course_id:course, student_id:student,
    randomizer_sessions:{class_session_id:session.id}, outcome:'answered', record_status:'valid',
    selection_method:'random', counted_for_summary:false, drawn_at:'2026-10-02T01:00:00Z', completed_at:'2026-10-02T01:00:05Z'
  } as RandomizerAttempt]
  expect(evidenceRows(snapshot)[0]).toMatchObject({date:'2026-09-30',recordedAt:'2026-10-02T01:00:05Z',included:true})
  expect(participationRows(snapshot,course,session.id).find(r => r.student.id === student)?.total).toBe(1)
  snapshot.attempts[0].record_status = 'corrected'
  expect(evidenceRows(snapshot)[0]).toMatchObject({status:'已更正',included:false})
  expect(eventDay('2026-10-01T18:30:00Z')).toBe('2026-10-02')
  expect(eventDay('2026-09-30')).toBe('2026-09-30')
});

test('latest class skips an empty new session but retains classes with no answers', () => {
  const snapshot = createDemoSnapshot()
  const courseId = snapshot.courses[0].id
  const previous = snapshot.sessions.find(session => session.course_id === courseId)!
  previous.session_date = '2026-09-30'
  previous.status = 'completed'
  snapshot.attempts = []
  snapshot.learningEvents = []
  snapshot.attendance = []
  snapshot.observations = []
  const empty: ClassSession = { ...previous, id: 'empty-today', session_date: '2026-10-02', status: 'in_progress',
    class_status: null, progress_text: null, what_worked: null, common_difficulty: null, next_adjustment: null, completed_at: null }
  snapshot.sessions.unshift(empty)
  expect(latestParticipationSession(snapshot, courseId)?.id).toBe(previous.id)
  expect(participationRows(snapshot, courseId, previous.id).every(row => row.total === 0)).toBe(true)
  snapshot.attempts = [{ id: 'no-answer', course_id: courseId, client_attempt_id: 'no-answer',
    randomizer_sessions: { class_session_id: empty.id }, outcome: 'not_answered', record_status: 'valid' } as RandomizerAttempt]
  expect(latestParticipationSession(snapshot, courseId)?.id).toBe(empty.id)
  snapshot.attempts[0].course_id = 'another-course'
  expect(latestParticipationSession(snapshot, courseId)?.id).toBe(previous.id)
  snapshot.attempts = []
  snapshot.sessions = [empty]
  expect(latestParticipationSession(snapshot, courseId)).toBeUndefined()
  empty.status = 'completed'
  expect(latestParticipationSession(snapshot, courseId)?.id).toBe(empty.id)
})

test('counts repeated unscored answers, volunteers and zero-answer students within the exact class session', () => {
  const s = createDemoSnapshot()
  const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!.id
  const student = s.enrollments.find(e => e.course_id === course)!.student_id
  const event = s.learningEvents[0]
  s.learningEvents = [
    { ...event, id: 'manual', course_id: course, session_id: session, student_id: student, source: 'voluntary_answer', response_status: 'answered', record_status: 'valid' },
    { ...event, id: 'mirror', client_event_id: 'a', course_id: course, session_id: session, student_id: student, source: 'random_call' },
    { ...event, id: 'observation', course_id: course, session_id: session, student_id: student, source: 'class_observation' },
  ]
  const attempt = (id: string, extra: Partial<RandomizerAttempt> = {}) => ({ id, client_attempt_id: id, course_id: course, student_id: student,
    randomizer_sessions: { class_session_id: session }, selection_method: 'random', outcome: 'answered',
    record_status: 'valid', assessment_status: 'pending', counted_for_summary: false, ...extra } as RandomizerAttempt)
  s.attempts = [attempt('a'), attempt('a'), attempt('b'), attempt('vol', { selection_method: 'volunteer' }),
    attempt('pending', { outcome: 'pending' }), attempt('no', { outcome: 'not_answered' }),
    attempt('void', { record_status: 'voided' }), attempt('undone', { outcome: 'undone' }),
    attempt('other-session', { randomizer_sessions: { class_session_id: 'other-same-day' } }),
    attempt('other-course', { course_id: 'other' })]
  const rows = participationRows(s, course, session)
  expect(rows.find(r => r.student.id === student)).toMatchObject({ random: 2, voluntary: 2, total: 4 })
  expect(rows).toHaveLength(26)
  expect(rows.filter(r => r.total === 0)).toHaveLength(25)
  s.attempts[0].record_status = 'voided'
  s.attempts[1].record_status = 'voided'
  expect(participationRows(s, course, session).find(r => r.student.id === student)?.total).toBe(3)
})

test('corrected raw answer records stay in history but no longer increase the count', () => {
  const s = createDemoSnapshot()
  const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!.id
  const student = s.enrollments.find(e => e.course_id === course)!.student_id
  const event = { ...s.learningEvents[0], id: 'corrected-event', course_id: course, session_id: session, student_id: student,
    source: 'voluntary_answer' as const, response_status: 'answered' as const, record_status: 'corrected' as const, counted_for_summary: false }
  const attempt = { id: 'corrected-attempt', client_attempt_id: 'corrected-attempt', course_id: course, student_id: student,
    randomizer_sessions: { class_session_id: session }, selection_method: 'random' as const, outcome: 'answered' as const,
    record_status: 'corrected' as const, assessment_status: 'pending' as const, counted_for_summary: true } as RandomizerAttempt
  s.learningEvents = [event]
  s.attempts = [attempt]
  expect(participationRows(s, course, session).find(r => r.student.id === student)).toMatchObject({ random: 0, voluntary: 0, total: 0 })
})

test('manual participation adjustments count separately and expose the record for quick correction', () => {
  const s = createDemoSnapshot()
  const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!.id
  const student = s.enrollments.find(e => e.course_id === course)!
  s.attempts = []
  s.learningEvents = [{ ...s.learningEvents[0], id: 'manual-adjustment', course_id: course, session_id: session, student_id: student.student_id,
    source: 'manual_adjustment' as const, textbook_id: null, lesson_id: null, lesson_label: null,
    activity_label: '回答次數快速加記', response_status: 'answered' as const, record_status: 'valid' as const, counted_for_summary: true }]
  expect(participationRows(s, course, session).find(r => r.student.id === student.student_id)).toMatchObject({ random: 0, voluntary: 0, manual: 1, total: 1 })
  expect(participationRecords(s, course, session)).toMatchObject([{ recordType: 'learning_event', recordId: 'manual-adjustment', studentId: student.student_id, source: 'manual' }])
})
