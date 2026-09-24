import { describe, expect, it } from 'vitest'
import { splitIntoPhases } from '../phases'

describe('splitIntoPhases', () => {
  it('splits pages evenly across weeks', () => {
    expect(splitIntoPhases(300, 3)).toEqual([
      { weekIndex: 0, startUnit: 1, endUnit: 100 },
      { weekIndex: 1, startUnit: 101, endUnit: 200 },
      { weekIndex: 2, startUnit: 201, endUnit: 300 },
    ])
  })

  it('gives the remainder to the last week', () => {
    const phases = splitIntoPhases(322, 4)
    expect(phases.map((p) => [p.startUnit, p.endUnit])).toEqual([
      [1, 80],
      [81, 160],
      [161, 240],
      [241, 322],
    ])
  })

  it('covers every page exactly once', () => {
    const phases = splitIntoPhases(517, 6)
    expect(phases[0]?.startUnit).toBe(1)
    expect(phases.at(-1)?.endUnit).toBe(517)
    phases.slice(1).forEach((phase, i) => {
      expect(phase.startUnit).toBe(phases[i]!.endUnit + 1)
    })
  })

  it('makes one phase for a single week', () => {
    expect(splitIntoPhases(150, 1)).toEqual([{ weekIndex: 0, startUnit: 1, endUnit: 150 }])
  })
})
