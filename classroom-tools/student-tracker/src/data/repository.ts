import type { SupabaseClient } from '@supabase/supabase-js'
import { createDemoSnapshot } from './demoData'
import type {
  AttendanceStatus,
  ClassSession,
  FollowupKind,
  FollowupStatus,
  ImportStudentRow,
  ObservationResult,
  TrackerSnapshot,
} from '../types'

export interface TrackerRepository {
  load(): Promise<TrackerSnapshot>
  startSession(courseId: string): Promise<string>
  saveAttendance(sessionId: string, studentId: string, status: AttendanceStatus): Promise<void>
  confirmRemainingPresent(sessionId: string, studentIds: string[]): Promise<void>
  saveObservation(sessionId: string, studentId: string, result: ObservationResult, note?: string): Promise<void>
  closeSession(sessionId: string, reflection: Pick<ClassSession, 'what_worked' | 'common_difficulty' | 'next_adjustment'>): Promise<void>
  setFollowupStatus(followupId: string, status: FollowupStatus): Promise<void>
  addFollowup(input: { courseId: string; studentId?: string; sessionId?: string; kind: FollowupKind; title: string; dueOn?: string }): Promise<void>
  importStudents(courseId: string, rows: ImportStudentRow[]): Promise<void>
  addCourse(input: { code: string; name: string; room?: string; scheduleText?: string }): Promise<void>
}

const DEMO_KEY = 'keji-demo-snapshot-v1'

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readDemo(): TrackerSnapshot {
  const saved = sessionStorage.getItem(DEMO_KEY)
  if (!saved) return createDemoSnapshot()
  try {
    return JSON.parse(saved) as TrackerSnapshot
  } catch {
    return createDemoSnapshot()
  }
}

export class DemoRepository implements TrackerRepository {
  private snapshot = readDemo()

