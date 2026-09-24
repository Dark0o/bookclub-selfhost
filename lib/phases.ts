export type PhaseRange = {
  weekIndex: number
  startUnit: number
  endUnit: number
}

/**
 * Splits a book's pages into one reading phase per week. Pages are divided equally;
 * the last week absorbs the remainder.
 */
export const splitIntoPhases = (totalPages: number, numberOfWeeks: number): PhaseRange[] => {
  const pagesPerPhase = Math.floor(totalPages / numberOfWeeks)
  return Array.from({ length: numberOfWeeks }, (_, i) => ({
    weekIndex: i,
    startUnit: i * pagesPerPhase + 1,
    endUnit: i === numberOfWeeks - 1 ? totalPages : (i + 1) * pagesPerPhase,
  }))
}
