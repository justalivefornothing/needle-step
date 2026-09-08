import type { AlgoId, StepEvent } from './events'
import { naive } from './naive'
import { kmp } from './kmp'
import { horspool } from './horspool'
import { rabinKarp } from './rabinKarp'

export * from './events'
export { naive } from './naive'
export { kmp, kmpFailureTable } from './kmp'
export { horspool, horspoolShiftTable } from './horspool'
export type { ShiftTable } from './horspool'
export { rabinKarp, RollingHash, HASH_BASE, HASH_MOD } from './rabinKarp'
export * from './pseudocode'
export * from './presets'

export interface MatchOptions {
  /** Rabin-Karp modulus override. */
  mod?: number
}

export function createMatcher(
  algo: AlgoId,
  text: string,
  pattern: string,
  opts: MatchOptions = {},
): Generator<StepEvent, void, void> {
  switch (algo) {
    case 'naive':
      return naive(text, pattern)
    case 'kmp':
      return kmp(text, pattern)
    case 'horspool':
      return horspool(text, pattern)
    case 'rabinKarp':
      return rabinKarp(text, pattern, { mod: opts.mod })
  }
}
