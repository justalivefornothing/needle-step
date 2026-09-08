import type { StepEvent } from '../core'

const q = (ch: string) => `‘${ch === ' ' ? '␣' : ch}’`

/** One-line narration of an event for the readout. */
export function describe(e: StepEvent | null, text: string, pattern: string): string {
  if (!e) return 'Ready. Step or play to begin.'
  switch (e.type) {
    case 'compare':
      return `compare T[${e.i}] ${q(text[e.i])} with P[${e.j}] ${q(pattern[e.j])} — ${e.equal ? 'equal' : 'different'}`
    case 'mismatch':
      return e.spurious
        ? `spurious hit: hashes agreed but T[${e.i}] ≠ P[${e.j}]`
        : `mismatch at T[${e.i}] ≠ P[${e.j}]`
    case 'shift': {
      const why = e.lookup
        ? e.lookup.table === 'failure'
          ? ` (fail[${e.lookup.key}] = ${e.lookup.value})`
          : ` (shift[${q(String(e.lookup.key))}] = ${e.lookup.value})`
        : ''
      return `shift ${e.from} → ${e.to}, by ${e.by}${why}`
    }
    case 'match':
      return `match at ${e.shift}`
    case 'hash':
      return e.equal ? `hash ${e.hash} = hash(P) — verify characters` : `hash ${e.hash} ≠ hash(P) ${e.target} — skip window`
  }
}
