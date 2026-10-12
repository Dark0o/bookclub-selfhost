import { describe, expect, it } from 'vitest'
import { memberPhaseProgress, pagesInPhase, summarizeClubProgress } from '../progress'

const phase = { id: 'p1', weekIndex: 0, startUnit: 101, endUnit: 200 }

describe('pagesInPhase', () => {
  it('counts both ends', () => {
    expect(pagesInPhase(phase)).toBe(100)
    expect(pagesInPhase({ ...phase, startUnit: 5, endUnit: 5 })).toBe(1)
  })
})

describe('memberPhaseProgress', () => {
  it('is zero before the phase starts', () => {
    const p = memberPhaseProgress(phase, { userId: 'u1', phaseId: 'p1', currentPage: 50 })
    expect(p.pagesRead).toBe(0)
    expect(p.percent).toBe(0)
  })

  it('counts pages read within the phase', () => {
    const p = memberPhaseProgress(phase, { userId: 'u1', phaseId: 'p1', currentPage: 150 })
    expect(p.pagesRead).toBe(50)
    expect(p.percent).toBe(50)
  })

  it('treats a missing card as no progress', () => {
    expect(memberPhaseProgress(phase, undefined).percent).toBe(0)
  })
})

describe('summarizeClubProgress', () => {
  it('averages member progress per phase', () => {
    const summary = summarizeClubProgress(
      [phase],
      ['u1', 'u2'],
      [{ userId: 'u1', phaseId: 'p1', currentPage: 150 }]
    )
    expect(summary.phases[0]).toMatchObject({ memberCount: 2, averagePercent: 25 })
    expect(summary.members).toHaveLength(2)
  })
})
