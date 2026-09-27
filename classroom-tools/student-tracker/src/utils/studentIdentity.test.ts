import { expect, test } from 'vitest'
import { studentCodeLastFour } from './studentIdentity'

test('shows the last four digits of a student code and no roster-order fallback', () => {
  expect(studentCodeLastFour('VN-2026-004812')).toBe('4812')
  expect(studentCodeLastFour('１２３４５')).toBe('2345')
  expect(studentCodeLastFour(null)).toBe('—')
})
