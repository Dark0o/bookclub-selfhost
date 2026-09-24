import { z } from 'zod'

export const createClubSchema = z.object({
  name: z.string().min(1, 'Club name is required').max(100),
  description: z.string().max(500).optional(),
  bookTitle: z.string().min(1, 'Book title is required').max(200),
  bookAuthor: z.string().min(1, 'Book author is required').max(200),
  totalPages: z.number().int().min(1, 'Total pages must be at least 1'),
  numberOfWeeks: z.number().int().min(1, 'At least 1 week required').max(52, 'Max 52 weeks'),
})

export type CreateClubInput = z.infer<typeof createClubSchema>

export const updateClubSchema = createClubSchema.extend({
  clubId: z.string().cuid(),
})

export type UpdateClubInput = z.infer<typeof updateClubSchema>

export const launchClubSchema = z.object({
  clubId: z.string().cuid(),
  startDate: z.date().refine(
    (d) => d >= new Date(new Date().setHours(0, 0, 0, 0)),
    { message: 'Start date must be today or in the future' }
  ),
})

export type LaunchClubInput = z.infer<typeof launchClubSchema>
