import type { HashEvent, Lookup, StepEvent } from '../core'

/** Everything the loom needs to draw one moment of a match, folded from events. */
export interface ViewState {
  shift: number
  /** Last comparison in the current alignment. */
  cursor: { i: number; j: number; equal: boolean } | null
  mismatchAt: { i: number; j: number } | null
  /** Pattern indices known to match in the current alignment. */
  matched: number[]
  matches: number[]
  comparisons: number
  shifts: number
  spurious: number
  lookup: Lookup | null
  hash: HashEvent | null
  line: number
  last: StepEvent | null
}

export const INITIAL_VIEW: ViewState = {
  shift: 0,
  cursor: null,
  mismatchAt: null,
  matched: [],
  matches: [],
  comparisons: 0,
  shifts: 0,
  spurious: 0,
  lookup: null,
  hash: null,
  line: 0,
  last: null,
}

export function applyEvent(s: ViewState, e: StepEvent): ViewState {
  switch (e.type) {
    case 'compare':
      return {
        ...s,
        cursor: { i: e.i, j: e.j, equal: e.equal },
        mismatchAt: null,
        matched: e.equal ? [...s.matched, e.j] : s.matched,
        comparisons: s.comparisons + 1,
        line: e.line,
        last: e,
      }
    case 'mismatch':
      return {
        ...s,
        mismatchAt: { i: e.i, j: e.j },
        spurious: s.spurious + (e.spurious ? 1 : 0),
        line: e.line,
        last: e,
      }
    case 'shift': {
      // A KMP fallback carries knowledge forward: the first fail[j-1] cells of the
      // pattern are already known to match at the new alignment.
      const carried = e.lookup?.table === 'failure' ? e.lookup.value : 0
      return {
        ...s,
        shift: e.to,
        cursor: null,
        mismatchAt: null,
        matched: Array.from({ length: carried }, (_, k) => k),
        shifts: s.shifts + 1,
        lookup: e.lookup ?? null,
        line: e.line,
        last: e,
      }
    }
    case 'match':
      return { ...s, matches: [...s.matches, e.shift], line: e.line, last: e }
    case 'hash':
      return { ...s, hash: e, cursor: null, mismatchAt: null, line: e.line, last: e }
  }
}

export function replay(events: readonly StepEvent[], upTo: number): ViewState {
  let s = INITIAL_VIEW
  for (let k = 0; k < upTo; k++) s = applyEvent(s, events[k])
  return s
}
