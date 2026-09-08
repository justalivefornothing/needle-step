import type { StepEvent } from './events'
import { KL } from './pseudocode'

/**
 * Prefix function: fail[j] is the length of the longest proper prefix of
 * pattern[0..j] that is also a suffix of it. For 'ABABCABAB' that is
 * [0,0,1,2,0,1,2,3,4].
 */
export function kmpFailureTable(pattern: string): number[] {
  const m = pattern.length
  const fail = new Array<number>(m).fill(0)
  let k = 0
  for (let j = 1; j < m; j++) {
    while (k > 0 && pattern[j] !== pattern[k]) k = fail[k - 1]
    if (pattern[j] === pattern[k]) k++
    fail[j] = k
  }
  return fail
}

/**
 * Knuth-Morris-Pratt. The text index `i` never moves backwards; on a mismatch
 * the pattern index falls back through the failure table, which is reported
 * as a shift of the alignment by j − fail[j−1]. At most 2n comparisons.
 */
export function* kmp(text: string, pattern: string): Generator<StepEvent, void, void> {
  const n = text.length
  const m = pattern.length
  if (m === 0 || m > n) return
  const fail = kmpFailureTable(pattern)

  let i = 0
  let j = 0
  while (i < n) {
    const equal = text[i] === pattern[j]
    yield { type: 'compare', shift: i - j, i, j, equal, line: KL.COMPARE }
    if (equal) {
      i++
      j++
      if (j === m) {
        const from = i - m
        yield { type: 'match', shift: from, line: KL.REPORT }
        const next = fail[m - 1]
        const to = i - next
        if (to > n - m) return
        yield {
          type: 'shift',
          from,
          to,
          by: m - next,
          lookup: { table: 'failure', key: m - 1, value: next },
          line: KL.AFTER_MATCH,
        }
        j = next
      }
    } else {
      yield { type: 'mismatch', shift: i - j, i, j, line: KL.MISMATCH }
      if (j > 0) {
        const next = fail[j - 1]
        const from = i - j
        const to = i - next
        if (to > n - m) return
        yield {
          type: 'shift',
          from,
          to,
          by: j - next,
          lookup: { table: 'failure', key: j - 1, value: next },
          line: KL.FALLBACK,
        }
        j = next
      } else {
        if (i + 1 > n - m) return
        yield { type: 'shift', from: i, to: i + 1, by: 1, line: KL.ADVANCE }
        i++
      }
    }
  }
}
