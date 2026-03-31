// Base points: describer +2, guesser +3
// Hint penalty: -1 each when the hint was revealed
export function awardPoints(
  scores: Record<string, number>,
  describerName: string,
  guesserName: string,
  hintUsed = false,
): Record<string, number> {
  const updated = { ...scores }
  const describerPts = hintUsed ? 1 : 2
  const guesserPts   = hintUsed ? 2 : 3
  updated[describerName] = (updated[describerName] ?? 0) + describerPts
  updated[guesserName]   = (updated[guesserName]   ?? 0) + guesserPts
  return updated
}
