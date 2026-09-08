import { useMemo } from 'react'
import { HASH_BASE, HASH_MOD, RollingHash } from '../core'
import type { ViewState } from './viewState'

export const TINY_MOD = 101

interface Props {
  text: string
  pattern: string
  view: ViewState
  mod: number
  onModChange: (mod: number) => void
}

const fmt = (v: number) => v.toLocaleString('en-US')

export function HashPanel({ text, pattern, view, mod, onModChange }: Props) {
  const m = pattern.length
  const rh = useMemo(() => new RollingHash(m, HASH_BASE, mod), [m, mod])
  const target = useMemo(() => rh.hashOf(pattern), [rh, pattern])
  const h = view.hash
  const window = h ? text.slice(h.shift, h.shift + m) : text.slice(0, m)
  const spuriousNow = view.last?.type === 'mismatch' && view.last.spurious

  return (
    <section className="tag" aria-label="Rabin-Karp rolling hash">
      <span className="tag-hole" aria-hidden />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="tag-title !mb-0">Rolling hash</h3>
        <label className="flex items-center gap-1.5 text-xs text-kraft-700">
          <span>mod</span>
          <select
            className="rounded border border-kraft-700/40 bg-kraft-200 px-1 py-0.5 font-mono text-xs text-kraft-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rust-500"
            value={mod}
            onChange={(e) => onModChange(Number(e.target.value))}
          >
            <option value={HASH_MOD}>2³¹ − 1</option>
            <option value={TINY_MOD}>101 (tiny, provokes spurious hits)</option>
          </select>
        </label>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs text-kraft-800">
        <dt className="text-kraft-700">base</dt>
        <dd>{HASH_BASE}</dd>
        <dt className="text-kraft-700">base^(m−1)</dt>
        <dd>{fmt(rh.power)}</dd>
        <dt className="text-kraft-700">hash(P)</dt>
        <dd className="font-semibold">{fmt(target)}</dd>
        <dt className="text-kraft-700">window</dt>
        <dd>
          <span className="rounded bg-kraft-200 px-1">{window.replaceAll(' ', '␣') || '—'}</span>
          <span className="ml-2 text-kraft-700">@ {h?.shift ?? 0}</span>
        </dd>
        <dt className="text-kraft-700">hash(T)</dt>
        <dd className={h?.equal ? 'font-semibold text-rust-600' : 'font-semibold'}>
          {h ? fmt(h.hash) : '—'}
          {h && (
            <span className="ml-2 font-normal text-kraft-700">{h.equal ? '= hash(P): verify' : '≠ hash(P): skip'}</span>
          )}
        </dd>
      </dl>

      {h?.roll && (
        <div className="mt-3 rounded border border-dashed border-kraft-700/40 p-2 font-mono text-[11px] leading-relaxed text-kraft-800">
          <div className="text-kraft-700">roll: drop ‘{h.roll.out === ' ' ? '␣' : h.roll.out}’, add ‘{h.roll.in === ' ' ? '␣' : h.roll.in}’</div>
          <div>
            (({fmt(h.roll.prev)} − {h.roll.out.charCodeAt(0)}·{fmt(rh.power)}) · {HASH_BASE} + {h.roll.in.charCodeAt(0)}) mod{' '}
            {fmt(mod)}
          </div>
          <div>= {fmt(h.hash)}</div>
        </div>
      )}

      <p className={'tag-readout ' + (spuriousNow ? 'text-rust-600' : '')}>
        spurious hits: {view.spurious}
        {spuriousNow ? ' — hashes agreed, characters did not' : ''}
      </p>
    </section>
  )
}
