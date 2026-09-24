import { describe, expect, it } from 'vitest'
import { createClubSchema, launchClubSchema } from '../club.schema'

const validClub = {
  name: 'Tuesday Readers',
  bookTitle: 'The Left Hand of Darkness',
  bookAuthor: 'Ursula K. Le Guin',
  totalPages: 304,
  numberOfWeeks: 4,
}

describe('createClubSchema', () => {
  it('accepts a valid club without a description', () => {
    expect(createClubSchema.safeParse(validClub).success).toBe(true)
  })

  it.each([
    ['empty name', { name: '' }],
    ['empty book title', { bookTitle: '' }],
    ['zero pages', { totalPages: 0 }],
    ['fractional pages', { totalPages: 10.5 }],
    ['zero weeks', { numberOfWeeks: 0 }],
    ['more than 52 weeks', { numberOfWeeks: 53 }],
  ])('rejects %s', (_, override) => {
    expect(createClubSchema.safeParse({ ...validClub, ...override }).success).toBe(false)
  })
})

describe('launchClubSchema', () => {
  const clubId = 'cjld2cjxh0000qzrmn831i7rn'

  it('accepts a start date of today', () => {
    expect(launchClubSchema.safeParse({ clubId, startDate: new Date() }).success).toBe(true)
  })

  it('rejects a start date in the past', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(launchClubSchema.safeParse({ clubId, startDate: yesterday }).success).toBe(false)
  })
})
