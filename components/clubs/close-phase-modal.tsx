'use client'

import { useState, useEffect, useTransition } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getQuestionsByPhase } from '@/lib/actions/question.actions'
import { closePhase } from '@/lib/actions/phase.actions'
import { PushPin, ArrowUp, SpinnerGap } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  phaseId: string
  phaseIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const ClosePhaseModal = ({ phaseId, phaseIndex, open, onOpenChange, onSuccess }: Props) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', phaseId],
    queryFn: () => getQuestionsByPhase(phaseId),
  })

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(questions.map((q) => q.id)))
      setServerError(null)
    }
  }, [open, questions])

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    setServerError(null)
    startTransition(async () => {
      const result = await closePhase({ phaseId, approvedQuestionIds: [...selectedIds] })
      if ('error' in result) {
        setServerError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-base font-semibold">
            Close Phase {phaseIndex}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Select questions to approve for the Grand Library. All questions are pre-selected — uncheck any you want to exclude.
          </p>

          {questions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border">
              No questions were proposed for this phase.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {questions.map((q) => {
                const isSelected = selectedIds.has(q.id)
                return (
                  <button
                    key={q.id}
                    disabled={isPending}
                    onClick={() => toggleQuestion(q.id)}
                    className={cn(
                      'flex items-start gap-2 p-2.5 border text-left transition-colors',
                      isSelected
                        ? 'border-foreground bg-foreground/5'
                        : 'border-border hover:border-foreground/40',
                      isPending && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {q.isPinned && (
                      <PushPin
                        weight="fill"
                        size={11}
                        className="shrink-0 text-muted-foreground mt-0.5"
                      />
                    )}
                    <span className="flex-1 text-xs leading-snug line-clamp-2">{q.content}</span>
                    <span className="flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      <ArrowUp size={9} weight="bold" />
                      {q.upvotesCount}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {serverError && (
            <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending && <SpinnerGap className="animate-spin mr-1" size={14} />}
            {isPending ? 'Closing…' : 'Confirm & Close Phase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
