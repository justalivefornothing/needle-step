import type { StepEvent } from './events'
import { RL } from './pseudocode'

/** 2^31 − 1, a Mersenne prime; products with a small base stay exact in doubles. */
export const HASH_MOD = 2147483647
export const HASH_BASE = 257

/**
 * Polynomial rolling hash over UTF-16 code units:
 *   hash(s) = Σ code(s[k]) · base^(m−1−k)  (mod p)
 *
 * `power` is base^(m−1) mod p, precomputed once so that dropping the leading
 * character and appending a new one is O(1). All intermediate products are
 * below 2^47, well inside the exactly-representable range of a double.
 */
export class RollingHash {
  readonly m: number
  readonly base: number
  readonly mod: number
  readonly power: number

  constructor(m: number, base: number = HASH_BASE, mod: number = HASH_MOD) {
    this.m = m
    this.base = base
    this.mod = mod
    let p = 1
    for (let k = 1; k < m; k++) p = (p * base) % mod
    this.power = p
  }

  hashOf(s: string): number {
    let h = 0
    for (let k = 0; k < s.length; k++) h = (h * this.base + s.charCodeAt(k)) % this.mod
    return h
  }

  /** Hash of the window after removing `out` from the front and appending `inc`. */
  roll(prev: number, out: string, inc: string): number {
    const dropped = (prev - ((out.charCodeAt(0) * this.power) % this.mod) + this.mod) % this.mod
    return (dropped * this.base + inc.charCodeAt(0)) % this.mod
  }
}

export interface RabinKarpOptions {
  /** Override the modulus (e.g. 101) to make spurious hits easy to provoke. */
  mod?: number
}

/**
 * Rabin-Karp: compare a rolling hash of each window against the pattern's
 * hash and only compare characters when the hashes agree. Equal hashes with
 * unequal characters are reported as a spurious hit.
 */
export function* rabinKarp(
  text: string,
  pattern: string,
  opts: RabinKarpOptions = {},
): Generator<StepEvent, void, void> {
  const n = text.length
  const m = pattern.length
  if (m === 0 || m > n) return

  const rh = new RollingHash(m, HASH_BASE, opts.mod ?? HASH_MOD)
  const target = rh.hashOf(pattern)
  let hash = rh.hashOf(text.slice(0, m))
  let roll: { prev: number; out: string; in: string } | undefined

  for (let s = 0; s <= n - m; s++) {
    const equal = hash === target
    yield { type: 'hash', shift: s, hash, target, equal, roll, line: RL.HASH_EQ }

    if (equal) {
      let j = 0
      while (j < m) {
        const same = text[s + j] === pattern[j]
        yield { type: 'compare', shift: s, i: s + j, j, equal: same, line: RL.VERIFY }
        if (!same) {
          yield { type: 'mismatch', shift: s, i: s + j, j, spurious: true, line: RL.SPURIOUS }
          break
        }
        j++
      }
      if (j === m) yield { type: 'match', shift: s, line: RL.VERIFY }
    }

    if (s < n - m) {
      const out = text[s]
      const inc = text[s + m]
      const next = rh.roll(hash, out, inc)
      yield { type: 'shift', from: s, to: s + 1, by: 1, line: RL.ROLL }
      roll = { prev: hash, out, in: inc }
      hash = next
    }
  }
}
