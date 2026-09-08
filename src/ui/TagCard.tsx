import { useMemo } from 'react'
import { horspoolShiftTable, kmpFailureTable, type AlgoId, type Lookup } from '../core'

function Tag({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="tag" aria-label={title}>
      <span className="tag-hole" aria-hidden />
      <h3 className="tag-title">{title}</h3>
      {children}
      <p className="mt-3 text-xs leading-snug text-kraft-700">{note}</p>
    </section>
  )
}

function FailureTag({ pattern, lookup }: { pattern: string; lookup: Lookup | null }) {
  const fail = useMemo(() => kmpFailureTable(pattern), [pattern])
  const hot = lookup?.table === 'failure' ? Number(lookup.key) : -1
  return (
    <Tag
      title="KMP failure table"
      note="fail[j] = length of the longest proper prefix of P[0..j] that is also its suffix. On a mismatch at j the pattern falls back to fail[j−1] without re-reading text."
    >
      <div className="overflow-x-auto">
        <table className="tag-table">
          <tbody>
            <tr>
              <th scope="row">j</th>
              {fail.map((_, j) => (
                <td key={j} className={j === hot ? 'hot' : ''}>
                  {j}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">P[j]</th>
              {Array.from(pattern, (ch, j) => (
                <td key={j} className={j === hot ? 'hot' : ''}>
                  {ch === ' ' ? '␣' : ch}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">fail</th>
              {fail.map((v, j) => (
                <td key={j} className={'value ' + (j === hot ? 'hot' : '')}>
                  {v}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {lookup?.table === 'failure' && (
        <p className="tag-readout">
          fail[{lookup.key}] = {lookup.value} → keep {lookup.value} matched cell{lookup.value === 1 ? '' : 's'}
        </p>
      )}
    </Tag>
  )
}

function BadCharTag({ pattern, lookup }: { pattern: string; lookup: Lookup | null }) {
  const table = useMemo(() => horspoolShiftTable(pattern), [pattern])
  const hotKey = lookup?.table === 'badChar' ? String(lookup.key) : null
  const entries = [...table.table.entries()]
  const hotIsDefault = hotKey !== null && !table.table.has(hotKey)
  return (
    <Tag
      title="Horspool shift table"
      note="For each character in P except the last, the distance from its rightmost occurrence to the end of P. Any other character lets the pattern jump its whole length."
    >
      <div className="overflow-x-auto">
        <table className="tag-table">
          <tbody>
            <tr>
              <th scope="row">char</th>
              {entries.map(([ch]) => (
                <td key={ch} className={ch === hotKey ? 'hot' : ''}>
                  {ch === ' ' ? '␣' : ch}
                </td>
              ))}
              <td className={'other ' + (hotIsDefault ? 'hot' : '')}>other</td>
            </tr>
            <tr>
              <th scope="row">shift</th>
              {entries.map(([ch, v]) => (
                <td key={ch} className={'value ' + (ch === hotKey ? 'hot' : '')}>
                  {v}
                </td>
              ))}
              <td className={'value ' + (hotIsDefault ? 'hot' : '')}>{table.default}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {lookup?.table === 'badChar' && (
        <p className="tag-readout">
          shift[{String(lookup.key) === ' ' ? '␣' : lookup.key}] = {lookup.value}
          {hotIsDefault ? ' (not in needle)' : ''}
        </p>
      )}
    </Tag>
  )
}

export function TagCard({ algo, pattern, lookup }: { algo: AlgoId; pattern: string; lookup: Lookup | null }) {
  if (pattern.length === 0) return null
  if (algo === 'kmp') return <FailureTag pattern={pattern} lookup={lookup} />
  if (algo === 'horspool') return <BadCharTag pattern={pattern} lookup={lookup} />
  return null
}
