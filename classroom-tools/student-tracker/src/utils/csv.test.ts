import { describe, expect, it } from 'vitest'
import { parseRosterCsv } from './csv'

describe('parseRosterCsv', () => {
  it('parses Traditional Chinese roster headers', () => {
    const result = parseRosterCsv('學號,中文姓名,原名,座號\nS01,王小明,"Nguyễn, Minh",1')
    expect(result.errors).toEqual([])
    expect(result.rows[0]).toEqual({ student_code: 'S01', chinese_name: '王小明', original_name: 'Nguyễn, Minh', preferred_name: undefined, seat_number: 1 })
  })

  it('rejects rows without required values', () => {
    const result = parseRosterCsv('學號,中文姓名\nS01,')
    expect(result.rows).toEqual([])
    expect(result.errors[0]).toContain('缺少中文姓名')
  })
})
