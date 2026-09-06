// Demo data must never bundle the real Vinh University roster.
// Production rosters are imported after teacher authentication.
export type RandomizerClassId = 'LT_01' | 'LT_02' | 'LT_03'

const classSizes: Record<RandomizerClassId, number> = { LT_01: 27, LT_02: 30, LT_03: 14 }

export const randomizerRosters = Object.fromEntries(
  (Object.keys(classSizes) as RandomizerClassId[]).map((classId) => [
    classId,
    Array.from({ length: classSizes[classId] }, (_, index) => {
      const seatNumber = String(index + 1)
      return [`DEMO-${classId}-${seatNumber.padStart(2, '0')}`, `示範學生 ${classId.replace('_', ' ')}-${seatNumber}`, seatNumber] as const
    }),
  ]),
) as unknown as Record<RandomizerClassId, readonly [string, string, string][]>
