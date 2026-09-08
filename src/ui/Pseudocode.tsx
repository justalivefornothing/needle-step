import { PSEUDOCODE, type AlgoId } from '../core'

export function Pseudocode({ algo, line, active }: { algo: AlgoId; line: number; active: boolean }) {
  const lines = PSEUDOCODE[algo]
  return (
    <section className="card" aria-label="Pseudocode">
      <h3 className="card-title">Pseudocode</h3>
      <ol className="mt-2 font-mono text-[12.5px] leading-6">
        {lines.map((text, k) => {
          const hot = active && k === line
          return (
            <li
              key={k}
              className={
                'flex gap-2 whitespace-pre rounded px-2 transition-colors duration-150 ' +
                (hot ? 'bg-thread-400/15 text-cream-100' : 'text-denim-300')
              }
              aria-current={hot ? 'step' : undefined}
            >
              <span className={'w-4 shrink-0 text-right ' + (hot ? 'text-thread-400' : 'text-denim-500')}>{k + 1}</span>
              <span>{text}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
