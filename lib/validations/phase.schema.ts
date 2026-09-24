import { z } from 'zod'

export const updateMemberCardSchema = z.object({
  phaseId: z.string().cuid(),
  currentPage: z.number().int().min(0),
  comment: z.string().max(500).optional(),
})

export type UpdateMemberCardInput = z.infer<typeof updateMemberCardSchema>

export const closePhaseSchema = z.object({
  phaseId: z.string().cuid(),
  approvedQuestionIds: z.array(z.string().cuid()),
})

export type ClosePhaseInput = z.infer<typeof closePhaseSchema>
