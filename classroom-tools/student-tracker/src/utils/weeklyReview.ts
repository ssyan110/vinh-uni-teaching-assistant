import type { TrackerSnapshot } from '../types'
import { participationRecords } from './participation'
import { csvCell } from './classroomExport'

export function localWeek(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  const day = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7)
  const from = day.toISOString().slice(0, 10)
  day.setUTCDate(day.getUTCDate() + 6)
  return { from, to: day.toISOString().slice(0, 10) }
}
export const validReviewRange = (from: string, to: string) => {
  const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d
  return valid(from) && valid(to) && from <= to
}
export const sessionReviewLink = (course: string, date: string, session: string) => `/participation?${new URLSearchParams({ course, date, session })}`
export function weeklyReview(snapshot: TrackerSnapshot, courseId: string, from: string, to: string) {
  const sessions = validReviewRange(from, to) ? snapshot.sessions.filter(s => s.course_id === courseId && s.session_date >= from && s.session_date <= to)
    .sort((a, b) => a.session_date.localeCompare(b.session_date) || (a.session_number ?? 0) - (b.session_number ?? 0) || a.id.localeCompare(b.id)) : []
  const ids = new Set(sessions.map(s => s.id))
  const enrolled = new Set(snapshot.enrollments.filter(e => e.course_id === courseId && e.status === 'active').map(e => e.student_id))
  const roster = snapshot.students.filter(s => enrolled.has(s.id))
  const records = sessions.flatMap(s => participationRecords(snapshot, courseId, s.id).map(r => ({ ...r, sessionId: s.id })))
  const rows = roster.map(student => {
    const own = records.filter(r => r.studentId === student.id || (!r.studentId && r.studentCode === student.student_code))
    const attendance = snapshot.attendance.filter(a => ids.has(a.session_id) && a.student_id === student.id)
    return { student, answers: own.length, sessionIds: [...new Set(own.map(r => r.sessionId))],
      absent: attendance.filter(a => a.status === 'absent').length,
      confirmedAttendance: new Set(attendance.filter(a => a.status !== 'unconfirmed').map(a => a.session_id)).size }
  })
  const unmatchedAnswers = records.filter(r => !rows.some(row => r.studentId === row.student.id || (!r.studentId && r.studentCode === row.student.student_code))).length
  const answeredStudents = rows.filter(r => r.answers > 0).length
  const attendanceCoverage = rows.reduce((n, r) => n + r.confirmedAttendance, 0)
  return { sessions, rows, answeredStudents, answers: records.length, unmatchedAnswers,
    rosterMissing: [...enrolled].filter(id => !snapshot.students.some(s => s.id === id)).length,
    denominator: roster.length, attendanceCoverage, attendanceDenominator: roster.length * sessions.length,
    followups: snapshot.followups.filter(f => f.course_id === courseId && f.status === 'open').sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999')) }
}
export type WeeklyReview = ReturnType<typeof weeklyReview>
const reflectionFields = [['progress_text', '實際進度'], ['what_worked', '有效做法'], ['common_difficulty', '共同問題'], ['next_adjustment', '原課堂調整']] as const
export function weeklyReviewExport(review: WeeklyReview, courseName: string, from: string, to: string, draft: string, format: 'md' | 'csv', appOrigin = '') {
  const rows: string[][] = [
    ['範圍', `${courseName}：${from} 至 ${to}（越南時間）`, ''],
    ['回答覆蓋', `${review.answeredStudents} / ${review.denominator} 名目前有效修課學生；${review.answers} 次回答`, ''],
    ['資料範圍', `目前名冊非歷史名冊；${review.unmatchedAnswers} 次回答不屬於目前名冊；${review.rosterMissing} 筆修課缺學生資料`, ''],
    ['出席記錄覆蓋', `${review.attendanceCoverage} / ${review.attendanceDenominator} 筆學生×場次已確認；零回答不等於缺席`, ''],
    ['待辦範圍', '此班目前全部未完成待辦，包含所選日期以外及未設日期者', ''],
  ]
  for (const s of review.sessions) {
    rows.push(['課堂', `${s.session_date} · ${s.topic || '未記錄主題'} · ${s.status === 'completed' ? '已結束' : '尚未結束'}`, `/sessions/${encodeURIComponent(s.id)}`])
    for (const [field, label] of reflectionFields) rows.push([label, s[field] || '未記錄', `/sessions/${encodeURIComponent(s.id)}`])
  }
  for (const r of review.rows) rows.push(['學生', `${r.student.chinese_name}（${r.student.student_code}）：回答 ${r.answers} 次；記錄缺席 ${r.absent} 場`, `/students/${encodeURIComponent(r.student.id)}`])
  for (const f of review.followups) rows.push(['未完成待辦', `${f.title} · ${f.due_on || '未設日期'}`, `/followups#followup-${encodeURIComponent(f.id)}`])
  rows.push(['下週調整草稿（僅此裝置）', draft || '未填寫', ''])
  for (const row of rows) if (row[2] && appOrigin) row[2] = new URL(row[2], appOrigin).href
  if (format === 'csv') return '\uFEFF' + [['項目', '內容', '來源路徑'], ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')
  const escape = (s: string) => s.replace(/[\\`*_{}[\]<>]/g, '\\$&')
  return `# 每週教學回顧\n\n` + rows.map(([label, text, path]) => `- ${escape(label)}：${escape(text).replace(/\n/g, '\n  ')}${path ? `（[原始紀錄](${path})）` : ''}`).join('\n') + '\n'
}
