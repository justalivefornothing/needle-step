import type { StepEvent } from './events'
import { HL } from './pseudocode'

export interface ShiftTable {
  /** Characters that occur in pattern[0 .. m−1) and how far to shift on them. */
  table: Map<string, number>
  /** Shift for any character not in the table (the pattern length). */
  default: number
  get(ch: string): number
}

/**
 * Horspool's bad-character table: for every character in the pattern except
 * the last one, the distance from its last occurrence to the end of the
 * pattern. Characters that never occur (or occur only as the last character)
 * let the whole pattern jump past the text character that was under its end.
 */
export function horspoolShiftTable(pattern: string): ShiftTable {
  const m = pattern.length
  const table = new Map<string, number>()
  for (let i = 0; i < m - 1; i++) table.set(pattern[i], m - 1 - i)
  return {
    table,
    default: m,
    get: (ch) => table.get(ch) ?? m,
  }
}

/**
 * Boyer-Moore-Horspool: compare right to left, then shift by the table entry
 * of the text character currently under the pattern's last cell, regardless
 * of where the mismatch happened.
 */
export function* horspool(text: string, pattern: string): Generator<StepEvent, void, void> {
  const n = text.length
  const m = pattern.length
  if (m === 0 || m > n) return
  const shift = horspoolShiftTable(pattern)

  let s = 0
  while (s <= n - m) {
    let j = m - 1
    while (j >= 0) {
      const equal = text[s + j] === pattern[j]
      yield { type: 'compare', shift: s, i: s + j, j, equal, line: HL.COMPARE }
      if (!equal) {
        yield { type: 'mismatch', shift: s, i: s + j, j, line: HL.COMPARE }
        break
      }
      j--
    }
    if (j < 0) yield { type: 'match', shift: s, line: HL.REPORT }

    const last = text[s + m - 1]
    const by = shift.get(last)
    if (s + by > n - m) return
    yield {
      type: 'shift',
      from: s,
      to: s + by,
      by,
      lookup: { table: 'badChar', key: last, value: by },
      line: HL.SHIFT,
    }
    s += by
  }
}
