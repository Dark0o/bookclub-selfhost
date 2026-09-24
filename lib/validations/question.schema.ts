import { z } from 'zod'

export const proposeQuestionSchema = z.object({
  phaseId: z.string().cuid(),
  content: z.string().min(10, 'Question must be at least 10 characters').max(500),
})

export type ProposeQuestionInput = z.infer<typeof proposeQuestionSchema>

export const voteOnQuestionSchema = z.object({
  questionId: z.string().cuid(),
})

export type VoteOnQuestionInput = z.infer<typeof voteOnQuestionSchema>

export const pinQuestionSchema = z.object({
  questionId: z.string().cuid(),
  clubId: z.string().cuid(),
})

export type PinQuestionInput = z.infer<typeof pinQuestionSchema>

export const reactToQuestionSchema = z.object({
  questionId: z.string().cuid(),
  emoji: z.string().min(1).max(10),
})

export type ReactToQuestionInput = z.infer<typeof reactToQuestionSchema>
