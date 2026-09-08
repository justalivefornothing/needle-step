import type { StepEvent } from './events'
import { NL } from './pseudocode'

/**
 * Naive matcher: try every alignment, compare left to right, shift by one.
 * Worst case O(n·m) comparisons; on 'aaaaaa' / 'aaa' it does 12 of them.
 */
export function* naive(text: string, pattern: string): Generator<StepEvent, void, void> {
  const n = text.length
  const m = pattern.length
  if (m === 0 || m > n) return

  for (let s = 0; s <= n - m; s++) {
    let j = 0
    while (j < m) {
      const equal = text[s + j] === pattern[j]
      yield { type: 'compare', shift: s, i: s + j, j, equal, line: NL.WHILE }
      if (!equal) {
        yield { type: 'mismatch', shift: s, i: s + j, j, line: NL.WHILE }
        break
      }
      j++
    }
    if (j === m) yield { type: 'match', shift: s, line: NL.REPORT }
    if (s < n - m) yield { type: 'shift', from: s, to: s + 1, by: 1, line: NL.SHIFT }
  }
}
