export function studentCodeLastFour(studentCode: string | null | undefined): string {
  const digits = String(studentCode ?? '').normalize('NFKC').replace(/\D/g, '')
  return digits.slice(-4) || '—'
}
