'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { summarizeClubProgress, type CardProgress, type ClubProgressSummary } from '@/lib/progress'

type ClubProgressResult = { success: true; data: ClubProgressSummary } | { error: string }

/** Reading progress of every member of a club, for the Progress tab. Members only. */
export const getClubProgress = async (clubId: string): Promise<ClubProgressResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const club = await db.club.findUnique({
    where: { id: clubId },
    include: {
      readingPhases: { orderBy: { weekIndex: 'asc' } },
      memberships: { select: { userId: true } },
    },
  })
  if (!club) return { error: 'Club not found' }
  if (!club.memberships.some((m) => m.userId === session.user.id)) {
    return { error: 'Not a member' }
  }

  const cards: CardProgress[] = []
  for (const phase of club.readingPhases) {
    const phaseCards = await db.memberCard.findMany({
      where: { phaseId: phase.id },
      select: { userId: true, phaseId: true, currentPage: true },
    })
    cards.push(...phaseCards)
  }

  return {
    success: true,
    data: summarizeClubProgress(
      club.readingPhases,
      club.memberships.map((m) => m.userId),
      cards
    ),
  }
}
