import { expect, test } from 'vitest'
import { includedInSummary } from './learningEvents'
import type { LearningEvent, NoResponseReason, RandomizerAttempt } from '../types'

test('summary excludes withdrawn and unobserved records but preserves genuine zero scores', () => {
  const event = { task_completion: 0, response_status: 'answered' } as LearningEvent
  expect(includedInSummary(event)).toBe(true)
  expect(includedInSummary({...event, record_status:'corrected'})).toBe(true)
  expect(includedInSummary({...event, record_status:'corrected', counted_for_summary:false})).toBe(false)
  expect(includedInSummary({...event, record_status:'voided'})).toBe(false)
  expect(includedInSummary({...event, counted_for_summary:false})).toBe(false)
  expect(includedInSummary({...event, response_status:'unobserved'})).toBe(false)
  expect(includedInSummary({...event, response_status:'no_response'})).toBe(false)
})

test('supports absence as a no-response reason on both classroom record shapes', () => {
  const reason: NoResponseReason = 'absent'
  const learningEvent = { no_response_reason: reason } as LearningEvent
  const randomizerAttempt = { no_response_reason: reason } as RandomizerAttempt
  expect(learningEvent.no_response_reason).toBe('absent')
  expect(randomizerAttempt.no_response_reason).toBe('absent')
})
