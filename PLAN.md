# Needlestep — plan

Step through naive, KMP, Boyer-Moore-Horspool, and Rabin-Karp string matching
character by character, with shift tables and comparison counts side by side.

## Goal

A small, polished algorithm visualizer that makes the *difference* between the
four classic exact-match algorithms visible: where each one looks, how far it
jumps, and what auxiliary table it consults before jumping. The "wow" moment is
pattern `AAAB` in a text of a thousand `A`s — naive crawls, Horspool leaps four
cells per shift, KMP never looks back.

## Features (all required)

1. Text and pattern inputs; the pattern slides beneath the text as a row of
   cells, aligned at the current shift.
2. Four matchers implemented as step generators emitting
   `compare / mismatch / shift / match` events with exact indices.
3. KMP failure table and Horspool bad-character table rendered and highlighted
   as they are consulted.
4. Rabin-Karp panel showing rolling-hash arithmetic per window and spurious-hit
   detection.
5. Race mode: all four algorithms run on the same input with live comparison
   counters and a bar chart.
6. Preset inputs: DNA snippet, pathological repeated text, English sentence.
7. Pseudocode panel highlighting the line for the current step.

## Architecture

```
src/
  core/
    events.ts        StepEvent union + MatchResult, runToEnd()
    naive.ts         naive(text, pattern): Generator<StepEvent>
    kmp.ts           kmpFailureTable(), kmp()
    horspool.ts      horspoolShiftTable(), horspool()
    rabinKarp.ts     RollingHash class, rabinKarp()
    pseudocode.ts    per-algorithm line lists + event -> line mapping
    presets.ts       DNA / pathological / English presets
    *.test.ts        vitest (node env), spec assertions at minimum
  ui/
    usePlayer.ts     step/play/pause/reset over a generator, speed control
    Loom.tsx         text row + sliding pattern row + needle cursor + thread
    TagCard.tsx      kraft-paper tag showing failure / shift table
    HashPanel.tsx    Rabin-Karp window arithmetic
    Pseudocode.tsx   line highlighting
    Race.tsx         four generators in lockstep, counters, bar chart
    Controls.tsx     inputs, presets, transport buttons
  App.tsx            layout, mode switch (Step / Race)
```

Core is pure TypeScript with no DOM dependency so it can be unit-tested under
the node environment. Generators are lazy, so the UI steps them one event at a
time; `runToEnd` drains a generator for tests and the race counters.

Rabin-Karp uses a polynomial rolling hash mod the 31-bit prime 2^31 - 1 with a
precomputed `base^(m-1)` power so a window roll is O(1). Products are done via
`Math.imul`-free BigInt-free arithmetic by splitting into safe ranges
(base < 2^8, mod < 2^31, so `h * base` < 2^39 fits in a double exactly).

## Visual direction

Textile workshop. Indigo denim background with a subtle woven texture, text
characters as cream fabric swatches, the pattern row stitched beneath in rust
red with a needle-shaped cursor. Comparisons draw a short thread between the
two cells being compared. Shift tables live in a kraft-paper tag card with
stencil-style type. Fonts: Special Elite (stencil/typewriter feel for headings
and tag labels) and JetBrains Mono for cells and code.

## Milestones

- [ ] chore: plan + license, scaffold
- [ ] feat: core matchers + tables + rolling hash, tests green
- [ ] feat: loom view, player controls, presets, pseudocode
- [ ] feat: tag cards (KMP / Horspool), Rabin-Karp hash panel
- [ ] feat: race mode with counters and bar chart
- [ ] fix/polish after smoke screenshot
- [ ] docs: readme
- [ ] publish private repo
