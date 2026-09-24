'use client'

import { useState, useTransition } from 'react'
import { PencilSimpleIcon, CheckIcon, XIcon, SpinnerIcon } from '@phosphor-icons/react'
import { updateMemberCard } from '@/lib/actions/phase.actions'
import { updateMemberCardSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type CardData = { currentPage: number; comment: string | null } | null

type Props = {
  userId: string
  name: string | null
  image: string | null
  card: CardData
  phaseEndPage: number
  isCurrentUser: boolean
  phaseId: string
  onUpdate: (data: { currentPage: number; comment: string | null }) => void
}

export const MemberCardItem = ({
  name,
  image,
  card,
  phaseEndPage,
  isCurrentUser,
  phaseId,
  onUpdate,
}: Props) => {
  const [editing, setEditing] = useState(false)
  const [editPage, setEditPage] = useState(String(card?.currentPage ?? 0))
  const [editComment, setEditComment] = useState(card?.comment ?? '')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const initial = name?.charAt(0).toUpperCase() ?? '?'
  const progress = card && phaseEndPage > 0 ? (card.currentPage / phaseEndPage) * 100 : 0

  const handleEdit = () => {
    setEditPage(String(card?.currentPage ?? 0))
    setEditComment(card?.comment ?? '')
    setServerError(null)
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setServerError(null)
  }

  const handleSave = () => {
    const pageNum = parseInt(editPage, 10)
    const validation = updateMemberCardSchema.safeParse({
      phaseId,
      currentPage: isNaN(pageNum) ? 0 : pageNum,
      comment: editComment || undefined,
    })
    if (!validation.success) {
      setServerError(validation.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setServerError(null)
    startTransition(async () => {
      const res = await updateMemberCard(validation.data)
      if ('error' in res) {
        setServerError(res.error)
      } else {
        onUpdate({
          currentPage: validation.data.currentPage,
          comment: editComment || null,
        })
        setEditing(false)
      }
    })
  }

  return (
    <div className="border border-border p-4 flex flex-col gap-3 bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name ?? ''}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-mono text-xs shrink-0">
            {initial}
          </div>
        )}
        <span className="text-sm font-medium truncate flex-1">{name ?? 'Unknown'}</span>
        {isCurrentUser && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs shrink-0"
            onClick={handleEdit}
          >
            <PencilSimpleIcon size={12} />
            Edit
          </Button>
        )}
      </div>

      {/* Read view */}
      {!editing && (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              Page {card?.currentPage ?? 0} of {phaseEndPage}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {card?.comment ?? 'No thoughts shared yet.'}
          </p>
        </>
      )}

      {/* Inline edit */}
      {editing && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Current Page
            </label>
            <Input
              type="number"
              min={0}
              max={phaseEndPage}
              value={editPage}
              onChange={(e) => setEditPage(e.target.value)}
              disabled={isPending}
              className="h-7 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Thoughts
            </label>
            <Textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Share your takeaway…"
              disabled={isPending}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
          {serverError && (
            <p className="text-xs text-destructive">{serverError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <SpinnerIcon size={12} className="animate-spin" />
              ) : (
                <CheckIcon size={12} />
              )}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleCancel}
              disabled={isPending}
            >
              <XIcon size={12} />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
