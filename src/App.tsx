import { useEffect, useMemo, useState } from 'react'
import { ALGO_NAMES, DEFAULT_PRESET, HASH_MOD, MAX_PATTERN, MAX_TEXT, PRESETS, type AlgoId } from './core'
import { AlgoTabs, Inputs, Transport } from './ui/Controls'
import { HashPanel } from './ui/HashPanel'
import { Loom } from './ui/Loom'
import { Pseudocode } from './ui/Pseudocode'
import { Readout } from './ui/Readout'
import { TagCard } from './ui/TagCard'
import { usePlayer } from './ui/usePlayer'

type Mode = 'step' | 'race'

export default function App() {
  const [text, setText] = useState(DEFAULT_PRESET.text)
  const [pattern, setPattern] = useState(DEFAULT_PRESET.pattern)
  const [algo, setAlgo] = useState<AlgoId>('horspool')
  const [mode, setMode] = useState<Mode>('step')
  const [mod, setMod] = useState(HASH_MOD)

  const player = usePlayer(algo, text, pattern, algo === 'rabinKarp' ? mod : undefined)
  const { view } = player
  const invalid = pattern.length === 0 || pattern.length > text.length

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.text === text && p.pattern === pattern)?.id ?? null,
    [text, pattern],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return
      if (mode !== 'step') return
      if (e.key === ' ') {
        e.preventDefault()
        player.toggle()
      } else if (e.key === 'ArrowRight') player.step()
      else if (e.key === 'ArrowLeft') player.back()
      else if (e.key === 'r' || e.key === 'R') player.reset()
      else if (e.key === 'e' || e.key === 'E') player.toEnd()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player, mode])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-stencil text-4xl leading-none text-cream-100 sm:text-5xl">
            Needle<span className="text-rust-400">step</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-denim-300">
            Four exact string-matching algorithms, one stitch at a time. Watch where each one looks and how far it
            dares to jump.
          </p>
        </div>
        <div role="tablist" aria-label="Mode" className="flex rounded-md bg-denim-950/60 p-1">
          {(['step', 'race'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              className={'mode-tab ' + (mode === m ? 'mode-tab-on' : '')}
              onClick={() => {
                player.pause()
                setMode(m)
              }}
            >
              {m === 'step' ? 'Step through' : 'Race'}
            </button>
          ))}
        </div>
      </header>

      <section className="card">
        <Inputs
          text={text}
          pattern={pattern}
          onText={(v) => setText(v.slice(0, MAX_TEXT))}
          onPattern={(v) => setPattern(v.slice(0, MAX_PATTERN))}
          onPreset={(p) => {
            setText(p.text)
            setPattern(p.pattern)
          }}
          activePreset={activePreset}
        />
      </section>

      {mode === 'step' ? (
        <>
          <section className="card flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AlgoTabs algo={algo} onAlgo={setAlgo} />
              <h2 className="font-stencil text-lg text-cream-200">{ALGO_NAMES[algo]}</h2>
            </div>
            <Loom text={text} pattern={pattern} view={view} algo={algo} />
            <Transport player={player} disabled={invalid} />
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <Readout view={view} text={text} pattern={pattern} />
              {algo === 'rabinKarp' ? (
                <HashPanel text={text} pattern={pattern} view={view} mod={mod} onModChange={setMod} />
              ) : (
                <TagCard algo={algo} pattern={pattern} lookup={view.lookup} />
              )}
            </div>
            <Pseudocode algo={algo} line={view.line} active={view.last !== null} />
          </div>
        </>
      ) : (
        <section className="card text-denim-300">Race mode is being stitched.</section>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-denim-500">
        <span>
          Keys: <kbd>space</kbd> play · <kbd>→</kbd> step · <kbd>←</kbd> back · <kbd>R</kbd> reset · <kbd>E</kbd> end
        </span>
        <span>Needlestep — MIT</span>
      </footer>
    </div>
  )
}
