import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { createDemoSnapshot } from '../data/demoData'
import type { RandomizerAttempt } from '../types'
import { ParticipationPage } from './ParticipationPage'

const snapshot = createDemoSnapshot()
vi.mock('../state/TrackerContext', () => ({
  useTracker: () => ({ snapshot, busy: false, saveLearningEvent: vi.fn(), correctClassroomRecord: vi.fn() }),
}))

test('historical answers without roster identities remain visible in the class total', () => {
  const session = snapshot.sessions[0]
  const enrollment = snapshot.enrollments.find(row => row.course_id === session.course_id)!
  snapshot.learningEvents = []
  const attempt = (id: string, studentId: string | null, code: string, outcome = 'answered') => ({
    id, client_attempt_id: id, course_id: session.course_id, student_id: studentId, student_code: code,
    randomizer_sessions: { class_session_id: session.id }, outcome, record_status: 'valid',
    selection_method: 'random', drawn_at: '2026-09-10T08:00:00Z',
  } as RandomizerAttempt)
  snapshot.attempts = [
    attempt('matched', enrollment.student_id, 'known'),
    attempt('transferred', null, 'TRANSFERRED'),
    attempt('pending', null, 'TRANSFERRED', 'pending'),
  ]
  const params = new URLSearchParams({ course: session.course_id, date: session.session_date, session: session.id })
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={[`/participation?${params}`]}><ParticipationPage /></MemoryRouter>)
  expect(html).toContain('總回答 2 次')
  expect(html).toContain('其中 1 次來自未匹配目前名冊的歷史紀錄')
  expect(html).not.toContain('總回答 1 次')
})
