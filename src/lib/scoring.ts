// Describer earns all points. Guesser tracking is a future feature (see TASKS.md backlog).
// Correct, no hint: +2 | Correct, hint revealed: +1 | Pass: 0
export function awardPoints(
  scores: Record<string, number>,
  describerName: string,
  hintUsed = false,
): Record<string, number> {
  const updated = { ...scores }
  updated[describerName] = (updated[describerName] ?? 0) + (hintUsed ? 1 : 2)
  return updated
}
