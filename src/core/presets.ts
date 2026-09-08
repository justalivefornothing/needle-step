export interface Preset {
  id: string
  label: string
  text: string
  pattern: string
  blurb: string
}

export const MAX_TEXT = 2000
export const MAX_PATTERN = 64

export const PRESETS: readonly Preset[] = [
  {
    id: 'dna',
    label: 'DNA snippet',
    text: 'ATGCGATTACGCTTGAGGATTACAGCATGATTACGGCTAGATTACATCGGATTAC',
    pattern: 'GATTACA',
    blurb: 'Small alphabet, near-misses everywhere; watch Horspool jump on characters outside the needle.',
  },
  {
    id: 'pathological',
    label: 'Pathological',
    text: 'A'.repeat(1000),
    pattern: 'AAAB',
    blurb: 'A thousand A’s and a needle that almost matches at every cell. Naive re-reads; KMP never looks back.',
  },
  {
    id: 'english',
    label: 'English sentence',
    text: 'the quick brown fox jumps over the lazy dog while another fox naps in the box',
    pattern: 'fox',
    blurb: 'Big alphabet, short needle: most text characters are not in the pattern, so Horspool leaps by three.',
  },
]

export const DEFAULT_PRESET = PRESETS[0]
