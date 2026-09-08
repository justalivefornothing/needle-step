import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALGO_IDS, createMatcher, runToEnd, type AlgoId, type StepEvent } from '../core'

export interface LaneSummary {
  id: AlgoId
  shift: number
  comparisons: number
  hashes: number
  shifts: number
  matches: number
  spurious: number
  /** comparisons + hashes */
  work: number
  total: number
  done: boolean
  rank: number | null
}

interface LaneInternal {
  id: AlgoId
  gen: Generator<StepEvent, void, void>
  summary: LaneSummary
  /** How many times each text cell has been read. */
  touched: Uint16Array
}

export interface Race {
  lanes: LaneSummary[]
  touched: (id: AlgoId) => Uint16Array | undefined
  running: boolean
  started: boolean
  finished: boolean
  speed: number
  setSpeed: (tps: number) => void
  toggle: () => void
  reset: () => void
  /** Work units elapsed (the race clock). */
  clock: number
}

/** Advance one lane until it has spent one unit of work; bookkeeping events are free. */
function tickLane(lane: LaneInternal, finished: { current: number }): void {
  const s = lane.summary
  for (;;) {
    const r = lane.gen.next()
    if (r.done) {
      s.done = true
      s.rank = ++finished.current
      return
    }
    const e = r.value
    switch (e.type) {
      case 'compare':
        s.comparisons++
        s.work++
        if (lane.touched[e.i] < 65535) lane.touched[e.i]++
        return
      case 'hash':
        s.hashes++
        s.work++
        return
      case 'shift':
        s.shifts++
        s.shift = e.to
        break
      case 'match':
        s.matches++
        break
      case 'mismatch':
        if (e.spurious) s.spurious++
        break
    }
  }
}

/**
 * Runs all four matchers in lockstep. One tick = one unit of work per lane
 * (a character comparison or a hash check). Lanes finish in order of total
 * work, which is exactly the comparison the race is about.
 */
export function useRace(text: string, pattern: string): Race {
  const lanesRef = useRef<LaneInternal[]>([])
  const clockRef = useRef(0)
  const finishedCount = useRef(0)
  const [snap, setSnap] = useState<{ lanes: LaneSummary[]; clock: number }>({ lanes: [], clock: 0 })
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(60)

  const totals = useMemo(() => {
    const out = {} as Record<AlgoId, number>
    for (const id of ALGO_IDS) {
      const r = runToEnd(createMatcher(id, text, pattern))
      out[id] = r.comparisons + r.hashes
    }
    return out
  }, [text, pattern])

  const publish = useCallback(() => {
    setSnap({ lanes: lanesRef.current.map((l) => ({ ...l.summary })), clock: clockRef.current })
  }, [])

  const reset = useCallback(() => {
    lanesRef.current = ALGO_IDS.map((id) => ({
      id,
      gen: createMatcher(id, text, pattern),
      touched: new Uint16Array(text.length),
      summary: {
        id,
        shift: 0,
        comparisons: 0,
        hashes: 0,
        shifts: 0,
        matches: 0,
        spurious: 0,
        work: 0,
        total: totals[id],
        done: false,
        rank: null,
      },
    }))
    clockRef.current = 0
    finishedCount.current = 0
    setRunning(false)
    publish()
  }, [text, pattern, totals, publish])

  useEffect(reset, [reset])

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      acc += ((now - last) / 1000) * speed
      last = now
      let k = Math.floor(acc)
      acc -= k
      while (k-- > 0) {
        let alive = false
        for (const lane of lanesRef.current) {
          if (lane.summary.done) continue
          tickLane(lane, finishedCount)
          alive = true
        }
        if (!alive) break
        clockRef.current++
      }
      publish()
      if (lanesRef.current.every((l) => l.summary.done)) {
        setRunning(false)
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [running, speed, publish])

  const finished = snap.lanes.length > 0 && snap.lanes.every((l) => l.done)

  return {
    lanes: snap.lanes,
    touched: (id) => lanesRef.current.find((l) => l.id === id)?.touched,
    running,
    started: snap.clock > 0,
    finished,
    speed,
    setSpeed,
    toggle: () => {
      if (!finished) setRunning((r) => !r)
    },
    reset,
    clock: snap.clock,
  }
}
