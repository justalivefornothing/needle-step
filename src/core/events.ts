/**
 * Shared event vocabulary for every matcher.
 *
 * A matcher is a generator over (text, pattern) that yields one StepEvent per
 * observable action. The UI consumes them one at a time; `runToEnd` drains a
 * generator for tests and the race counters.
 *
 * Indices: `i` is always an index into the text, `j` into the pattern, and
 * `shift` is the alignment (text index the pattern's first cell sits under).
 */

export type AlgoId = 'naive' | 'kmp' | 'horspool' | 'rabinKarp'

export const ALGO_IDS: readonly AlgoId[] = ['naive', 'kmp', 'horspool', 'rabinKarp']

export const ALGO_NAMES: Record<AlgoId, string> = {
  naive: 'Naive',
  kmp: 'Knuth-Morris-Pratt',
  horspool: 'Boyer-Moore-Horspool',
  rabinKarp: 'Rabin-Karp',
}

export const ALGO_SHORT: Record<AlgoId, string> = {
  naive: 'Naive',
  kmp: 'KMP',
  horspool: 'Horspool',
  rabinKarp: 'Rabin-Karp',
}

/** A table lookup that justified a shift (failure table or bad-character table). */
export interface Lookup {
  table: 'failure' | 'badChar'
  key: number | string
  value: number
}

export interface CompareEvent {
  type: 'compare'
  shift: number
  i: number
  j: number
  equal: boolean
  line: number
}

export interface MismatchEvent {
  type: 'mismatch'
  shift: number
  i: number
  j: number
  /** Rabin-Karp only: hashes agreed but the characters did not. */
  spurious?: boolean
  line: number
}

export interface ShiftEvent {
  type: 'shift'
  from: number
  to: number
  by: number
  lookup?: Lookup
  line: number
}

export interface MatchEvent {
  type: 'match'
  shift: number
  line: number
}

export interface HashEvent {
  type: 'hash'
  shift: number
  hash: number
  target: number
  equal: boolean
  /** Present when the hash was rolled from the previous window. */
  roll?: { prev: number; out: string; in: string }
  line: number
}

export type StepEvent = CompareEvent | MismatchEvent | ShiftEvent | MatchEvent | HashEvent

export type Matcher = (text: string, pattern: string) => Generator<StepEvent, void, void>

export interface MatchResult {
  matches: number[]
  comparisons: number
  shifts: number
  spurious: number
  events: number
}

/** Drain a matcher and total up what it did. */
export function runToEnd(gen: Iterable<StepEvent>): MatchResult {
  const r: MatchResult = { matches: [], comparisons: 0, shifts: 0, spurious: 0, events: 0 }
  for (const e of gen) {
    r.events++
    switch (e.type) {
      case 'compare':
        r.comparisons++
        break
      case 'shift':
        r.shifts++
        break
      case 'match':
        r.matches.push(e.shift)
        break
      case 'mismatch':
        if (e.spurious) r.spurious++
        break
      case 'hash':
        break
    }
  }
  return r
}
