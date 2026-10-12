import { describe, expect, it } from 'vitest'
import { markPhaseFinishedSchema, updateMemberCardSchema } from '../phase.schema'

const phaseId = 'ckz0000000000000000000001'

describe('markPhaseFinishedSchema', () => {
  it('needs a phase id', () => {
    expect(markPhaseFinishedSchema.safeParse({ phaseId }).success).toBe(true)
    expect(markPhaseFinishedSchema.safeParse({}).success).toBe(false)
    expect(markPhaseFinishedSchema.safeParse({ phaseId: 'week-1' }).success).toBe(false)
  })
})

describe('updateMemberCardSchema', () => {
  it('rejects a negative page', () => {
    expect(updateMemberCardSchema.safeParse({ phaseId, currentPage: -1 }).success).toBe(false)
  })
})
