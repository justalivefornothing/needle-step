import { describe, expect, it } from 'vitest'
import { horspool, kmp, naive, rabinKarp, runToEnd } from '../core'
import { INITIAL_VIEW, applyEvent, replay } from './viewState'

describe('viewState', () => {
  it('folds a full naive run into the same totals as runToEnd', () => {
    const events = [...naive('aaaaaa', 'aaa')]
    const view = replay(events, events.length)
    const totals = runToEnd(events)
    expect(view.comparisons).toBe(totals.comparisons)
    expect(view.shifts).toBe(totals.shifts)
    expect(view.matches).toEqual(totals.matches)
    expect(view.shift).toBe(3)
  })

  it('carries known-matching cells forward on a KMP fallback', () => {
    // 'AAAB' on 'AAAA': after matching AAA and failing on B, fail[2] = 2 cells stay matched.
    const events = [...kmp('AAAAAAAA', 'AAAB')]
    const firstFallback = events.findIndex((e) => e.type === 'shift' && e.lookup?.table === 'failure')
    expect(firstFallback).toBeGreaterThan(0)
    const view = replay(events, firstFallback + 1)
    expect(view.shift).toBe(1)
    expect(view.matched).toEqual([0, 1])
    expect(view.lookup).toEqual({ table: 'failure', key: 2, value: 2 })
    expect(view.cursor).toBeNull()
  })

  it('records the bad-character lookup Horspool used to shift', () => {
    const events = [...horspool('zzzzabc', 'abc')]
    const view = replay(events, 3) // compare, mismatch, shift
    expect(view.mismatchAt).toBeNull()
    expect(view.lookup).toEqual({ table: 'badChar', key: 'z', value: 3 })
    expect(view.shift).toBe(3)
  })

  it('keeps the latest hash and counts spurious hits for Rabin-Karp', () => {
    const events = [...rabinKarp('abracadabra', 'abra', { mod: 7 })]
    const view = replay(events, events.length)
    expect(view.hash?.type).toBe('hash')
    expect(view.matches).toEqual([0, 7])
    expect(view.spurious).toBe(runToEnd(events).spurious)
  })

  it('marks a mismatch and clears it on the next shift', () => {
    let s = applyEvent(INITIAL_VIEW, { type: 'compare', shift: 0, i: 0, j: 0, equal: false, line: 2 })
    expect(s.cursor).toEqual({ i: 0, j: 0, equal: false })
    s = applyEvent(s, { type: 'mismatch', shift: 0, i: 0, j: 0, line: 2 })
    expect(s.mismatchAt).toEqual({ i: 0, j: 0 })
    s = applyEvent(s, { type: 'shift', from: 0, to: 1, by: 1, line: 5 })
    expect(s.mismatchAt).toBeNull()
    expect(s.matched).toEqual([])
    expect(s.line).toBe(5)
  })
})
