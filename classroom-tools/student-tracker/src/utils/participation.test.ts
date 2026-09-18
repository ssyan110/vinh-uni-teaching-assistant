import { expect, test } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { RandomizerAttempt } from '../types'
import { participationRows } from './participation'

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
  expect(rows).toHaveLength(27)
  expect(rows.filter(r => r.total === 0)).toHaveLength(26)
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
