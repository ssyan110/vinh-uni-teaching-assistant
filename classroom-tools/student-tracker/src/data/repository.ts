import type { SupabaseClient } from '@supabase/supabase-js'
import { createDemoSnapshot } from './demoData'
import type {
  NoteInput,
  AttendanceStatus,
  ClassSession,
  ClassroomRecordCorrectionInput,
  ClassroomRecordStatus,
  FollowupKind,
  FollowupStatus,
  ImportStudentRow,
  LearningEvent,
  ObservationResult,
  TrackerSnapshot,
} from '../types'

export interface TrackerRepository {
  addNote(input: NoteInput): Promise<void>
  load(): Promise<TrackerSnapshot>
  startSession(courseId: string): Promise<string>
  updateSession(sessionId: string, input: { sessionDate: string; sessionNumber: number | null; reason: string }): Promise<void>
  saveAttendance(sessionId: string, studentId: string, status: AttendanceStatus): Promise<void>
  confirmRemainingPresent(sessionId: string, studentIds: string[]): Promise<void>
  saveObservation(sessionId: string, studentId: string, result: ObservationResult, note?: string): Promise<void>
  saveLearningEvent(event: Omit<LearningEvent, 'id' | 'owner_id' | 'occurred_at'> & { occurredAt?: string }): Promise<void>
  correctClassroomRecord(input: ClassroomRecordCorrectionInput): Promise<void>
  closeSession(sessionId: string, reflection: Pick<ClassSession, 'class_status' | 'progress_text' | 'what_worked' | 'common_difficulty' | 'next_adjustment'>): Promise<void>
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
  if (!saved) return { ...createDemoSnapshot(), correctionAudits: [] }
  try {
    const parsed = JSON.parse(saved) as TrackerSnapshot
    parsed.learningEvents ??= []
    parsed.attempts ??= []
    parsed.studentNotes ??= []
    parsed.correctionAudits ??= []
    return parsed
  } catch {
    return { ...createDemoSnapshot(), correctionAudits: [] }
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

  async addNote(input: NoteInput) {
    validateNote(input)
    if (!this.snapshot.enrollments.some(e => e.course_id === input.course_id && e.student_id === input.student_id)) throw new Error('學生不屬於這個班級。')
    if (input.supersedes_id && (!this.snapshot.studentNotes.some(n => n.id === input.supersedes_id && n.course_id === input.course_id && n.student_id === input.student_id) || this.snapshot.studentNotes.some(n => n.supersedes_id === input.supersedes_id))) throw new Error('這筆備註已修正，請更新後再試。')
    this.snapshot.studentNotes.unshift({...input, id:uid('note'),owner_id:'demo-owner',created_at:new Date().toISOString()})
    this.save()
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
      class_status: null,
      progress_text: null,
      what_worked: null,
      common_difficulty: null,
      next_adjustment: null,
      completed_at: null,
    })
    this.save()
    return id
  }

  async updateSession(sessionId: string, input: { sessionDate: string; sessionNumber: number | null; reason: string }) {
    validateSessionEdit(input)
    const session = this.snapshot.sessions.find((item) => item.id === sessionId)
    if (!session) throw new Error('找不到這堂課。')
    if (input.sessionNumber !== null && this.snapshot.sessions.some((item) => item.id !== sessionId && item.course_id === session.course_id && item.session_number === input.sessionNumber)) {
      throw new Error('這個班級已有相同的上課次數。')
    }
    session.session_date = input.sessionDate
    session.session_number = input.sessionNumber
    this.save()
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

  async saveLearningEvent(input: Omit<LearningEvent, 'id' | 'owner_id' | 'occurred_at'> & { occurredAt?: string }) {
    if (input.client_event_id && this.snapshot.learningEvents.some(event => event.client_event_id === input.client_event_id)) return
    const session = this.snapshot.sessions.find((item) => item.id === input.session_id && item.course_id === input.course_id)
    const enrolled = this.snapshot.enrollments.some((item) => item.course_id === input.course_id && item.student_id === input.student_id && item.status === 'active')
    if (!session || !enrolled) throw new Error('學生或課堂不屬於這個班級。')
    if (!input.textbook_id || !input.lesson_id || !input.activity_label.trim()) throw new Error('請填寫教材、課次與活動。')
    for (const value of [input.task_completion, input.comprehensibility, input.language_control, input.interaction]) {
      if (value !== null && (!Number.isInteger(value) || value < 0 || value > 3)) throw new Error('分數必須介於 0 到 3。')
    }
    this.snapshot.learningEvents.unshift({ ...input, id: uid('learning-event'), owner_id: 'demo-owner', occurred_at: input.occurredAt ?? new Date().toISOString() })
    this.save()
  }

  async correctClassroomRecord(input: ClassroomRecordCorrectionInput) {
    validateClassroomRecordCorrection(input)
    const reason = input.reason.trim()
    const correctedAt = new Date().toISOString()
    const audits = this.snapshot.correctionAudits ?? (this.snapshot.correctionAudits = [])
    if (input.recordType === 'randomizer_attempt') {
      const record = this.snapshot.attempts.find((item) => item.id === input.recordId)
      if (!record) throw new Error('找不到這筆回答紀錄。')
      const previousStatus = record.record_status ?? 'valid'
      if (previousStatus === 'corrected') throw new Error('這筆回答紀錄已更正。')
      if (previousStatus === 'voided') throw new Error('這筆回答紀錄已撤銷。')
      record.record_status = 'corrected'
      record.counted_for_summary = false
      record.correction_note = reason
      record.corrected_at = correctedAt
      audits.unshift({ id: uid('correction'), owner_id: 'demo-owner', record_type: input.recordType, record_id: record.id, course_id: record.course_id, student_id: record.student_id, previous_record_status: previousStatus, next_record_status: 'corrected', reason, created_at: correctedAt })
      this.save()
      return
    }

    const record = this.snapshot.learningEvents.find((item) => item.id === input.recordId)
    if (!record) throw new Error('找不到這筆回答紀錄。')
    const previousStatus = (record.record_status ?? 'valid') as ClassroomRecordStatus
    if (previousStatus === 'corrected') throw new Error('這筆回答紀錄已更正。')
    if (previousStatus === 'voided') throw new Error('這筆回答紀錄已撤銷。')
    record.record_status = 'corrected'
    record.counted_for_summary = false
    record.correction_note = reason
    record.corrected_at = correctedAt
    audits.unshift({ id: uid('correction'), owner_id: 'demo-owner', record_type: input.recordType, record_id: record.id, course_id: record.course_id, student_id: record.student_id, previous_record_status: previousStatus, next_record_status: 'corrected', reason, created_at: correctedAt })
    this.save()
  }

  async closeSession(sessionId: string, reflection: Pick<ClassSession, 'class_status' | 'progress_text' | 'what_worked' | 'common_difficulty' | 'next_adjustment'>) {
    const session = this.snapshot.sessions.find((item) => item.id === sessionId)
    if (!session) throw new Error('找不到這堂課。')
    validateSessionReflection(reflection)
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

export function validateNote(input: NoteInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.note_date) || Number.isNaN(Date.parse(input.note_date)) || new Date(input.note_date).toISOString().slice(0,10) !== input.note_date) throw new Error('請填寫有效日期。')
  if (!input.body.trim() || input.body.length > 2000) throw new Error('請填寫事實內容，最多 2000 字。')
  if (input.supersedes_id && (!input.correction_reason?.trim() || input.correction_reason.length > 500)) throw new Error('修正時請說明原因，最多 500 字。')
  if (!['homework_missing','textbook_missing','classroom_rule','other'].includes(input.category)) throw new Error('請選擇事件類別。')
}

