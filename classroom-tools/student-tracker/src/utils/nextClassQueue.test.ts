import { expect, test } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { Followup, LearningEvent, RandomizerAttempt } from '../types'
import { nextClassQueue } from './nextClassQueue'

function fixture() {
  const snapshot = createDemoSnapshot()
  const course = snapshot.courses[0].id
  const session = snapshot.sessions.find(s => s.course_id === course)!
  session.status = 'completed'
  snapshot.sessions = [session]
  snapshot.enrollments = snapshot.enrollments.filter(e => e.course_id === course).slice(0, 2)
  snapshot.students = snapshot.students.filter(s => snapshot.enrollments.some(e => e.student_id === s.id))
  snapshot.observations = []; snapshot.learningEvents = []; snapshot.attempts = []; snapshot.attendance = []; snapshot.attendanceExceptions = []; snapshot.followups = []
  const student = snapshot.students[0]
  const task: Followup = { id: 'task', owner_id: 'demo-owner', course_id: course, student_id: student.id, session_id: session.id, kind: 'makeup', title: '补做任务', due_on: null, status: 'open', completed_at: null }
  return { snapshot, course, session, student, task }
}

test('groups existing class and student tasks, scopes course, and never mutates or creates records', () => {
  const { snapshot, course, student, task } = fixture()
  snapshot.followups = [task, { ...task, id: 'second', due_on: '2026-01-01' }, { ...task, id: 'class', student_id: null }, { ...task, id: 'other', course_id: 'other' }, { ...task, id: 'done', status: 'completed' }]
  snapshot.enrollments.push({ ...snapshot.enrollments[0], id: 'duplicate' })
  const before = JSON.stringify(snapshot)
  const queue = nextClassQueue(snapshot, course)
  expect(queue.items.filter(i => i.studentId === student.id)).toHaveLength(1)
  expect(queue.items.find(i => i.studentId === student.id)?.followups.map(f => f.id)).toEqual(['second', 'task'])
  expect(queue.items.find(i => i.studentId === null)?.followups[0].id).toBe('class')
  expect(nextClassQueue(snapshot, 'missing').items).toEqual([])
  expect(JSON.stringify(snapshot)).toBe(before)
})

test('missing oral evidence is unobserved, explicit absence is excluded, and makeup tasks stay visible', () => {
  const { snapshot, course, student, session, task } = fixture()
  expect(nextClassQueue(snapshot, course).items[0].observation?.reason).toContain('未观察')
  snapshot.attendanceExceptions = [{ id: 'absence', owner_id: 'demo-owner', session_id: session.id, student_id: student.id, observed_status: 'absent', arrival_time: null, departure_time: null, reason: '请假', makeup_status: 'pending', makeup_date: null, official_status: 'unverified', verified_on: null, created_at: '', updated_at: '' }]
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
  snapshot.followups = [task]
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)).toMatchObject({ observation: null, followups: [task] })
})

test('latest oral observation controls re-observation and handled source tasks do not reappear as suggestions', () => {
  const { snapshot, course, student, session, task } = fixture()
  snapshot.observations = [{ id: 'o', owner_id: 'demo-owner', student_id: student.id, session_id: session.id, result: 'with_prompt', note: '需要句型提示', observed_at: '2026-08-20T09:00:00Z' }]
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)?.observation).toMatchObject({ reason: '提示后完成，建议再观察', evidence: '需要句型提示' })
  snapshot.observations.push({ ...snapshot.observations[0], id: 'later', result: 'independent', observed_at: '2026-08-20T10:00:00Z' })
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
  snapshot.observations.pop()
  snapshot.followups = [{ ...task, kind: 'reobserve', status: 'completed', completed_at: '2026-08-20T11:00:00Z' }]
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
})

test('invalidated attempts and legacy mirrors cannot clear missing observation; valid support evidence links to task', () => {
  const { snapshot, course, student, session } = fixture()
  const attempt = { id: 'a', client_attempt_id: 'mirror', course_id: course, student_id: student.id, randomizer_sessions: { class_session_id: session.id }, record_status: 'corrected', outcome: 'answered', drawn_at: '2026-08-20T10:00:00Z', performance_level: 'needs_support', task_prompt: '说说你的爱好' } as RandomizerAttempt
  snapshot.attempts = [attempt]
  snapshot.learningEvents = [{ id: 'mirror', client_event_id: 'mirror', course_id: course, session_id: session.id, student_id: student.id, occurred_at: attempt.drawn_at, record_status: 'valid', response_status: 'answered', needs_review: false } as LearningEvent]
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)?.observation?.reason).toContain('未观察')
  snapshot.attempts[0].record_status = 'valid'
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)?.observation?.evidence).toBe('说说你的爱好')
  snapshot.attempts[0].performance_level = 'complete'
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
})

test('no classroom does not infer missing work or observation for the roster', () => {
  const { snapshot, course, task } = fixture()
  snapshot.sessions = []
  expect(nextClassQueue(snapshot, course)).toEqual({ latest: undefined, items: [] })
  snapshot.followups = [task]
  expect(nextClassQueue(snapshot, course).items).toHaveLength(1)
  expect(nextClassQueue(snapshot, course).items[0].observation).toBeNull()
})

test('a new support observation after followup completion remains visible', () => {
  const { snapshot, course, student, session, task } = fixture()
  snapshot.followups = [{ ...task, kind: 'reobserve', status: 'completed', completed_at: '2026-08-20T09:00:00Z' }]
  snapshot.observations = [{ id: 'new', owner_id: 'demo-owner', session_id: session.id, student_id: student.id, result: 'not_yet', note: '再次尝试仍需帮助', observed_at: '2026-08-20T17:00:00+07:00' }]
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)?.observation?.reason).toContain('尚未完成')
})

test('absence in learning events or attempts never becomes a speaking deficit', () => {
  const { snapshot, course, student, session } = fixture()
  snapshot.learningEvents = [{ id: 'absent', course_id: course, session_id: session.id, student_id: student.id, occurred_at: '2026-08-20T09:00:00Z', opportunity_status: 'absent', response_status: 'no_response', needs_review: true } as LearningEvent]
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
  snapshot.learningEvents = []
  snapshot.attempts = [{ id: 'a', course_id: course, randomizer_sessions: { class_session_id: session.id }, student_id: student.id, outcome: 'not_answered', no_response_reason: 'absent', record_status: 'valid', drawn_at: '2026-08-20T09:00:00Z' } as RandomizerAttempt]
  expect(nextClassQueue(snapshot, course).items.some(i => i.studentId === student.id)).toBe(false)
})

test('a legacy manual note without a response or performance observation is not oral evidence', () => {
  const { snapshot, course, student, session } = fixture()
  snapshot.learningEvents = [{ id: 'manual', course_id: course, session_id: session.id, student_id: student.id, source: 'manual_adjustment', occurred_at: '2026-08-20T09:00:00Z', needs_review: false, teacher_note: '带了课本' } as LearningEvent]
  expect(nextClassQueue(snapshot, course).items.find(i => i.studentId === student.id)?.observation?.reason).toContain('未观察')
})
