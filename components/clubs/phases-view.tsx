'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMemberCards } from '@/lib/actions/phase.actions'
import type { QuestionRecord } from '@/lib/actions/question.actions'
import { MemberCardItem } from '@/components/clubs/member-card-item'
import { QuestionPool } from '@/components/clubs/question-pool'
import { ClosePhaseModal } from '@/components/clubs/close-phase-modal'
import { cn } from '@/lib/utils'

type Phase = {
  id: string
  weekIndex: number
  startUnit: number
  endUnit: number
  isOpen: boolean
}

type Member = {
  user: { id: string; name: string | null; image: string | null }
}

type MemberCardRecord = {
  userId: string
  currentPage: number
  comment: string | null
}

type Props = {
  phases: Phase[]
  memberships: Member[]
  initialMemberCards: MemberCardRecord[]
  initialQuestions: QuestionRecord[] | undefined
  currentUserId: string
  userRole: 'MEMBER' | 'MODERATOR'
  isAdmin: boolean
  clubId: string
  defaultPhaseId: string
}

export const PhasesView = ({
  phases,
  memberships,
  initialMemberCards,
  initialQuestions,
  currentUserId,
  userRole,
  isAdmin,
  clubId,
  defaultPhaseId,
}: Props) => {
  const router = useRouter()
  const [selectedPhaseId, setSelectedPhaseId] = useState(defaultPhaseId)
  const [closePhaseOpen, setClosePhaseOpen] = useState(false)
  const queryClient = useQueryClient()

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? phases[0]
  const openPhaseIndex = phases.find((p) => p.isOpen)?.weekIndex ?? -1

  const { data: memberCards } = useQuery({
    queryKey: ['member-cards', selectedPhaseId],
    queryFn: () => getMemberCards(selectedPhaseId),
    initialData: selectedPhaseId === defaultPhaseId ? initialMemberCards : undefined,
    refetchInterval: 60_000,
  })

  const handleCardUpdate = (
    userId: string,
    data: { currentPage: number; comment: string | null }
  ) => {
    queryClient.setQueryData<MemberCardRecord[]>(
      ['member-cards', selectedPhaseId],
      (old) => {
        if (!old) return [{ userId, ...data }]
        const exists = old.some((c) => c.userId === userId)
        if (exists) return old.map((c) => (c.userId === userId ? { ...c, ...data } : c))
        return [...old, { userId, ...data }]
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Phase selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {phases.map((phase) => {
          const accessible = phase.isOpen || phase.weekIndex < openPhaseIndex
          const isSelected = phase.id === selectedPhaseId
          return (
            <button
              key={phase.id}
              disabled={!accessible}
              onClick={() => {
                if (accessible) setSelectedPhaseId(phase.id)
              }}
              className={cn(
                'font-mono text-xs px-3 py-1.5 border transition-colors',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : accessible
                    ? 'border-border text-foreground hover:bg-muted cursor-pointer'
                    : 'border-border text-muted-foreground cursor-not-allowed opacity-40'
              )}
            >
              Phase {phase.weekIndex + 1}
            </button>
          )
        })}
        {isAdmin && selectedPhase?.isOpen && (
          <button
            onClick={() => setClosePhaseOpen(true)}
            className="ml-auto font-mono text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            Close Phase
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Left — Member Cards */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
            Member Cards
          </p>
          <div className="grid grid-cols-2 gap-3">
            {memberships.map(({ user }) => {
              const card = memberCards?.find((c) => c.userId === user.id) ?? null
              return (
                <MemberCardItem
                  key={user.id}
                  userId={user.id}
                  name={user.name}
                  image={user.image}
                  card={card}
                  phaseEndPage={selectedPhase?.endUnit ?? 0}
                  isCurrentUser={user.id === currentUserId}
                  phaseId={selectedPhaseId}
                  onUpdate={(data) => handleCardUpdate(user.id, data)}
                />
              )
            })}
          </div>
        </div>

        {/* Right — Question Pool */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
            Question Pool
          </p>
          <QuestionPool
            phaseId={selectedPhaseId}
            phaseIsOpen={selectedPhase?.isOpen ?? false}
            initialQuestions={selectedPhaseId === defaultPhaseId ? initialQuestions : undefined}
            currentUserId={currentUserId}
            userRole={userRole}
            clubId={clubId}
          />
        </div>
      </div>

      <ClosePhaseModal
        phaseId={selectedPhaseId}
        phaseIndex={(selectedPhase?.weekIndex ?? 0) + 1}
        open={closePhaseOpen}
        onOpenChange={setClosePhaseOpen}
        onSuccess={() => {
          setClosePhaseOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
