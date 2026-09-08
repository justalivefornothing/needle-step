import { describe, expect, it } from 'vitest'
import {
  ALGO_IDS,
  HASH_MOD,
  RollingHash,
  createMatcher,
  horspool,
  horspoolShiftTable,
  kmp,
  kmpFailureTable,
  naive,
  rabinKarp,
  runToEnd,
  type StepEvent,
} from './index'

/** Reference answer: every index where pattern occurs in text. */
function bruteForce(text: string, pattern: string): number[] {
  const out: number[] = []
  for (let s = 0; s + pattern.length <= text.length; s++) {
    if (text.startsWith(pattern, s)) out.push(s)
  }
  return out
}

describe('kmpFailureTable', () => {
  it('matches the textbook prefix function', () => {
    expect(kmpFailureTable('ABABCABAB')).toEqual([0, 0, 1, 2, 0, 1, 2, 3, 4])
  })
  it('handles degenerate patterns', () => {
    expect(kmpFailureTable('')).toEqual([])
    expect(kmpFailureTable('A')).toEqual([0])
    expect(kmpFailureTable('AAAA')).toEqual([0, 1, 2, 3])
    expect(kmpFailureTable('ABCD')).toEqual([0, 0, 0, 0])
  })
})

describe('kmp', () => {
  it('finds the CLRS example with at most 2n comparisons', () => {
    const r = runToEnd(kmp('ABABDABACDABABCABAB', 'ABABCABAB'))
    expect(r.matches).toEqual([10])
    expect(r.comparisons).toBeLessThanOrEqual(2 * 19)
  })
  it('never moves the text index backwards', () => {
    let last = -1
    for (const e of kmp('AAAAAAAAAB', 'AAAB')) {
      if (e.type === 'compare') {
        expect(e.i).toBeGreaterThanOrEqual(last)
        last = e.i
      }
    }
  })
  it('reports overlapping matches', () => {
    expect(runToEnd(kmp('AAAA', 'AA')).matches).toEqual([0, 1, 2])
  })
})

describe('horspoolShiftTable', () => {
  it('matches the EXAMPLE table', () => {
    const s = horspoolShiftTable('EXAMPLE')
    expect(s.get('E')).toBe(6)
    expect(s.get('L')).toBe(1)
    expect(s.get('P')).toBe(2)
    expect(s.default).toBe(7)
    expect(s.get('Z')).toBe(7)
  })
})

describe('horspool', () => {
  it('leaps by the pattern length on foreign characters', () => {
    const shifts = [...horspool('zzzzzzzzzabc', 'abc')].filter(
      (e): e is Extract<StepEvent, { type: 'shift' }> => e.type === 'shift',
    )
    expect(shifts.map((e) => e.by)).toEqual([3, 3, 3])
    expect(runToEnd(horspool('zzzzzzzzzabc', 'abc')).matches).toEqual([9])
  })
  it('uses far fewer comparisons than naive on an English sentence', () => {
    const text = 'the quick brown fox jumps over the lazy dog while another fox naps'
    const h = runToEnd(horspool(text, 'fox'))
    const nv = runToEnd(naive(text, 'fox'))
    expect(h.matches).toEqual(nv.matches)
    expect(h.comparisons).toBeLessThan(nv.comparisons / 2)
  })
})

describe('naive', () => {
  it('counts every comparison on overlapping matches', () => {
    const r = runToEnd(naive('aaaaaa', 'aaa'))
    expect(r.matches).toEqual([0, 1, 2, 3])
    expect(r.comparisons).toBe(12)
  })
  it('yields nothing for an empty or oversized pattern', () => {
    expect(runToEnd(naive('abc', '')).events).toBe(0)
    expect(runToEnd(naive('ab', 'abc')).events).toBe(0)
  })
})

describe('RollingHash', () => {
  it('rolls to the same value as hashing the new window', () => {
    const h = new RollingHash(3)
    expect(h.roll(h.hashOf('abc'), 'a', 'd')).toBe(h.hashOf('bcd'))
  })
  it('stays inside the modulus across a long roll', () => {
    const h = new RollingHash(8)
    const text = 'GATTACAGATTACAGATTACA'
    let hash = h.hashOf(text.slice(0, 8))
    for (let s = 0; s + 8 < text.length; s++) {
      hash = h.roll(hash, text[s], text[s + 8])
      expect(hash).toBe(h.hashOf(text.slice(s + 1, s + 9)))
      expect(hash).toBeGreaterThanOrEqual(0)
      expect(hash).toBeLessThan(HASH_MOD)
    }
  })
  it('honours a custom modulus', () => {
    const h = new RollingHash(2, 257, 101)
    expect(h.hashOf('ab')).toBe((97 * 257 + 98) % 101)
  })
})

describe('rabinKarp', () => {
  it('finds all matches and flags spurious hits with a tiny modulus', () => {
    const text = 'abracadabra abracadabra'
    const r = runToEnd(rabinKarp(text, 'abra', { mod: 7 }))
    expect(r.matches).toEqual(bruteForce(text, 'abra'))
    expect(r.spurious).toBeGreaterThan(0)
  })
  it('has no spurious hits with the default modulus on plain text', () => {
    const r = runToEnd(rabinKarp('the fox and the box and the fox', 'fox'))
    expect(r.matches).toEqual([4, 28])
    expect(r.spurious).toBe(0)
  })
})

describe('all matchers agree with brute force', () => {
  const cases: [string, string][] = [
    ['ATGCGATTACGCTTGAGGATTACAGCATGATTACGGCTAGATTACATCGGATTAC', 'GATTACA'],
    ['A'.repeat(50), 'AAAB'],
    ['A'.repeat(50), 'AAAA'],
    ['abcabcabd', 'abcabd'],
    ['mississippi', 'issi'],
    ['xyz', 'xyz'],
    ['xyz', 'q'],
  ]
  for (const algo of ALGO_IDS) {
    it(algo, () => {
      for (const [text, pattern] of cases) {
        const r = runToEnd(createMatcher(algo, text, pattern))
        expect(r.matches, `${algo} on ${text}/${pattern}`).toEqual(bruteForce(text, pattern))
      }
    })
  }
})

describe('event indices are consistent', () => {
  for (const algo of ALGO_IDS) {
    it(`${algo}: every compare sits at i = shift + j and shifts chain`, () => {
      let shift = 0
      for (const e of createMatcher(algo, 'GATTACAGATTAGATTACA', 'GATTACA')) {
        if (e.type === 'compare' || e.type === 'mismatch') {
          expect(e.i).toBe(e.shift + e.j)
          expect(e.shift).toBe(shift)
        } else if (e.type === 'shift') {
          expect(e.from).toBe(shift)
          expect(e.to - e.from).toBe(e.by)
          expect(e.by).toBeGreaterThan(0)
          shift = e.to
        } else {
          expect(e.shift).toBe(shift)
        }
      }
    })
  }
})
