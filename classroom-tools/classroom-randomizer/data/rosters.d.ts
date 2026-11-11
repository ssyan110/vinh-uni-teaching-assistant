export {}
declare global {
  var RandomizerRosters: {
    version: string
    classes: Record<'LT_01' | 'LT_02' | 'LT_03', readonly { studentCode: string; name: string; seatNumber: string }[]>
  }
}
