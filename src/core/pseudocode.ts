import type { AlgoId } from './events'

/**
 * Pseudocode shown beside the loom. Each matcher tags its events with a line
 * index into its own list, so the two must stay in step: the named constants
 * below are what the matchers import.
 */

export const NAIVE_LINES = [
  'for s = 0 .. n − m',
  '  j = 0',
  '  while j < m and T[s+j] = P[j]',
  '    j = j + 1',
  '  if j = m: report match at s',
  '  s = s + 1',
] as const
export const NL = { FOR: 0, INIT: 1, WHILE: 2, ADVANCE: 3, REPORT: 4, SHIFT: 5 } as const

export const KMP_LINES = [
  'fail = failureTable(P)',
  'i = 0, j = 0',
  'while i < n',
  '  if T[i] = P[j]: i = i + 1, j = j + 1',
  '  if j = m: report match at i − m',
  '    j = fail[j − 1]',
  '  else if T[i] ≠ P[j]',
  '    if j > 0: j = fail[j − 1]',
  '    else: i = i + 1',
] as const
export const KL = {
  TABLE: 0,
  INIT: 1,
  WHILE: 2,
  COMPARE: 3,
  REPORT: 4,
  AFTER_MATCH: 5,
  MISMATCH: 6,
  FALLBACK: 7,
  ADVANCE: 8,
} as const

export const HORSPOOL_LINES = [
  'shift = badCharTable(P)',
  's = 0',
  'while s ≤ n − m',
  '  j = m − 1',
  '  while j ≥ 0 and T[s+j] = P[j]',
  '    j = j − 1',
  '  if j < 0: report match at s',
  '  s = s + shift[T[s + m − 1]]',
] as const
export const HL = {
  TABLE: 0,
  INIT: 1,
  WHILE: 2,
  RESET_J: 3,
  COMPARE: 4,
  RETREAT: 5,
  REPORT: 6,
  SHIFT: 7,
} as const

export const RABIN_KARP_LINES = [
  'hP = hash(P), hT = hash(T[0 .. m))',
  'for s = 0 .. n − m',
  '  if hT = hP',
  '    if T[s .. s+m) = P: report match at s',
  '    else: spurious hit',
  '  hT = roll(hT, out = T[s], in = T[s + m])',
] as const
export const RL = { INIT: 0, FOR: 1, HASH_EQ: 2, VERIFY: 3, SPURIOUS: 4, ROLL: 5 } as const

export const PSEUDOCODE: Record<AlgoId, readonly string[]> = {
  naive: NAIVE_LINES,
  kmp: KMP_LINES,
  horspool: HORSPOOL_LINES,
  rabinKarp: RABIN_KARP_LINES,
}
