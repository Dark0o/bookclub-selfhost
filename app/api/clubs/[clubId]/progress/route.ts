import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { summarizeClubProgress } from '@/lib/progress'

/**
 * GET /api/clubs/:clubId/progress — the club's reading progress as JSON, for the weekly digest
 * email and the mobile widget. Same data as the Progress tab.
 */
export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clubId } = await params

  const club = await db.club.findUnique({
    where: { id: clubId },
    include: {
      readingPhases: { orderBy: { weekIndex: 'asc' }, include: { memberCards: true } },
      memberships: { select: { userId: true } },
    },
  })
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 })

  const cards = club.readingPhases.flatMap((p) =>
    p.memberCards.map((c) => ({ userId: c.userId, phaseId: c.phaseId, currentPage: c.currentPage }))
  )
  const summary = summarizeClubProgress(
    club.readingPhases,
    club.memberships.map((m) => m.userId),
    cards
  )

  return NextResponse.json({ clubId, ...summary })
}
