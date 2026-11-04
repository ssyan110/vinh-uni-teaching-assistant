import { expect, test } from 'vitest'
import { exportClassroomCsv } from './classroomExport'
import { emptySnapshot } from '../types'
import type { Evidence } from './classroomAnalysis'

test('classroom export keeps correction status, reason and exclusion from counts', () => {
  const row = {
    id: 'attempt:attempt-1', courseId: 'course-1', studentId: 'student-1', studentName: '王小明', date: '2026-09-08T01:00:00Z',
    source: '隨機抽問', textbook: '教材', lesson: '第 1 課', task: '回答', questionId: null, prompt: '', rubric: '原始紀錄',
    status: '已回答', level: null, dimensions: [null, null, null, null], total: null, note: '', correction: '學生缺席，誤按回答。', included: false, kind: 'attempt', fact: null, factVersion: null, assistance: null,
  } as Evidence
  const snapshot = {
    ...emptySnapshot,
    courses: [{ id: 'course-1', owner_id: 'owner', term_id: 'term-1', code: 'LT_01', name: '華語班', room: null, schedule_text: null, attendance_mode: 'exceptions' as const, archived_at: null }],
    students: [{ id: 'student-1', owner_id: 'owner', student_code: 'S001', chinese_name: '王小明', original_name: null, preferred_name: null, status: 'active' as const }],
    enrollments: [{ id: 'enrollment-1', owner_id: 'owner', course_id: 'course-1', student_id: 'student-1', seat_number: 1, status: 'active' as const }],
  }
  const csv = exportClassroomCsv(snapshot, [row], 'course-1')
  expect(csv).toContain('已更正')
  expect(csv).toContain('學生缺席，誤按回答。')
  expect(csv).toContain('"否"')
})
