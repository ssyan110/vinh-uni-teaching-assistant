import { expect, test } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { RandomizerAttempt } from '../types'
import { localWeek, validReviewRange, weeklyReview, weeklyReviewExport } from './weeklyReview'

test('week starts Monday using Vietnam local date across UTC midnight and year boundary', () => {
  expect(localWeek(new Date('2026-10-04T17:01:00Z'))).toEqual({ from: '2026-10-05', to: '2026-10-11' })
  expect(localWeek(new Date('2026-10-04T16:59:00Z'))).toEqual({ from: '2026-09-28', to: '2026-10-04' })
  expect(localWeek(new Date('2026-01-01T00:00:00Z'))).toEqual({ from: '2025-12-29', to: '2026-01-04' })
  expect(validReviewRange('2026-02-30', '2026-03-01')).toBe(false)
  expect(validReviewRange('2026-10-05', '2026-10-04')).toBe(false)
})
test('exact class dates, corrected answers and legacy mirrors never inflate weekly coverage', () => {
  const s = createDemoSnapshot(); const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!; session.session_date = '2026-10-04'
  s.sessions = [session, { ...session, id: 'outside', session_date: '2026-10-05' }]
  const student = s.enrollments.find(e => e.course_id === course)!.student_id
  const event = { ...s.learningEvents[0], course_id: course, session_id: session.id, student_id: student, source: 'voluntary_answer' as const, response_status: 'answered' as const, counted_for_summary: true, record_status: 'valid' as const }
  s.learningEvents = [{ ...event, id: 'mirror', client_event_id: 'corrected' }, { ...event, id: 'valid' }, { ...event, id: 'corrected-event', record_status: 'corrected' }, { ...event, id: 'outside', session_id: 'outside' }]
  s.attempts = [{ id: 'corrected', client_attempt_id: 'corrected', course_id: course, student_id: student, outcome: 'answered', record_status: 'corrected', randomizer_sessions: { class_session_id: session.id } } as RandomizerAttempt]
  const review = weeklyReview(s, course, '2026-09-28', '2026-10-04')
  expect(review.sessions).toHaveLength(1); expect(review.answers).toBe(1); expect(review.answeredStudents).toBe(1)
  expect(review.rows.find(r => r.student.id === student)?.answers).toBe(1)
})
test('deduplicated current enrollment denominator, missing roster and unconfirmed attendance are explicit', () => {
  const s = createDemoSnapshot(); const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!; session.session_date = '2026-10-04'; s.sessions = [session]
  const enrollment = s.enrollments.find(e => e.course_id === course)!
  s.enrollments = [enrollment, { ...enrollment, id: 'duplicate' }, { ...enrollment, id: 'missing', student_id: 'missing' }, { ...enrollment, id: 'withdrawn', student_id: 'withdrawn', status: 'withdrawn' }]
  s.attempts = []; s.learningEvents = []
  s.attendance = [{ id: 'unconfirmed', owner_id: 'demo', session_id: session.id, student_id: enrollment.student_id, status: 'unconfirmed', note: null }]
  const review = weeklyReview(s, course, '2026-10-04', '2026-10-04')
  expect(review).toMatchObject({ denominator: 1, answeredStudents: 0, rosterMissing: 1, attendanceCoverage: 0, attendanceDenominator: 1 })
  expect(review.rows[0]).toMatchObject({ answers: 0, absent: 0 })
  s.attendance[0].status = 'absent'
  expect(weeklyReview(s, course, '2026-10-04', '2026-10-04').rows[0].absent).toBe(1)
  expect(weeklyReview(s, course, '2026-10-05', '2026-10-04').sessions).toEqual([])
})
test('exports preserve recorded reflection, source links, all open class followups and safe CSV cells', () => {
  const s = createDemoSnapshot(); const course = s.courses[0].id
  const session = s.sessions.find(x => x.course_id === course)!; session.session_date = '2026-10-04'; session.common_difficulty = '=教師記錄'; session.progress_text = null; s.sessions = [session]
  s.followups = [{ id: 'f', owner_id: 'demo', course_id: course, student_id: null, session_id: null, kind: 'remind', title: '舊待辦', due_on: '2026-09-01', status: 'open', completed_at: null }]
  const review = weeklyReview(s, course, '2026-10-04', '2026-10-04')
  expect(review.followups).toHaveLength(1)
  const md = weeklyReviewExport(review, '班級', '2026-10-04', '2026-10-04', '先試同伴問答', 'md')
  expect(weeklyReviewExport(review, '班級', '', '', '', 'md', 'https://tracker.example')).toContain('https://tracker.example/followups#followup-f')
  expect(md).toContain('教師記錄'); expect(md).toContain('未記錄'); expect(md).toContain('/followups#followup-f'); expect(md).toContain('先試同伴問答')
  expect(weeklyReviewExport(review, '班級', '', '', '', 'csv')).toContain(`"'=教師記錄"`)
})
