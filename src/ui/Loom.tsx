import { memo, useEffect, useMemo, useRef } from 'react'
import type { AlgoId } from '../core'
import type { ViewState } from './viewState'

export const CELL = 30
export const GAP = 4
export const PITCH = CELL + GAP

type CellState = 'plain' | 'window' | 'active' | 'equal' | 'bad'

const TextCell = memo(function TextCell({
  ch,
  idx,
  state,
  found,
  showIndex,
}: {
  ch: string
  idx: number
  state: CellState
  found: boolean
  showIndex: boolean
}) {
  return (
    <div className="relative" style={{ width: CELL }}>
      <span
        className={
          'absolute -top-4 left-0 w-full text-center text-[10px] leading-none text-denim-300 ' +
          (showIndex ? '' : 'invisible')
        }
      >
        {idx}
      </span>
      <div
        className={`swatch swatch-cream state-${state} ${found ? 'found' : ''}`}
        style={{ width: CELL, height: CELL + 6 }}
        aria-label={`text[${idx}] = ${ch}`}
      >
        {ch === ' ' ? '␣' : ch}
      </div>
    </div>
  )
})

const PatternCell = memo(function PatternCell({ ch, state }: { ch: string; state: CellState }) {
  return (
    <div className={`swatch swatch-rust state-${state}`} style={{ width: CELL, height: CELL + 6 }}>
      {ch === ' ' ? '␣' : ch}
    </div>
  )
})

function Needle({ x }: { x: number }) {
  return (
    <svg
      className="needle pointer-events-none absolute top-0"
      style={{ transform: `translateX(${x}px)` }}
      width={CELL}
      height={40}
      viewBox="0 0 30 40"
      aria-hidden
    >
      <defs>
        <linearGradient id="steel" x1="0" x2="1">
          <stop offset="0" stopColor="#c9d1de" />
          <stop offset="0.5" stopColor="#f4f7fb" />
          <stop offset="1" stopColor="#8f9bb0" />
        </linearGradient>
      </defs>
      <path d="M15 40 L12.4 10 Q15 0 17.6 10 Z" fill="url(#steel)" />
      <ellipse cx="15" cy="9" rx="1.1" ry="3.2" fill="#1c2541" />
      <path d="M15 6 C 4 -2, 2 14, 15 12" fill="none" stroke="#f2c14e" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function Thread({ x, tone }: { x: number; tone: 'gold' | 'moss' | 'rust' }) {
  const color = tone === 'moss' ? '#8fb56a' : tone === 'rust' ? '#e06a45' : '#f2c14e'
  return (
    <svg
      className="pointer-events-none absolute top-0 transition-transform duration-150"
      style={{ transform: `translateX(${x}px)` }}
      width={CELL}
      height={22}
      viewBox="0 0 30 22"
      aria-hidden
    >
      <path
        d="M15 0 C 9 6, 21 8, 15 12 C 10 15, 18 18, 15 22"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {tone === 'rust' && (
        <path d="M10 6 L20 16 M20 6 L10 16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

export interface LoomProps {
  text: string
  pattern: string
  view: ViewState
  algo: AlgoId
}

export function Loom({ text, pattern, view, algo }: LoomProps) {
  const n = text.length
  const m = pattern.length
  const scroller = useRef<HTMLDivElement>(null)
  const { shift, cursor, mismatchAt, matched, matches } = view

  const found = useMemo(() => {
    const set = new Set<number>()
    for (const s of matches) for (let k = 0; k < m; k++) set.add(s + k)
    return set
  }, [matches, m])

  const matchedSet = useMemo(() => new Set(matched), [matched])
  const inWindow = algo === 'rabinKarp' && cursor === null && view.hash !== null
  const showEvery = n > 40 ? 5 : 1

  const focusIdx = cursor?.i ?? mismatchAt?.i ?? (algo === 'horspool' ? shift + m - 1 : shift)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const left = shift * PITCH
    const right = (shift + m) * PITCH
    const margin = PITCH * 2
    if (left < el.scrollLeft + margin || right > el.scrollLeft + el.clientWidth - margin) {
      el.scrollLeft = Math.max(0, left - el.clientWidth / 3)
    }
  }, [shift, m])

  const textStates: CellState[] = useMemo(() => {
    const out: CellState[] = new Array(n).fill('plain')
    if (inWindow) for (let k = 0; k < m; k++) if (shift + k < n) out[shift + k] = 'window'
    for (const j of matchedSet) if (shift + j < n) out[shift + j] = 'equal'
    if (mismatchAt) out[mismatchAt.i] = 'bad'
    else if (cursor) out[cursor.i] = cursor.equal ? 'equal' : 'active'
    return out
  }, [n, m, shift, cursor, mismatchAt, matchedSet, inWindow])

  const threadTone = mismatchAt ? 'rust' : cursor?.equal ? 'moss' : 'gold'
  const showThread = cursor !== null || mismatchAt !== null

  return (
    <div
      ref={scroller}
      className="loom overflow-x-auto overflow-y-hidden rounded-lg"
      tabIndex={-1}
      aria-label="Loom: text row with the pattern aligned beneath"
    >
      <div className="relative pt-14 pb-5 pl-4 pr-4" style={{ width: n * PITCH + 32 }}>
        {m > 0 && m <= n && (
          <div className="absolute left-4 top-3 h-10 w-full">
            <Needle x={focusIdx * PITCH} />
          </div>
        )}

        <div className="flex" style={{ gap: GAP }}>
          {Array.from(text, (ch, idx) => (
            <TextCell
              key={idx}
              ch={ch}
              idx={idx}
              state={textStates[idx]}
              found={found.has(idx)}
              showIndex={idx % showEvery === 0}
            />
          ))}
        </div>

        <div className="relative" style={{ height: 22 }}>
          {showThread && <Thread x={(cursor?.i ?? mismatchAt?.i ?? 0) * PITCH} tone={threadTone} />}
        </div>

        {m > 0 && m <= n ? (
          <div
            className="pattern-row flex"
            style={{ gap: GAP, transform: `translateX(${shift * PITCH}px)`, width: m * PITCH }}
          >
            {Array.from(pattern, (ch, j) => (
              <PatternCell
                key={j}
                ch={ch}
                state={
                  mismatchAt?.j === j
                    ? 'bad'
                    : matchedSet.has(j)
                      ? 'equal'
                      : cursor?.j === j
                        ? 'active'
                        : inWindow
                          ? 'window'
                          : 'plain'
                }
              />
            ))}
          </div>
        ) : (
          <p className="sticky left-4 w-max font-stencil text-sm text-cream-400" style={{ height: CELL + 6 }}>
            {m === 0 ? 'Thread the needle — type a pattern to search for.' : 'The needle is longer than the cloth.'}
          </p>
        )}
      </div>
    </div>
  )
}
