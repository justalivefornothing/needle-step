import { describe } from './describe'
import type { ViewState } from './viewState'

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'moss' | 'rust' }) {
  return (
    <div className="min-w-[5.5rem]">
      <div className="text-[11px] uppercase tracking-wider text-denim-300">{label}</div>
      <div
        className={
          'font-stencil text-2xl leading-tight ' +
          (tone === 'moss' ? 'text-moss-500' : tone === 'rust' ? 'text-rust-400' : 'text-cream-100')
        }
      >
        {value}
      </div>
    </div>
  )
}

export function Readout({ view, text, pattern }: { view: ViewState; text: string; pattern: string }) {
  return (
    <section className="card flex flex-col gap-3" aria-label="Counters">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Stat label="comparisons" value={view.comparisons} />
        <Stat label="shifts" value={view.shifts} />
        <Stat label="alignment" value={view.shift} />
        <Stat label="matches" value={view.matches.length} tone={view.matches.length ? 'moss' : undefined} />
        {view.spurious > 0 && <Stat label="spurious" value={view.spurious} tone="rust" />}
      </div>
      <p className="border-t border-denim-700 pt-2 font-mono text-xs text-cream-200" aria-live="polite">
        {describe(view.last, text, pattern)}
      </p>
      {view.matches.length > 0 && (
        <p className="font-mono text-xs text-denim-300">
          found at {view.matches.slice(0, 12).join(', ')}
          {view.matches.length > 12 ? `, … (+${view.matches.length - 12})` : ''}
        </p>
      )}
    </section>
  )
}
