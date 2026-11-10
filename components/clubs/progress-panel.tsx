'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircleIcon, SpinnerIcon } from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getClubProgress } from '@/lib/actions/progress.actions'
import { markPhaseFinished } from '@/lib/actions/phase.actions'
import type { ClubProgressSummary } from '@/lib/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/clubs/progress-bar'

type Member = { id: string; name: string | null }

type Props = {
  clubId: string
  currentUserId: string
  openPhaseId: string | null
  members: Member[]
  initialProgress: ClubProgressSummary
}

export const ProgressPanel = ({
  clubId,
  currentUserId,
  openPhaseId,
  members,
  initialProgress,
}: Props) => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { data: progress } = useQuery({
    queryKey: ['club-progress', clubId],
    queryFn: async () => {
      const result = await getClubProgress(clubId)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    initialData: initialProgress,
  })

  const names = useMemo(() => new Map(members.map((m) => [m.id, m.name ?? 'Unknown'])), [members])

  const myOpenPhase = progress.members.find(
    (m) => m.userId === currentUserId && m.phaseId === openPhaseId
  )

  const handleFinish = () => {
    if (!openPhaseId) return
    setError(null)
    startTransition(async () => {
      const result = await markPhaseFinished({ phaseId: openPhaseId })
      if ('error' in result) {
        setError(result.error)
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['club-progress', clubId] })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {openPhaseId && myOpenPhase && !myOpenPhase.finished && (
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleFinish} disabled={isPending}>
            {isPending ? <SpinnerIcon className="animate-spin" /> : <CheckCircleIcon />}
            I finished this week&apos;s reading
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {progress.phases.map((phase) => (
        <Card key={phase.phaseId}>
          <CardHeader>
            <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
              Week {phase.weekIndex + 1} · {phase.finishedCount}/{phase.memberCount} finished
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ProgressBar percent={phase.averagePercent} />
            <ul className="flex flex-col gap-2">
              {progress.members
                .filter((m) => m.phaseId === phase.phaseId)
                .map((m) => (
                  <li key={m.userId} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3">
                    <span className="text-sm truncate">{names.get(m.userId) ?? 'Unknown'}</span>
                    <ProgressBar percent={m.percent} finished={m.finished} />
                    <span className="font-mono text-xs text-muted-foreground text-right">
                      {m.percent}%
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