export function validateSessionReflection(reflection: Pick<ClassSession, 'class_status' | 'progress_text' | 'what_worked' | 'common_difficulty' | 'next_adjustment'>) {
  if ([reflection.class_status, reflection.progress_text, reflection.what_worked, reflection.common_difficulty, reflection.next_adjustment].some((value) => value !== null && value.length > 2000)) {
    throw new Error('課後文字最多 2000 字。')
  }
}

export function validateSessionEdit(input: { sessionDate: string; sessionNumber: number | null; reason: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate) || Number.isNaN(Date.parse(input.sessionDate)) || new Date(`${input.sessionDate}T00:00:00Z`).toISOString().slice(0, 10) !== input.sessionDate) {
    throw new Error('請填寫有效上課日期。')
  }
  if (input.sessionNumber !== null && (!Number.isInteger(input.sessionNumber) || input.sessionNumber < 1 || input.sessionNumber > 999)) {
    throw new Error('上課次數必須是 1 到 999 的整數。')
  }
  if (!input.reason.trim() || input.reason.trim().length > 500) throw new Error('請說明修正原因，最多 500 字。')
}

export function validateClassroomRecordCorrection(input: ClassroomRecordCorrectionInput) {
  if (!['randomizer_attempt', 'learning_event'].includes(input.recordType)) throw new Error('回答紀錄類型不正確。')
  if (!input.recordId.trim()) throw new Error('找不到要修正的回答紀錄。')
  if (!input.reason.trim() || input.reason.trim().length > 500) throw new Error('請說明修正原因，最多 500 字。')
}

