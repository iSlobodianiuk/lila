/**
 * Кидок кубика на етапі формування запиту (вхід у гру).
 * На 10-му кидку (індекс 9) — гарантована шістка.
 */
export function rollEntryDice(rollCount: number): number {
  if (rollCount >= 9) return 6;

  const sixProbability = 1 / 6 + rollCount * 0.05;
  if (Math.random() < sixProbability) return 6;
  return Math.floor(Math.random() * 5) + 1;
}

export function rollPlayDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}
