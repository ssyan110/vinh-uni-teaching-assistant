import type {
  AcademicTerm,
  AttendanceRecord,
  ClassSession,
  Course,
  Enrollment,
  Followup,
  ObservationRecord,
  Student,
  TrackerSnapshot,
} from '../types'

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
  ['course-a', 'CN201-A', '華語聽說二 A 班', 'A302', '週一、週三 08:00'],
  ['course-b', 'CN201-B', '華語聽說二 B 班', 'A305', '週一、週三 10:00'],
  ['course-c', 'CN203-A', '華語會話二 A 班', 'B201', '週二、週四 13:30'],
  ['course-d', 'CN203-B', '華語會話二 B 班', 'B204', '週二、週四 15:30'],
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

const familyNames = ['阮', '陳', '黎', '范', '黃', '潘', '武', '鄧', '裴', '杜']
const givenNames = ['明安', '嘉欣', '德輝', '玉蘭', '國慶', '芳草', '海燕', '俊傑', '秋香', '寶珠']
const latinNames = ['Nguyễn Minh An', 'Trần Gia Hân', 'Lê Đức Huy', 'Phạm Ngọc Lan', 'Hoàng Quốc Khánh', 'Phan Phương Thảo', 'Vũ Hải Yến', 'Đặng Tuấn Kiệt', 'Bùi Thu Hương', 'Đỗ Bảo Châu']

const students: Student[] = Array.from({ length: 100 }, (_, index) => ({
  id: `student-${String(index + 1).padStart(3, '0')}`,
  owner_id: owner,
  student_code: `SV26${String(index + 1).padStart(3, '0')}`,
  chinese_name: `${familyNames[index % familyNames.length]}${givenNames[index % givenNames.length]}`,
  original_name: `${latinNames[index % latinNames.length]} ${index + 1}`,
  preferred_name: index % 7 === 0 ? givenNames[index % givenNames.length] : null,
  status: 'active',
}))

const enrollments: Enrollment[] = students.map((student, index) => ({
  id: `enrollment-${index + 1}`,
  owner_id: owner,
  course_id: courses[Math.floor(index / 25)].id,
  student_id: student.id,
  seat_number: (index % 25) + 1,
  status: 'active',
}))

const sessions: ClassSession[] = [
  {
    id: 'session-previous-a',
    owner_id: owner,
    course_id: 'course-a',
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
    course_id: 'course-b',
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
  { id: 'att-1', owner_id: owner, session_id: 'session-previous-a', student_id: 'student-003', status: 'late', note: null },
  { id: 'att-2', owner_id: owner, session_id: 'session-previous-a', student_id: 'student-011', status: 'absent', note: null },
]

const observations: ObservationRecord[] = [
  { id: 'obs-1', owner_id: owner, session_id: 'session-previous-a', student_id: 'student-001', result: 'independent', note: null, observed_at: '2026-08-20T08:40:00+07:00' },
  { id: 'obs-2', owner_id: owner, session_id: 'session-previous-a', student_id: 'student-004', result: 'with_prompt', note: '需要提示追問句。', observed_at: '2026-08-20T08:43:00+07:00' },
  { id: 'obs-3', owner_id: owner, session_id: 'session-previous-a', student_id: 'student-008', result: 'not_yet', note: '只回答，還沒有追問。', observed_at: '2026-08-20T08:46:00+07:00' },
  { id: 'obs-4', owner_id: owner, session_id: 'session-previous-b', student_id: 'student-026', result: 'independent', note: null, observed_at: '2026-08-20T10:45:00+07:00' },
]

const followups: Followup[] = [
  { id: 'followup-1', owner_id: owner, course_id: 'course-a', student_id: 'student-008', session_id: 'session-previous-a', kind: 'reobserve', title: '下次再看一次追問表現', due_on: '2026-08-24', status: 'open', completed_at: null },
  { id: 'followup-2', owner_id: owner, course_id: 'course-b', student_id: 'student-031', session_id: null, kind: 'makeup', title: '補做姓名介紹口語任務', due_on: '2026-08-25', status: 'open', completed_at: null },
  { id: 'followup-3', owner_id: owner, course_id: 'course-c', student_id: 'student-058', session_id: null, kind: 'remind', title: '提醒帶預習卡', due_on: '2026-08-27', status: 'open', completed_at: null },
]

export function createDemoSnapshot(): TrackerSnapshot {
  return structuredClone({ terms: [term], courses, students, enrollments, sessions, attendance, observations, followups })
}
