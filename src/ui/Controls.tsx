import { ALGO_IDS, ALGO_NAMES, ALGO_SHORT, MAX_PATTERN, MAX_TEXT, PRESETS, type AlgoId, type Preset } from '../core'
import type { Player } from './usePlayer'

interface InputsProps {
  text: string
  pattern: string
  onText: (v: string) => void
  onPattern: (v: string) => void
  onPreset: (p: Preset) => void
  activePreset: string | null
}

export function Inputs({ text, pattern, onText, onPattern, onPreset, activePreset }: InputsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_minmax(9rem,14rem)]">
      <label className="field">
        <span className="field-label">
          Cloth <span className="text-denim-300">(text, {text.length}/{MAX_TEXT})</span>
        </span>
        <input
          className="field-input"
          value={text}
          maxLength={MAX_TEXT}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onText(e.target.value)}
          placeholder="text to search in"
        />
      </label>
      <label className="field">
        <span className="field-label">
          Needle <span className="text-denim-300">(pattern, {pattern.length}/{MAX_PATTERN})</span>
        </span>
        <input
          className="field-input"
          value={pattern}
          maxLength={MAX_PATTERN}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onPattern(e.target.value)}
          placeholder="pattern"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <span className="field-label mr-1">Presets</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'chip ' + (activePreset === p.id ? 'chip-on' : '')}
            onClick={() => onPreset(p)}
            title={p.blurb}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AlgoTabs({ algo, onAlgo }: { algo: AlgoId; onAlgo: (a: AlgoId) => void }) {
  return (
    <div role="tablist" aria-label="Algorithm" className="flex flex-wrap gap-1.5">
      {ALGO_IDS.map((id) => (
        <button
          key={id}
          role="tab"
          type="button"
          aria-selected={algo === id}
          className={'tab ' + (algo === id ? 'tab-on' : '')}
          onClick={() => onAlgo(id)}
          title={ALGO_NAMES[id]}
        >
          <span className={`algo-dot algo-${id}`} aria-hidden />
          {ALGO_SHORT[id]}
        </button>
      ))}
    </div>
  )
}

const SPEED_MIN = Math.log(1)
const SPEED_MAX = Math.log(600)

export function Transport({ player, disabled }: { player: Player; disabled: boolean }) {
  const { playing, exhausted, cursor, speed } = player
  const sliderVal = ((Math.log(speed) - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Transport">
        <button type="button" className="btn" onClick={player.reset} disabled={disabled || cursor === 0} title="Reset (R)">
          <Icon d="M4 4v5h5M4.6 9A7 7 0 1 1 4 12" />
          <span className="sr-only">Reset</span>
        </button>
        <button type="button" className="btn" onClick={player.back} disabled={disabled || cursor === 0} title="Step back (←)">
          <Icon d="M14 5l-7 7 7 7M7 12h12" />
          <span className="sr-only">Step back</span>
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-24"
          onClick={player.toggle}
          disabled={disabled || exhausted}
          title="Play / pause (space)"
          aria-pressed={playing}
        >
          {playing ? <Icon d="M8 5v14M16 5v14" /> : <Icon d="M7 4l12 8-12 8z" fill />}
          <span>{playing ? 'Pause' : exhausted ? 'Finished' : 'Play'}</span>
        </button>
        <button type="button" className="btn" onClick={player.step} disabled={disabled || exhausted} title="Step (→)">
          <Icon d="M10 5l7 7-7 7M17 12H5" />
          <span className="sr-only">Step forward</span>
        </button>
        <button type="button" className="btn" onClick={player.toEnd} disabled={disabled || exhausted} title="Run to end (E)">
          <Icon d="M5 5l8 7-8 7zM17 5v14" />
          <span className="sr-only">Run to end</span>
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-denim-300">
        <span className="whitespace-nowrap">speed</span>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderVal}
          onChange={(e) => {
            const t = Number(e.target.value) / 100
            player.setSpeed(Math.round(Math.exp(SPEED_MIN + t * (SPEED_MAX - SPEED_MIN))))
          }}
          className="slider w-28"
          aria-label="Playback speed in steps per second"
        />
        <span className="w-16 font-mono tabular-nums text-cream-200">{speed} st/s</span>
      </label>
      <span className="ml-auto font-mono text-xs tabular-nums text-denim-300">step {cursor}</span>
    </div>
  )
}

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}
