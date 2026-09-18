import type { LearningEvent } from '../types'

export const performanceDimensions = [
  ['task_completion', '完成任務'], ['comprehensibility', '表達清楚'],
  ['language_control', '語言運用'], ['interaction', '互動回應'],
] as const
export const learningSourceLabels = { class_observation: '課堂觀察', random_call: '隨機抽問', voluntary_answer: '自願發言' }

export function includedInSummary(event: LearningEvent) {
  return event.record_status !== 'voided' && event.counted_for_summary !== false
    && !['no_response', 'declined', 'unobserved'].includes(event.response_status ?? '')
}
