import type { AttendanceStatus, FollowupKind, ObservationResult } from '../types'

const labels: Record<AttendanceStatus | ObservationResult | FollowupKind, string> = {
  unconfirmed: '未確認', present: '到課', late: '遲到', absent: '缺席', excused: '請假',
  independent: '獨立完成', with_prompt: '提示後完成', not_yet: '尚未完成',
  reobserve: '再觀察', remind: '提醒', makeup: '補做',
}

export function StatusPill({ value }: { value: keyof typeof labels }) {
  return <span className={`status-pill status-${value}`}>{labels[value]}</span>
}
