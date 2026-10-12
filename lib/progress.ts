export type PhaseBounds = {
  id: string
  weekIndex: number
  startUnit: number
  endUnit: number
}

export type CardProgress = {
  userId: string
  phaseId: string
  currentPage: number
}

export type MemberPhaseProgress = {
  userId: string
  phaseId: string
  pagesRead: number
  pagesInPhase: number
  percent: number
  finished: boolean
}

export type ClubProgressSummary = {
  phases: Array<{
    phaseId: string
    weekIndex: number
    finishedCount: number
    memberCount: number
    averagePercent: number
  }>
  members: MemberPhaseProgress[]
}

/** Pages a phase covers, both ends inclusive. */
export const pagesInPhase = (phase: PhaseBounds): number => phase.endUnit - phase.startUnit + 1

/**
 * Progress of one member through one phase. A member who has not reached the phase yet has read
 * nothing of it; the percentage is capped at 100.
 */
export const memberPhaseProgress = (
  phase: PhaseBounds,
  card: CardProgress | undefined
): MemberPhaseProgress => {
  const total = pagesInPhase(phase)
  const currentPage = card?.currentPage ?? 0
  const pagesRead = Math.min(total, Math.max(0, currentPage - phase.startUnit + 1))
  return {
    userId: card?.userId ?? '',
    phaseId: phase.id,
    pagesRead,
    pagesInPhase: total,
    percent: total > 0 ? Math.round((pagesRead / total) * 100) : 0,
    finished: currentPage > phase.endUnit,
  }
}

/** Per-phase completion and per-member progress for a club. */
export const summarizeClubProgress = (
  phases: PhaseBounds[],
  memberIds: string[],
  cards: CardProgress[]
): ClubProgressSummary => {
  const byKey = new Map(cards.map((c) => [`${c.userId}:${c.phaseId}`, c]))
  const members: MemberPhaseProgress[] = []
  const summary = phases.map((phase) => {
    const rows = memberIds.map((userId) => ({
      ...memberPhaseProgress(phase, byKey.get(`${userId}:${phase.id}`)),
      userId,
    }))
    members.push(...rows)
    const finishedCount = rows.filter((r) => r.finished).length
    const averagePercent =
      rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length) : 0
    return {
      phaseId: phase.id,
      weekIndex: phase.weekIndex,
      finishedCount,
      memberCount: rows.length,
      averagePercent,
    }
  })
  return { phases: summary, members }
}
