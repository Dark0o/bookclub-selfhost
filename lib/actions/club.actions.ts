'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { splitIntoPhases } from '@/lib/phases'
import {
  createClubSchema,
  type CreateClubInput,
  updateClubSchema,
  type UpdateClubInput,
  launchClubSchema,
  type LaunchClubInput,
} from '@/lib/validations'

type CreateClubResult =
  | { success: true; data: { clubId: string } }
  | { error: string }

export const createClub = async (input: CreateClubInput): Promise<CreateClubResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = createClubSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { name, description, bookTitle, bookAuthor, totalPages, numberOfWeeks } = parsed.data
  const inviteCode = randomBytes(3).toString('hex').toUpperCase()

  const phases = splitIntoPhases(totalPages, numberOfWeeks)

  try {
    const club = await db.$transaction(async (tx) => {
      const newClub = await tx.club.create({
        data: {
          name,
          description: description ?? null,
          bookTitle,
          bookAuthor,
          totalPages,
          numberOfWeeks,
          inviteCode,
          ownerId: session.user.id,
        },
      })

      await tx.readingPhase.createMany({
        data: phases.map((p) => ({ ...p, clubId: newClub.id })),
      })

      await tx.clubMembership.create({
        data: {
          userId: session.user.id,
          clubId: newClub.id,
          role: 'MODERATOR',
        },
      })

      return newClub
    })

    revalidatePath('/dashboard')
    return { success: true, data: { clubId: club.id } }
  } catch {
    return { error: 'Failed to create club. Please try again.' }
  }
}

type UpdateClubResult = { success: true } | { error: string }

export const updateClub = async (input: UpdateClubInput): Promise<UpdateClubResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = updateClubSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { clubId, name, description, bookTitle, bookAuthor, totalPages, numberOfWeeks } = parsed.data

  const membership = await db.clubMembership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  })
  if (!membership || membership.role !== 'MODERATOR') return { error: 'Unauthorized' }

  const existing = await db.club.findUnique({ where: { id: clubId } })
  if (!existing) return { error: 'Club not found' }

  const phasesChanged =
    existing.totalPages !== totalPages || existing.numberOfWeeks !== numberOfWeeks

  try {
    await db.$transaction(async (tx) => {
      await tx.club.update({
        where: { id: clubId },
        data: { name, description: description ?? null, bookTitle, bookAuthor, totalPages, numberOfWeeks },
      })

      if (phasesChanged) {
        await tx.readingPhase.deleteMany({ where: { clubId } })
        const phases = splitIntoPhases(totalPages, numberOfWeeks).map((p) => ({ ...p, clubId }))
        await tx.readingPhase.createMany({ data: phases })
      }
    })

    revalidatePath(`/clubs/${clubId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to update club. Please try again.' }
  }
}

type JoinClubResult = { success: true; data: { clubId: string } } | { error: string }

export const joinClub = async (clubId: string): Promise<JoinClubResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const club = await db.club.findUnique({ where: { id: clubId } })
  if (!club) return { error: 'Club not found' }
  if (club.status === 'ARCHIVED') return { error: 'This club is no longer accepting members' }

  const existing = await db.clubMembership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  })
  if (existing) return { success: true, data: { clubId } }

  try {
    await db.clubMembership.create({
      data: { userId: session.user.id, clubId, role: 'MEMBER' },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/clubs/${clubId}`)
    return { success: true, data: { clubId } }
  } catch {
    return { error: 'Failed to join club. Please try again.' }
  }
}

type LaunchClubResult = { success: true } | { error: string }

export const launchClub = async (input: LaunchClubInput): Promise<LaunchClubResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = launchClubSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { clubId, startDate } = parsed.data

  const club = await db.club.findUnique({
    where: { id: clubId },
    include: { readingPhases: { orderBy: { weekIndex: 'asc' } } },
  })
  if (!club) return { error: 'Club not found' }
  if (club.ownerId !== session.user.id) return { error: 'Unauthorized' }
  if (club.status !== 'DRAFT') return { error: 'Club is already launched' }

  const firstPhase = club.readingPhases[0]

  try {
    await db.$transaction(async (tx) => {
      await tx.club.update({
        where: { id: clubId },
        data: { status: 'ACTIVE', startedAt: new Date(startDate) },
      })

      for (const phase of club.readingPhases) {
        const unlockDate = new Date(startDate)
        unlockDate.setDate(unlockDate.getDate() + phase.weekIndex * 7)
        await tx.readingPhase.update({
          where: { id: phase.id },
          data: { unlockDate, isOpen: phase.id === firstPhase?.id },
        })
      }
    })

    revalidatePath(`/clubs/${clubId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to launch club. Please try again.' }
  }
}