export class SupabaseRepository implements TrackerRepository {
  constructor(private client: SupabaseClient, private ownerId: string) {}

  async load(): Promise<TrackerSnapshot> {
    const tableNames = ['academic_terms', 'courses', 'students', 'enrollments', 'class_sessions', 'attendance_records', 'observation_records', 'followups', 'learning_events', 'randomizer_attempts', 'student_notes', 'classroom_record_corrections'] as const
    const results = await Promise.all(tableNames.map(async (table) => {
      const rows: unknown[] = []
      for (let offset=0;;offset+=1000) {
        const result = await this.client.from(table).select(table === 'randomizer_attempts' ? '*,randomizer_sessions!randomizer_attempts_session_fk(class_session_id)' : '*').eq('owner_id',this.ownerId).order('id').range(offset,offset+999)
        assertNoError(result.error)
        rows.push(...(result.data ?? []))
        if ((result.data?.length ?? 0) < 1000) break
      }
      return {data:rows}
    }))
    return {
      terms: results[0].data ?? [], courses: results[1].data ?? [], students: results[2].data ?? [], enrollments: results[3].data ?? [],
      sessions: results[4].data ?? [], attendance: results[5].data ?? [], observations: results[6].data ?? [], followups: results[7].data ?? [],
      learningEvents: results[8].data ?? [], attempts: results[9].data ?? [], studentNotes: results[10].data ?? [], correctionAudits: results[11].data ?? [],
    } as TrackerSnapshot
  }

  async addNote(input: NoteInput) {
    validateNote(input)
    const result = await this.client.from('student_notes').insert({...input,owner_id:this.ownerId})
    if (result.error?.code === '23505') throw new Error('這筆備註已被修正，請更新後再試。')
    assertNoError(result.error)
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

  async updateSession(sessionId: string, input: { sessionDate: string; sessionNumber: number | null; reason: string }) {
    validateSessionEdit(input)
    const result = await this.client.rpc('correct_class_session', {
      p_session_id: sessionId,
      p_session_date: input.sessionDate,
      p_session_number: input.sessionNumber,
      p_reason: input.reason.trim(),
    })
    assertNoError(result.error)
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

  async saveLearningEvent(input: Omit<LearningEvent, 'id' | 'owner_id' | 'occurred_at'> & { occurredAt?: string }) {
    const { occurredAt, ...record } = input
    const row = { ...record, owner_id: this.ownerId, occurred_at: occurredAt ?? new Date().toISOString() }
    const result = input.client_event_id
      ? await this.client.from('learning_events').upsert(row, { onConflict: 'owner_id,client_event_id', ignoreDuplicates: true })
      : await this.client.from('learning_events').insert(row)
    assertNoError(result.error)
  }

  async correctClassroomRecord(input: ClassroomRecordCorrectionInput) {
    validateClassroomRecordCorrection(input)
    const result = await this.client.rpc('correct_classroom_record', {
      p_record_type: input.recordType,
      p_record_id: input.recordId,
      p_reason: input.reason.trim(),
    })
    assertNoError(result.error)
  }

  async closeSession(sessionId: string, reflection: Pick<ClassSession, 'class_status' | 'progress_text' | 'what_worked' | 'common_difficulty' | 'next_adjustment'>) {
    validateSessionReflection(reflection)
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