  private save() {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(this.snapshot))
  }

  async load() {
    return structuredClone(this.snapshot)
  }

  async startSession(courseId: string) {
    const existing = this.snapshot.sessions.find((session) => session.course_id === courseId && session.status === 'in_progress')
    if (existing) return existing.id
    const id = uid('session')
    this.snapshot.sessions.unshift({
      id,
      owner_id: 'demo-owner',
      course_id: courseId,
      session_date: todayIso(),
      starts_at: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
      topic: null,
      observation_target: null,
      status: 'in_progress',
      what_worked: null,
      common_difficulty: null,
      next_adjustment: null,
      completed_at: null,
    })
    this.save()
    return id
  }

  async saveAttendance(sessionId: string, studentId: string, status: AttendanceStatus) {
    const record = this.snapshot.attendance.find((item) => item.session_id === sessionId && item.student_id === studentId)
    if (record) record.status = status
    else this.snapshot.attendance.push({ id: uid('attendance'), owner_id: 'demo-owner', session_id: sessionId, student_id: studentId, status, note: null })
    this.save()
  }

  async confirmRemainingPresent(sessionId: string, studentIds: string[]) {
    const recorded = new Set(this.snapshot.attendance.filter((item) => item.session_id === sessionId).map((item) => item.student_id))
    studentIds.filter((studentId) => !recorded.has(studentId)).forEach((studentId) => {
      this.snapshot.attendance.push({ id: uid('attendance'), owner_id: 'demo-owner', session_id: sessionId, student_id: studentId, status: 'present', note: null })
    })
    this.save()
  }

  async saveObservation(sessionId: string, studentId: string, result: ObservationResult, note = '') {
    const record = this.snapshot.observations.find((item) => item.session_id === sessionId && item.student_id === studentId)
    if (record) {
      record.result = result
      record.note = note || null
      record.observed_at = new Date().toISOString()
    } else {
      this.snapshot.observations.push({ id: uid('observation'), owner_id: 'demo-owner', session_id: sessionId, student_id: studentId, result, note: note || null, observed_at: new Date().toISOString() })
    }
    this.save()
  }

  async closeSession(sessionId: string, reflection: Pick<ClassSession, 'what_worked' | 'common_difficulty' | 'next_adjustment'>) {
    const session = this.snapshot.sessions.find((item) => item.id === sessionId)
    if (!session) throw new Error('找不到這堂課。')
    Object.assign(session, reflection, { status: 'completed', completed_at: new Date().toISOString() })
    this.save()
  }

  async setFollowupStatus(followupId: string, status: FollowupStatus) {
    const followup = this.snapshot.followups.find((item) => item.id === followupId)
    if (!followup) throw new Error('找不到這筆待辦。')
    followup.status = status
    followup.completed_at = status === 'completed' ? new Date().toISOString() : null
    this.save()
  }

  async addFollowup(input: { courseId: string; studentId?: string; sessionId?: string; kind: FollowupKind; title: string; dueOn?: string }) {
    this.snapshot.followups.unshift({
      id: uid('followup'), owner_id: 'demo-owner', course_id: input.courseId, student_id: input.studentId ?? null,
      session_id: input.sessionId ?? null, kind: input.kind, title: input.title, due_on: input.dueOn ?? null,
      status: 'open', completed_at: null,
    })
    this.save()
  }

  async importStudents(courseId: string, rows: ImportStudentRow[]) {
    rows.forEach((row) => {
      let student = this.snapshot.students.find((item) => item.student_code === row.student_code)
      if (!student) {
        student = {
          id: uid('student'), owner_id: 'demo-owner', student_code: row.student_code, chinese_name: row.chinese_name,
          original_name: row.original_name || null, preferred_name: row.preferred_name || null, status: 'active',
        }
        this.snapshot.students.push(student)
      }
      const exists = this.snapshot.enrollments.some((item) => item.course_id === courseId && item.student_id === student?.id)
      if (!exists) this.snapshot.enrollments.push({ id: uid('enrollment'), owner_id: 'demo-owner', course_id: courseId, student_id: student.id, seat_number: row.seat_number ?? null, status: 'active' })
    })
    this.save()
  }

  async addCourse(input: { code: string; name: string; room?: string; scheduleText?: string }) {
    const term = this.snapshot.terms.find((item) => item.is_active) ?? this.snapshot.terms[0]
    if (!term) throw new Error('請先建立學期。')
    this.snapshot.courses.push({
      id: uid('course'), owner_id: 'demo-owner', term_id: term.id, code: input.code, name: input.name,
      room: input.room || null, schedule_text: input.scheduleText || null, attendance_mode: 'exceptions', archived_at: null,
    })
    this.save()
  }
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export class SupabaseRepository implements TrackerRepository {
  constructor(private client: SupabaseClient, private ownerId: string) {}

  async load(): Promise<TrackerSnapshot> {
    const tableNames = ['academic_terms', 'courses', 'students', 'enrollments', 'class_sessions', 'attendance_records', 'observation_records', 'followups'] as const
    const results = await Promise.all(tableNames.map((table) => this.client.from(table).select('*').eq('owner_id', this.ownerId)))
    results.forEach((result) => assertNoError(result.error))
    return {
      terms: results[0].data ?? [], courses: results[1].data ?? [], students: results[2].data ?? [], enrollments: results[3].data ?? [],
      sessions: results[4].data ?? [], attendance: results[5].data ?? [], observations: results[6].data ?? [], followups: results[7].data ?? [],
    } as TrackerSnapshot
  }

  async startSession(courseId: string) {
    const existing = await this.client.from('class_sessions').select('id').eq('owner_id', this.ownerId).eq('course_id', courseId).eq('status', 'in_progress').maybeSingle()
    assertNoError(existing.error)
    if (existing.data) return existing.data.id as string
    const result = await this.client.from('class_sessions').insert({ owner_id: this.ownerId, course_id: courseId, session_date: todayIso(), status: 'in_progress' }).select('id').single()
    assertNoError(result.error)
    if (!result.data) throw new Error('無法建立課堂。')
    return result.data.id as string
  }

  async saveAttendance(sessionId: string, studentId: string, status: AttendanceStatus) {
    const result = await this.client.from('attendance_records').upsert({ owner_id: this.ownerId, session_id: sessionId, student_id: studentId, status }, { onConflict: 'session_id,student_id' })
    assertNoError(result.error)
  }

  async confirmRemainingPresent(sessionId: string, studentIds: string[]) {
    const current = await this.client.from('attendance_records').select('student_id').eq('owner_id', this.ownerId).eq('session_id', sessionId)
    assertNoError(current.error)
    const recorded = new Set((current.data ?? []).map((item) => item.student_id as string))
    const rows = studentIds.filter((studentId) => !recorded.has(studentId)).map((studentId) => ({ owner_id: this.ownerId, session_id: sessionId, student_id: studentId, status: 'present' }))
    if (!rows.length) return
    const result = await this.client.from('attendance_records').insert(rows)
    assertNoError(result.error)
  }

  async saveObservation(sessionId: string, studentId: string, resultValue: ObservationResult, note = '') {
    const result = await this.client.from('observation_records').upsert({ owner_id: this.ownerId, session_id: sessionId, student_id: studentId, result: resultValue, note: note || null, observed_at: new Date().toISOString() }, { onConflict: 'session_id,student_id' })
    assertNoError(result.error)
  }

  async closeSession(sessionId: string, reflection: Pick<ClassSession, 'what_worked' | 'common_difficulty' | 'next_adjustment'>) {
    const result = await this.client.from('class_sessions').update({ ...reflection, status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId).eq('owner_id', this.ownerId)
    assertNoError(result.error)
  }

  async setFollowupStatus(followupId: string, status: FollowupStatus) {
    const result = await this.client.from('followups').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', followupId).eq('owner_id', this.ownerId)
    assertNoError(result.error)
  }

  async addFollowup(input: { courseId: string; studentId?: string; sessionId?: string; kind: FollowupKind; title: string; dueOn?: string }) {
    const result = await this.client.from('followups').insert({ owner_id: this.ownerId, course_id: input.courseId, student_id: input.studentId ?? null, session_id: input.sessionId ?? null, kind: input.kind, title: input.title, due_on: input.dueOn ?? null, status: 'open' })
    assertNoError(result.error)
  }

  async importStudents(courseId: string, rows: ImportStudentRow[]) {
    const studentRows = rows.map((row) => ({ owner_id: this.ownerId, student_code: row.student_code, chinese_name: row.chinese_name, original_name: row.original_name || null, preferred_name: row.preferred_name || null, status: 'active' }))
    const studentsResult = await this.client.from('students').upsert(studentRows, { onConflict: 'owner_id,student_code' }).select('id,student_code')
    assertNoError(studentsResult.error)
    const byCode = new Map((studentsResult.data ?? []).map((student) => [student.student_code as string, student.id as string]))
    const enrollmentRows = rows.map((row) => ({ owner_id: this.ownerId, course_id: courseId, student_id: byCode.get(row.student_code), seat_number: row.seat_number ?? null, status: 'active' })).filter((row) => row.student_id)
    const enrollmentsResult = await this.client.from('enrollments').upsert(enrollmentRows, { onConflict: 'course_id,student_id' })
    assertNoError(enrollmentsResult.error)
  }

  async addCourse(input: { code: string; name: string; room?: string; scheduleText?: string }) {
    let termResult = await this.client.from('academic_terms').select('id').eq('owner_id', this.ownerId).eq('is_active', true).limit(1).maybeSingle()
    assertNoError(termResult.error)
    if (!termResult.data) {
      const year = new Date().getFullYear()
      termResult = await this.client.from('academic_terms').insert({ owner_id: this.ownerId, name: `${year} 學年`, starts_on: `${year}-01-01`, ends_on: `${year}-12-31`, is_active: true }).select('id').single()
      assertNoError(termResult.error)
    }
    const result = await this.client.from('courses').insert({ owner_id: this.ownerId, term_id: termResult.data?.id, code: input.code, name: input.name, room: input.room || null, schedule_text: input.scheduleText || null, attendance_mode: 'exceptions' })
    assertNoError(result.error)
  }
}
