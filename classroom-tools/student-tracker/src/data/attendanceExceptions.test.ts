import { beforeEach, expect, test, vi } from 'vitest'
import { DemoRepository, SupabaseRepository, validateAttendanceException } from './repository'
import type { AttendanceExceptionInput } from '../types'
import { filterAttendanceExceptions } from '../utils/attendanceExceptions'

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) })
})
const input = (session: string, student: string): AttendanceExceptionInput => ({ session_id: session, student_id: student, observed_status: 'present', arrival_time: '08:05', departure_time: '11:40', reason: ' QR 掃描失敗 ', makeup_status: 'pending', makeup_date: null, official_status: 'unverified', verified_on: null })

test('exception create/edit/reload preserves historical attendance and grades without duplicates', async () => {
  const repo = new DemoRepository()
  const before = await repo.load()
  const session = before.sessions[0]
  const student = before.enrollments.find(e => e.course_id === session.course_id)!
  await repo.saveAttendanceException(input(session.id, student.student_id))
  let reloaded = await new DemoRepository().load()
  expect(reloaded.attendanceExceptions).toHaveLength(1)
  expect(reloaded.attendanceExceptions?.[0]).toMatchObject({ reason: 'QR 掃描失敗', official_status: 'unverified' })
  await repo.saveAttendanceException({ ...input(session.id, student.student_id), makeup_status: 'completed', makeup_date: '2026-10-01', official_status: 'confirmed', verified_on: '2026-10-02' })
  reloaded = await new DemoRepository().load()
  expect(reloaded.attendanceExceptions).toHaveLength(1)
  expect(reloaded.attendanceExceptions?.[0]).toMatchObject({ makeup_date: '2026-10-01', verified_on: '2026-10-02' })
  expect(reloaded.attendance).toEqual(before.attendance)
  expect(reloaded.learningEvents).toEqual(before.learningEvents)
  await repo.saveAttendanceException(input(session.id, student.student_id))
  expect((await repo.load()).attendanceExceptions?.[0]).toMatchObject({ makeup_status: 'pending', official_status: 'unverified', makeup_date: null, verified_on: null })
})

test('validation separates observation, makeup completion and official verification', () => {
  const base = input('session', 'student')
  expect(() => validateAttendanceException({ ...base, reason: ' ' })).toThrow('原因')
  expect(() => validateAttendanceException({ ...base, departure_time: '07:00' })).toThrow('離開')
  expect(() => validateAttendanceException({ ...base, arrival_time: '25:30' })).toThrow('時間')
  expect(() => validateAttendanceException({ ...base, makeup_status: 'completed', makeup_date: '2026-02-30' })).toThrow('補登日期')
  expect(() => validateAttendanceException({ ...base, official_status: 'confirmed', verified_on: '2026-10-01' })).toThrow('官方確認')
  expect(validateAttendanceException({ ...base, makeup_status: 'completed', makeup_date: '2026-10-01' })).toMatchObject({ official_status: 'unverified', verified_on: null })
  const cleaned = validateAttendanceException({ ...base, id: 'injected', owner_id: 'other' } as AttendanceExceptionInput)
  expect(cleaned).not.toHaveProperty('id')
  expect(cleaned).not.toHaveProperty('owner_id')
})

test('cross-class and unknown session exception writes are rejected', async () => {
  const repo = new DemoRepository()
  const snapshot = await repo.load()
  const session = snapshot.sessions[0]
  const other = snapshot.enrollments.find(e => e.course_id !== session.course_id)!
  await expect(repo.saveAttendanceException(input(session.id, other.student_id))).rejects.toThrow('不屬於')
  await expect(repo.saveAttendanceException(input('missing', other.student_id))).rejects.toThrow('不屬於')
})

test('cloud writes use only exception table and authenticated owner', async () => {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ upsert })
  await new SupabaseRepository({ from } as never, 'owner').saveAttendanceException(input('session', 'student'))
  expect(from).toHaveBeenCalledWith('attendance_exceptions')
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: 'owner', official_status: 'unverified' }), { onConflict: 'session_id,student_id' })
})

test('missing exception table does not prevent existing app data loading', async () => {
  const client = { from: (table: string) => {
    const query = { select: () => query, eq: () => query, order: () => query, range: async () => table === 'attendance_exceptions' ? { data: null, error: { code: 'PGRST205' } } : { data: [], error: null } }
    return query
  } }
  expect(await new SupabaseRepository(client as never, 'owner').load()).toMatchObject({ attendanceExceptionsAvailable: false, attendanceExceptions: [] })
})

test('filters select class, student, session, inclusive dates and makeup vs verification independently', async () => {
  const repo = new DemoRepository()
  const snapshot = await repo.load()
  const session = snapshot.sessions[0]
  const students = snapshot.enrollments.filter(e => e.course_id === session.course_id)
  await repo.saveAttendanceException(input(session.id, students[0].student_id))
  await repo.saveAttendanceException({ ...input(session.id, students[1].student_id), makeup_status: 'completed', makeup_date: '2026-10-01' })
  const saved = await new DemoRepository().load()
  expect(filterAttendanceExceptions(saved, { courseId: session.course_id, sessionId: session.id, from: session.session_date, to: session.session_date })).toHaveLength(2)
  expect(filterAttendanceExceptions(saved, { status: 'pending' })).toHaveLength(1)
  expect(filterAttendanceExceptions(saved, { status: 'completed' })).toHaveLength(1)
  expect(filterAttendanceExceptions(saved, { status: 'unverified' })).toHaveLength(2)
  expect(filterAttendanceExceptions(saved, { studentId: students[0].student_id })).toHaveLength(1)
  expect(filterAttendanceExceptions(saved, { courseId: 'other' })).toHaveLength(0)
  expect(filterAttendanceExceptions(saved, { from: '2099-01-01' })).toHaveLength(0)
})
