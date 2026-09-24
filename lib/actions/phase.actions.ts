'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  updateMemberCardSchema,
  type UpdateMemberCardInput,
  closePhaseSchema,
  type ClosePhaseInput,
} from '@/lib/validations'

export const getMemberCards = async (phaseId: string) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return []

  return db.memberCard.findMany({
    where: { phaseId },
    select: { userId: true, currentPage: true, comment: true },
  })
}

type UpdateMemberCardResult = { success: true } | { error: string }

export const updateMemberCard = async (
  input: UpdateMemberCardInput
): Promise<UpdateMemberCardResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = updateMemberCardSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { phaseId, currentPage, comment } = parsed.data

  const phase = await db.readingPhase.findUnique({
    where: { id: phaseId },
    include: {
      club: { include: { memberships: { where: { userId: session.user.id } } } },
    },
  })
  if (!phase) return { error: 'Phase not found' }
  if (phase.club.memberships.length === 0) return { error: 'Not a member' }
  if (currentPage > phase.endUnit) return { error: `Page cannot exceed ${phase.endUnit}` }

  try {
    await db.memberCard.upsert({
      where: { userId_phaseId: { userId: session.user.id, phaseId } },
      create: { userId: session.user.id, phaseId, currentPage, comment: comment ?? null },
      update: { currentPage, comment: comment ?? null },
    })

    revalidatePath(`/clubs/${phase.clubId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to update card. Please try again.' }
  }
}

export const closePhase = async (input: ClosePhaseInput): Promise<{ success: true } | { error: string }> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = closePhaseSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { phaseId, approvedQuestionIds } = parsed.data

  const phase = await db.readingPhase.findUnique({
    where: { id: phaseId },
    include: {
      club: { include: { memberships: { where: { userId: session.user.id } } } },
    },
  })
  if (!phase) return { error: 'Phase not found' }
  const membership = phase.club.memberships[0]
  if (!membership || membership.role !== 'MODERATOR') return { error: 'Unauthorized' }

  try {
    await db.$transaction(async (tx) => {
      await tx.readingPhase.update({ where: { id: phaseId }, data: { isOpen: false } })

      const nextPhase = await tx.readingPhase.findFirst({
        where: { clubId: phase.clubId, weekIndex: phase.weekIndex + 1 },
      })
      if (nextPhase) {
        await tx.readingPhase.update({ where: { id: nextPhase.id }, data: { isOpen: true } })
      }

      if (approvedQuestionIds.length > 0) {
        await tx.question.updateMany({
          where: { id: { in: approvedQuestionIds }, phaseId },
          data: { status: 'APPROVED' },
        })
      }
    })

    revalidatePath(`/clubs/${phase.clubId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to close phase. Please try again.' }
  }
}
