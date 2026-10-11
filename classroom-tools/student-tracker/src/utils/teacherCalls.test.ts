import { expect, test } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { RandomizerAttempt } from '../types'
import { participationRecords, participationRows } from './participation'
import { evidenceRows } from './classroomAnalysis'

test('teacher answers count separately and preserve their source in evidence', () => {
  const snapshot = createDemoSnapshot()
  const enrollment = snapshot.enrollments[0]
  const session = snapshot.sessions.find(s => s.course_id === enrollment.course_id)!
  snapshot.learningEvents = []
  snapshot.attempts = [{ id: 'teacher', client_attempt_id: 'teacher', course_id: enrollment.course_id,
    student_id: enrollment.student_id, selection_method: 'teacher', outcome: 'answered',
    record_status: 'valid', assessment_status: 'pending', drawn_at: session.session_date,
    randomizer_sessions: { class_session_id: session.id } } as RandomizerAttempt]
  expect(participationRows(snapshot, enrollment.course_id, session.id).find(r => r.student.id === enrollment.student_id))
    .toMatchObject({ random: 0, voluntary: 0, teacher: 1, manual: 0, total: 1 })
  expect(participationRecords(snapshot, enrollment.course_id, session.id)[0].source).toBe('teacher')
  expect(evidenceRows(snapshot)[0].source).toBe('老師主動叫')
  snapshot.attempts[0].record_status = 'voided'
  expect(participationRecords(snapshot, enrollment.course_id, session.id)).toHaveLength(0)
})
