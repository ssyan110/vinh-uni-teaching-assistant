import { z } from 'zod'
import type { ImportStudentRow } from '../types'

const rosterRow = z.object({
  student_code: z.string().trim().min(1, '缺少學號'),
  chinese_name: z.string().trim().min(1, '缺少中文姓名'),
  original_name: z.string().trim().optional(),
  preferred_name: z.string().trim().optional(),
  seat_number: z.coerce.number().int().positive().optional(),
})

const aliases: Record<string, keyof ImportStudentRow> = {
  學號: 'student_code', student_code: 'student_code', 編號: 'student_code',
  中文姓名: 'chinese_name', 姓名: 'chinese_name', chinese_name: 'chinese_name',
  原名: 'original_name', 越南文姓名: 'original_name', original_name: 'original_name',
  常用名: 'preferred_name', preferred_name: 'preferred_name',
  座號: 'seat_number', seat_number: 'seat_number',
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(current.trim())
      current = ''
    } else current += char
  }
  values.push(current.trim())
  return values
}

export function parseRosterCsv(source: string): { rows: ImportStudentRow[]; errors: string[] } {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['至少需要標題列與一筆學生資料。'] }
  const header = parseCsvLine(lines[0]).map((item) => aliases[item])
  if (!header.includes('student_code') || !header.includes('chinese_name')) return { rows: [], errors: ['標題列必須包含「學號」與「中文姓名」。'] }

  const rows: ImportStudentRow[] = []
  const errors: string[] = []
  lines.slice(1).forEach((line, rowIndex) => {
    const values = parseCsvLine(line)
    const input: Record<string, string | undefined> = {}
    header.forEach((key, columnIndex) => {
      if (!key) return
      const value = values[columnIndex] ?? ''
      input[key] = key === 'student_code' || key === 'chinese_name' ? value : value || undefined
    })
    const parsed = rosterRow.safeParse(input)
    if (parsed.success) rows.push(parsed.data)
    else errors.push(`第 ${rowIndex + 2} 列：${parsed.error.issues.map((issue) => issue.message).join('、')}`)
  })
  return { rows, errors }
}
