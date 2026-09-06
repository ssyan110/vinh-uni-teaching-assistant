import type {
  AcademicTerm,
  AttendanceRecord,
  ClassSession,
  Course,
  Enrollment,
  Followup,
  LearningEvent,
  ObservationRecord,
  Student,
  TrackerSnapshot,
} from '../types'
import { randomizerRosters } from './randomizerRosterAdapter'

const owner = 'demo-owner'
const term: AcademicTerm = {
  id: 'term-2026-fall',
  owner_id: owner,
  name: '2026 秋季學期',
  starts_on: '2026-08-17',
  ends_on: '2027-01-10',
  is_active: true,
}

const courseSeeds = [
  ['course-lt-01', 'LT_01', 'LT_01 華語班', '—', '依課表上課'],
  ['course-lt-02', 'LT_02', 'LT_02 華語班', '—', '依課表上課'],
  ['course-lt-03', 'LT_03', 'LT_03 華語班', '—', '依課表上課'],
] as const

const courses: Course[] = courseSeeds.map(([id, code, name, room, schedule_text]) => ({
  id,
  owner_id: owner,
  term_id: term.id,
  code,
  name,
  room,
  schedule_text,
  attendance_mode: 'exceptions',
  archived_at: null,
}))

const classOrder = ['LT_01', 'LT_02', 'LT_03'] as const
const rosterRows = classOrder.flatMap((classId) => randomizerRosters[classId].map(([studentCode, name, seatNumber]) => ({ classId, studentCode, name, seatNumber })))
const demoCode = (classId: typeof classOrder[number], seatNumber: number) => `DEMO-${classId}-${String(seatNumber).padStart(2, '0')}`
const students: Student[] = rosterRows.map(({ studentCode, name }) => ({
  id: studentCode, owner_id: owner, student_code: studentCode, chinese_name: name, original_name: name, preferred_name: null, status: 'active',
}))
const enrollments: Enrollment[] = rosterRows.map(({ classId, studentCode, seatNumber }, index) => ({
  id: `enrollment-${index + 1}`, owner_id: owner, course_id: courses.find((course) => course.code === classId)!.id,
  student_id: studentCode, seat_number: Number(seatNumber), status: 'active',
}))

const sessions: ClassSession[] = [
  {
    id: 'session-previous-a',
    owner_id: owner,
    course_id: 'course-lt-01',
    session_date: '2026-08-20',
    starts_at: '08:00',
    topic: '第一課：姓名與介紹',
    observation_target: '能追問同學姓名的由來',
    status: 'completed',
    what_worked: '先示範一輪再換同伴，學生比較快進入活動。',
    common_difficulty: '追問時容易只重複原問題。',
    next_adjustment: '板書兩個追問句，先讓同桌練一次。',
    completed_at: '2026-08-20T10:00:00+07:00',
  },
  {
    id: 'session-previous-b',
    owner_id: owner,
    course_id: 'course-lt-02',
    session_date: '2026-08-20',
    starts_at: '10:00',
    topic: '第一課：姓名與介紹',
    observation_target: '能用三到五句介紹一個名字',
    status: 'completed',
    what_worked: '角色卡讓比較安靜的學生也有內容可說。',
    common_difficulty: '常漏用「原來」回應同伴。',
    next_adjustment: '收尾前加一輪短重做。',
    completed_at: '2026-08-20T12:00:00+07:00',
  },
]

const attendance: AttendanceRecord[] = [
  { id: 'att-1', owner_id: owner, session_id: 'session-previous-a', student_id: demoCode('LT_01', 3), status: 'late', note: null },
  { id: 'att-2', owner_id: owner, session_id: 'session-previous-a', student_id: demoCode('LT_01', 11), status: 'absent', note: null },
]

const observations: ObservationRecord[] = [
  { id: 'obs-1', owner_id: owner, session_id: 'session-previous-a', student_id: demoCode('LT_01', 1), result: 'independent', note: null, observed_at: '2026-08-20T08:40:00+07:00' },
  { id: 'obs-2', owner_id: owner, session_id: 'session-previous-a', student_id: demoCode('LT_01', 4), result: 'with_prompt', note: '需要提示追問句。', observed_at: '2026-08-20T08:43:00+07:00' },
  { id: 'obs-3', owner_id: owner, session_id: 'session-previous-a', student_id: demoCode('LT_01', 8), result: 'not_yet', note: '只回答，還沒有追問。', observed_at: '2026-08-20T08:46:00+07:00' },
  { id: 'obs-4', owner_id: owner, session_id: 'session-previous-b', student_id: demoCode('LT_02', 9), result: 'independent', note: null, observed_at: '2026-08-20T10:45:00+07:00' },
]

const followups: Followup[] = [
  { id: 'followup-1', owner_id: owner, course_id: 'course-lt-01', student_id: demoCode('LT_01', 8), session_id: 'session-previous-a', kind: 'reobserve', title: '下次再看一次追問表現', due_on: '2026-08-24', status: 'open', completed_at: null },
  { id: 'followup-2', owner_id: owner, course_id: 'course-lt-02', student_id: demoCode('LT_02', 4), session_id: null, kind: 'makeup', title: '補做姓名介紹口語任務', due_on: '2026-08-25', status: 'open', completed_at: null },
  { id: 'followup-3', owner_id: owner, course_id: 'course-lt-03', student_id: demoCode('LT_03', 7), session_id: null, kind: 'remind', title: '提醒帶預習卡', due_on: '2026-08-27', status: 'open', completed_at: null },
]

const learningEvents: LearningEvent[] = [
  ['le-1',demoCode('LT_01', 1),'random_call',3,3,2,3,false,'08:38'],
  ['le-2',demoCode('LT_01', 4),'voluntary_answer',3,2,2,2,false,'08:42'],
  ['le-3',demoCode('LT_01', 8),'class_observation',1,2,1,1,true,'08:46'],
  ['le-4',demoCode('LT_01', 13),'random_call',2,2,2,1,true,'08:52'],
  ['le-5',demoCode('LT_01', 15),'voluntary_answer',3,3,3,2,false,'09:03'],
  ['le-6',demoCode('LT_01', 16),'class_observation',2,2,1,2,true,'09:12'],
  ['le-7',demoCode('LT_01', 17),'random_call',3,2,2,3,false,'09:24'],
  ['le-8',demoCode('LT_01', 18),'class_observation',2,3,2,2,false,'09:36'],
].map(([id, student_id, source, task_completion, comprehensibility, language_control, interaction, needs_review, time]) => ({
  id: String(id), owner_id: owner, course_id: 'course-lt-01', session_id: 'session-previous-a', student_id: String(student_id),
  occurred_at: `2026-08-20T${time}:00+07:00`, source: source as LearningEvent['source'], lesson_label: '第一課',
  activity_label: '姓名與追問', task_completion: Number(task_completion), comprehensibility: Number(comprehensibility),
  language_control: Number(language_control), interaction: Number(interaction), needs_review: Boolean(needs_review),
}))

export function createDemoSnapshot(): TrackerSnapshot {
  return structuredClone({ terms: [term], courses, students, enrollments, sessions, attendance, observations, followups, learningEvents })
}
