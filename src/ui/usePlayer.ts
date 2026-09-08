import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMatcher, type AlgoId, type StepEvent } from '../core'
import { INITIAL_VIEW, applyEvent, replay, type ViewState } from './viewState'

const MAX_EVENTS = 250_000

export interface Player {
  view: ViewState
  cursor: number
  exhausted: boolean
  playing: boolean
  speed: number
  setSpeed: (eps: number) => void
  toggle: () => void
  pause: () => void
  step: () => void
  back: () => void
  reset: () => void
  toEnd: () => void
}

/**
 * Drives one matcher generator: materialises events lazily as you step
 * forward (so stepping back is a replay, not a re-run) and plays at a given
 * number of events per second on requestAnimationFrame.
 */
export function usePlayer(algo: AlgoId, text: string, pattern: string, mod?: number): Player {
  const gen = useRef<Generator<StepEvent, void, void> | null>(null)
  const events = useRef<StepEvent[]>([])
  const cursorRef = useRef(0)
  const viewRef = useRef<ViewState>(INITIAL_VIEW)
  const exhaustedRef = useRef(false)

  const [snap, setSnap] = useState({ view: INITIAL_VIEW, cursor: 0, exhausted: false })
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(12)

  const publish = useCallback(() => {
    setSnap({ view: viewRef.current, cursor: cursorRef.current, exhausted: exhaustedRef.current })
  }, [])

  const reset = useCallback(() => {
    gen.current = createMatcher(algo, text, pattern, { mod })
    events.current = []
    cursorRef.current = 0
    viewRef.current = INITIAL_VIEW
    exhaustedRef.current = false
    setPlaying(false)
    publish()
  }, [algo, text, pattern, mod, publish])

  useEffect(reset, [reset])

  /** Advance up to `k` events; returns false once the generator is spent. */
  const advance = useCallback((k: number): boolean => {
    for (let n = 0; n < k; n++) {
      const c = cursorRef.current
      let e = events.current[c]
      if (!e) {
        if (exhaustedRef.current || !gen.current || events.current.length >= MAX_EVENTS) {
          exhaustedRef.current = true
          return false
        }
        const r = gen.current.next()
        if (r.done) {
          exhaustedRef.current = true
          return false
        }
        e = r.value
        events.current.push(e)
      }
      viewRef.current = applyEvent(viewRef.current, e)
      cursorRef.current = c + 1
    }
    return true
  }, [])

  const step = useCallback(() => {
    setPlaying(false)
    advance(1)
    publish()
  }, [advance, publish])

  const back = useCallback(() => {
    setPlaying(false)
    if (cursorRef.current === 0) return
    cursorRef.current -= 1
    viewRef.current = replay(events.current, cursorRef.current)
    exhaustedRef.current = false
    publish()
  }, [publish])

  const toEnd = useCallback(() => {
    setPlaying(false)
    advance(MAX_EVENTS)
    publish()
  }, [advance, publish])

  const toggle = useCallback(() => {
    if (exhaustedRef.current) return
    setPlaying((p) => !p)
  }, [])
  const pause = useCallback(() => setPlaying(false), [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * speed
      last = now
      const k = Math.floor(acc)
      acc -= k
      const alive = advance(k)
      publish()
      if (!alive) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, advance, publish])

  return useMemo(
    () => ({
      view: snap.view,
      cursor: snap.cursor,
      exhausted: snap.exhausted,
      playing,
      speed,
      setSpeed,
      toggle,
      pause,
      step,
      back,
      reset,
      toEnd,
    }),
    [snap, playing, speed, toggle, pause, step, back, reset, toEnd],
  )
}
