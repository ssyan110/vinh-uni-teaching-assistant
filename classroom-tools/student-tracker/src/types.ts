export type AttendanceMode = 'off' | 'exceptions' | 'confirm_all'
export type AttendanceStatus = 'unconfirmed' | 'present' | 'late' | 'absent' | 'excused'
export type ObservationResult = 'independent' | 'with_prompt' | 'not_yet'
export type FollowupKind = 'reobserve' | 'remind' | 'makeup'
export type FollowupStatus = 'open' | 'completed' | 'cancelled'

export interface AcademicTerm {
  id: string
  owner_id: string
  name: string
  starts_on: string
  ends_on: string
  is_active: boolean
}

export interface Course {
  id: string
  owner_id: string
  term_id: string
  code: string
  name: string
  room: string | null
  schedule_text: string | null
  attendance_mode: AttendanceMode
  archived_at: string | null
}

export interface Student {
  id: string
  owner_id: string
  student_code: string
  chinese_name: string
  original_name: string | null
  preferred_name: string | null
  status: 'active' | 'withdrawn' | 'archived'
}

export interface Enrollment {
  id: string
  owner_id: string
  course_id: string
  student_id: string
  seat_number: number | null
  status: 'active' | 'withdrawn'
}

export interface ClassSession {
  id: string
  owner_id: string
  course_id: string
  session_date: string
  starts_at: string | null
  topic: string | null
  observation_target: string | null
  status: 'in_progress' | 'completed'
  what_worked: string | null
  common_difficulty: string | null
  next_adjustment: string | null
  completed_at: string | null
}

export interface AttendanceRecord {
  id: string
  owner_id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  note: string | null
}

export interface ObservationRecord {
  id: string
  owner_id: string
  session_id: string
  student_id: string
  result: ObservationResult
  note: string | null
  observed_at: string
}

export interface Followup {
  id: string
  owner_id: string
  course_id: string
  student_id: string | null
  session_id: string | null
  kind: FollowupKind
  title: string
  due_on: string | null
  status: FollowupStatus
  completed_at: string | null
}

export type LearningEventSource = 'class_observation' | 'random_call' | 'voluntary_answer'
export type ClassroomOpportunityStatus = 'called' | 'volunteered' | 'not_selected' | 'absent' | 'excused' | 'technical_issue'
export type ClassroomResponseStatus = 'answered' | 'partial' | 'no_response' | 'declined' | 'peer_supported' | 'unobserved'
export type NoResponseReason = 'unprepared' | 'unclear_prompt' | 'forgot' | 'anxious_unwell' | 'time_insufficient' | 'chose_skip' | 'other'
export type AnswerContext = 'prepared' | 'unprepared' | 'unknown'
export type ClassroomRecordStatus = 'valid' | 'corrected' | 'voided'

export interface LearningEvent {
  client_event_id?: string
  textbook_id?: string
  lesson_id?: string
  id: string
  owner_id: string
  course_id: string
  session_id: string
  student_id: string
  occurred_at: string
  source: LearningEventSource
  lesson_label: string
  activity_label: string
  task_completion: number | null
  comprehensibility: number | null
  language_control: number | null
  interaction: number | null
  needs_review: boolean
  event_order?: number | null
  opportunity_status?: ClassroomOpportunityStatus | null
  response_status?: ClassroomResponseStatus
  no_response_reason?: NoResponseReason | null
  answer_context?: AnswerContext
  attendance_status?: AttendanceStatus | null
  score?: number | null
  record_status?: ClassroomRecordStatus
  teacher_note?: string | null
  correction_note?: string | null
  corrected_at?: string | null
  counted_for_summary?: boolean
  /** Legacy compatibility only; this is not the university's official grade. */
  counted_for_grade?: boolean
}

export interface TrackerSnapshot {
  terms: AcademicTerm[]
  courses: Course[]
  students: Student[]
  enrollments: Enrollment[]
  sessions: ClassSession[]
  attendance: AttendanceRecord[]
  observations: ObservationRecord[]
  followups: Followup[]
  learningEvents: LearningEvent[]
}

export interface ImportStudentRow {
  student_code: string
  chinese_name: string
  original_name?: string
  preferred_name?: string
  seat_number?: number
}

export const emptySnapshot: TrackerSnapshot = {
  terms: [],
  courses: [],
  students: [],
  enrollments: [],
  sessions: [],
  attendance: [],
  observations: [],
  followups: [],
  learningEvents: [],
}
