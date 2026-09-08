import { useEffect, useRef } from 'react'
import { ALGO_NAMES, ALGO_SHORT, type AlgoId } from '../core'
import { useRace, type LaneSummary } from './useRace'

const ALGO_COLOR: Record<AlgoId, string> = {
  naive: '#3987e5',
  kmp: '#d95926',
  horspool: '#199e70',
  rabinKarp: '#c98500',
}

const fmt = (v: number) => v.toLocaleString('en-US')
const ORDINAL = ['1st', '2nd', '3rd', '4th']

/** Heat strip of how many times each text cell has been read, plus the pattern's position. */
function TouchStrip({
  data,
  color,
  shift,
  m,
  n,
  version,
}: {
  data: Uint16Array | undefined
  color: string
  shift: number
  m: number
  n: number
  version: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    if (!data || n === 0) return
    const cell = W / n
    const w = Math.max(cell, 1)
    ctx.fillStyle = color
    for (let i = 0; i < n; i++) {
      const c = data[i]
      if (c === 0) continue
      ctx.globalAlpha = Math.min(1, 0.3 + 0.25 * c)
      ctx.fillRect(i * cell, 3, w, H - 6)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#f7efdc'
    ctx.fillRect(shift * cell, 0, Math.max(m * cell, 2), H)
  }, [data, color, shift, m, n, version])
  return <canvas ref={ref} width={900} height={22} className="block h-[22px] w-full rounded-sm bg-denim-950/70" />
}

function Lane({
  lane,
  touched,
  m,
  n,
  version,
}: {
  lane: LaneSummary
  touched: Uint16Array | undefined
  m: number
  n: number
  version: number
}) {
  return (
    <li className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 font-stencil text-sm text-cream-100">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ALGO_COLOR[lane.id] }} aria-hidden />
          {ALGO_NAMES[lane.id]}
        </span>
        {lane.done && lane.rank !== null && (
          <span className="rounded-sm bg-cream-100 px-1.5 font-stencil text-[11px] text-denim-950">
            {ORDINAL[lane.rank - 1]}
          </span>
        )}
        <span className="ml-auto font-mono tabular-nums text-denim-300">
          {lane.id === 'rabinKarp'
            ? `${fmt(lane.comparisons)} cmp + ${fmt(lane.hashes)} hash`
            : `${fmt(lane.comparisons)} cmp`}
          {' · '}
          {fmt(lane.shifts)} shifts · {lane.matches} match{lane.matches === 1 ? '' : 'es'}
          {lane.spurious > 0 ? ` · ${lane.spurious} spurious` : ''}
        </span>
      </div>
      <TouchStrip data={touched} color={ALGO_COLOR[lane.id]} shift={lane.shift} m={m} n={n} version={version} />
    </li>
  )
}

function WorkChart({ lanes }: { lanes: LaneSummary[] }) {
  const max = Math.max(1, ...lanes.map((l) => l.total))
  return (
    <figure className="m-0">
      <figcaption className="card-title">Work</figcaption>
      <p className="mt-0.5 text-xs text-denim-300">
        One unit = one character comparison or one hash check. Every lane spends one unit per tick, so each bar
        races toward its own finish line.
      </p>
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5">
        {lanes.map((l) => (
          <div key={l.id} className="contents" title={`${ALGO_NAMES[l.id]}: ${fmt(l.work)} of ${fmt(l.total)} units`}>
            <span className="font-stencil text-xs text-cream-200">{ALGO_SHORT[l.id]}</span>
            <div className="relative h-4">
              <div className="absolute inset-y-0 left-0 rounded-r bg-denim-950/60" style={{ width: `${(l.total / max) * 100}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-r"
                style={{
                  width: `${(l.work / max) * 100}%`,
                  background: ALGO_COLOR[l.id],
                  transition: 'width 80ms linear',
                }}
              />
              <div
                className="absolute -inset-y-0.5 w-0.5 rounded-sm bg-cream-100"
                style={{ left: `calc(${(l.total / max) * 100}% - 1px)` }}
                aria-hidden
              />
            </div>
            <span className="w-28 text-right font-mono text-xs tabular-nums text-cream-100">
              {l.done ? <span className="text-moss-500">✓ </span> : null}
              {fmt(l.work)}
              <span className="text-denim-300"> / {fmt(l.total)}</span>
            </span>
          </div>
        ))}
      </div>
    </figure>
  )
}

const SPEED_MIN = Math.log(5)
const SPEED_MAX = Math.log(3000)

export function Race({ text, pattern }: { text: string; pattern: string }) {
  const race = useRace(text, pattern)
  const invalid = pattern.length === 0 || pattern.length > text.length
  const n = text.length
  const m = pattern.length
  const winner = race.finished ? [...race.lanes].sort((a, b) => a.work - b.work)[0] : null
  const sliderVal = ((Math.log(race.speed) - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="card flex flex-col gap-4" aria-label="Race lanes">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary min-w-24"
            onClick={race.toggle}
            disabled={invalid || race.finished}
            aria-pressed={race.running}
          >
            {race.running ? 'Pause' : race.finished ? 'Finished' : race.started ? 'Resume' : 'Start race'}
          </button>
          <button type="button" className="btn" onClick={race.reset} disabled={invalid || !race.started}>
            Reset
          </button>
          <label className="flex items-center gap-2 text-xs text-denim-300">
            <span>speed</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderVal}
              onChange={(e) => {
                const t = Number(e.target.value) / 100
                race.setSpeed(Math.round(Math.exp(SPEED_MIN + t * (SPEED_MAX - SPEED_MIN))))
              }}
              className="slider w-28"
              aria-label="Race speed in work units per second"
            />
            <span className="w-20 font-mono tabular-nums text-cream-200">{fmt(race.speed)} u/s</span>
          </label>
          <span className="ml-auto font-mono text-xs tabular-nums text-denim-300">clock {fmt(race.clock)}</span>
        </div>

        {invalid ? (
          <p className="font-stencil text-sm text-cream-400">
            {m === 0 ? 'Thread the needle — type a pattern to race with.' : 'The needle is longer than the cloth.'}
          </p>
        ) : (
          <ol className="grid gap-3">
            {race.lanes.map((lane) => (
              <Lane key={lane.id} lane={lane} touched={race.touched(lane.id)} m={m} n={n} version={race.clock} />
            ))}
          </ol>
        )}
        <p className="text-xs text-denim-300">
          Each strip is the cloth; a cell darkens every time that algorithm reads it. The cream block is where the
          needle sits right now.
        </p>
      </section>

      <section className="card flex flex-col gap-4" aria-label="Work chart">
        <WorkChart lanes={race.lanes} />
        <div className="mt-auto border-t border-denim-700 pt-3 font-mono text-xs text-cream-200" aria-live="polite">
          {winner
            ? `${ALGO_NAMES[winner.id]} finished first with ${fmt(winner.work)} units.`
            : race.running
              ? 'Racing…'
              : race.started
                ? 'Paused.'
                : 'All four start together on the same cloth.'}
        </div>
      </section>
    </div>
  )
}
