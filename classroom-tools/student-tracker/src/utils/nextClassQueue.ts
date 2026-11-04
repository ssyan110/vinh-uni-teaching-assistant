import type { Followup, Student, TrackerSnapshot } from '../types'
import { latestParticipationSession } from './participation'
import { performanceDimensions } from './learningEvents'

export interface NextClassItem {
  studentId: string | null
  student?: Student
  followups: Followup[]
  observation: { reason: string; evidence: string } | null
  seat: number
}

/** A read-only teaching list; missing evidence never creates a task or a score. */
export function nextClassQueue(snapshot: TrackerSnapshot, courseId: string) {
  const latest = latestParticipationSession(snapshot, courseId)
  const rows = new Map<string | null, NextClassItem>()
  const ensure = (studentId: string | null) => {
    if (!rows.has(studentId)) rows.set(studentId, {
      studentId, student: snapshot.students.find(s => s.id === studentId), followups: [], observation: null,
      seat: snapshot.enrollments.find(e => e.course_id === courseId && e.student_id === studentId)?.seat_number ?? 999,
    })
    return rows.get(studentId)!
  }
  for (const task of snapshot.followups.filter(f => f.course_id === courseId && f.status === 'open')) ensure(task.student_id).followups.push(task)
  if (latest) {
    const mirrored = new Set(snapshot.attempts.filter(a => a.course_id === courseId).map(a => a.client_attempt_id))
    const active = new Set(snapshot.enrollments.filter(e => e.course_id === courseId && e.status === 'active').map(e => e.student_id))
    for (const student of snapshot.students.filter(s => active.has(s.id) && s.status === 'active')) {
      const evidence = [
        ...snapshot.observations.filter(o => o.session_id === latest.id && o.student_id === student.id).map(o => ({
          at: o.observed_at, reason: o.result === 'independent' ? '' : o.result === 'with_prompt' ? '提示后完成，建议再观察' : '任务尚未完成，建议再观察', evidence: o.note || latest.observation_target || '课堂任务观察',
        })),
        ...snapshot.learningEvents.filter(e => e.course_id === courseId && e.session_id === latest.id && e.student_id === student.id
          && e.record_status !== 'voided' && e.record_status !== 'corrected' && e.response_status !== 'unobserved'
          && !['absent', 'excused'].includes(e.opportunity_status ?? '') && e.no_response_reason !== 'absent'
          && (e.response_status || e.needs_review || ['voluntary_answer', 'random_call'].includes(e.source) || performanceDimensions.some(([key]) => typeof e[key] === 'number'))
          && (!e.client_event_id || !mirrored.has(e.client_event_id))).map(e => ({
          at: e.occurred_at, reason: e.needs_review ? '已标记需要复核' : ['no_response', 'declined'].includes(e.response_status ?? '') ? '本次未回应，建议再观察' : '', evidence: e.teacher_note || e.activity_label,
        })),
        ...snapshot.attempts.filter(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === latest.id
          && (a.student_id === student.id || (!a.student_id && a.student_code === student.student_code))
          && a.record_status !== 'voided' && a.record_status !== 'corrected' && a.no_response_reason !== 'absent' && ['answered', 'not_answered'].includes(a.outcome)).map(a => ({
          at: a.completed_at || a.drawn_at, reason: a.outcome === 'not_answered' ? '本次未回应，建议再观察' : a.performance_level === 'needs_support' ? '本次需要支持，建议再观察' : '', evidence: a.note || a.task_prompt || a.task_target || '抽问记录',
        })),
      ].sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0))
      const handled = snapshot.followups.some(f => f.course_id === courseId && f.student_id === student.id && f.session_id === latest.id
        && f.kind === 'reobserve' && f.status === 'completed' && f.completed_at
        && (!evidence.length || Date.parse(f.completed_at) >= Date.parse(evidence[0].at)))
      if (handled) continue
      if (evidence[0]?.reason) ensure(student.id).observation = evidence[0]
      else if (!evidence.length) {
        const absent = snapshot.attendance.some(a => a.session_id === latest.id && a.student_id === student.id && ['absent', 'excused'].includes(a.status))
          || snapshot.attendanceExceptions?.some(a => a.session_id === latest.id && a.student_id === student.id && ['absent', 'excused'].includes(a.observed_status))
        const recordedAbsence = snapshot.learningEvents.some(e => e.course_id === courseId && e.session_id === latest.id && e.student_id === student.id
          && e.record_status !== 'corrected' && e.record_status !== 'voided' && (['absent', 'excused'].includes(e.opportunity_status ?? '') || e.no_response_reason === 'absent'))
          || snapshot.attempts.some(a => a.course_id === courseId && a.randomizer_sessions?.class_session_id === latest.id
            && (a.student_id === student.id || (!a.student_id && a.student_code === student.student_code))
            && a.record_status !== 'corrected' && a.record_status !== 'voided' && a.outcome !== 'undone' && a.no_response_reason === 'absent')
        if (!absent && !recordedAbsence) ensure(student.id).observation = { reason: '未观察：没有有效口语记录', evidence: latest.observation_target || latest.topic || '最近一堂课' }
      }
    }
  }
  const items = [...rows.values()].sort((a, b) => Number(!a.followups.length) - Number(!b.followups.length)
    || (a.followups.map(f => f.due_on || '9999').sort()[0] || '9999').localeCompare(b.followups.map(f => f.due_on || '9999').sort()[0] || '9999')
    || a.seat - b.seat || (a.studentId || '').localeCompare(b.studentId || ''))
  for (const item of items) item.followups.sort((a, b) => (a.due_on || '9999').localeCompare(b.due_on || '9999'))
  return { latest, items }
}
