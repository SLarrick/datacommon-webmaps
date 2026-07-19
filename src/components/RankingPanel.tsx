import { useEffect, useRef } from 'react'
import type { Classification } from '../lib/classify'
import { NO_DATA_COLOR, formatValue } from '../lib/classify'

export interface RankRow {
  id: string
  name: string
  sublabel: string | null
  value: number | null
  rank: number | null
  color: string
}

interface Props {
  rows: RankRow[]
  classification: Classification
  variableLabel: string
  yearLabel: string | null
  isAcs: boolean
  hoveredId: string | null
  onHover: (id: string | null) => void
  onClose: () => void
}

export default function RankingPanel({
  rows,
  classification,
  variableLabel,
  yearLabel,
  isAcs,
  hoveredId,
  onHover,
  onClose,
}: Props) {
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  // When the map drives the hover, keep the matching row in view.
  useEffect(() => {
    if (hoveredId === null) return
    rowRefs.current.get(hoveredId)?.scrollIntoView({ block: 'nearest' })
  }, [hoveredId])

  const maxAbs = Math.max(Math.abs(classification.min), Math.abs(classification.max)) || 1

  return (
    <div className="rank-panel" onMouseLeave={() => onHover(null)}>
      <div className="rank-header">
        <div className="rank-title">
          Rankings
          <span className="rank-subtitle">
            {variableLabel}
            {yearLabel && ` · ${yearLabel}`}
          </span>
        </div>
        <button type="button" className="rank-close" onClick={onClose} aria-label="Close rankings">
          ×
        </button>
      </div>
      <div className="rank-list">
        {rows.map((r) => (
          <div
            key={r.id}
            ref={(el) => {
              if (el) rowRefs.current.set(r.id, el)
              else rowRefs.current.delete(r.id)
            }}
            className={`rank-row${hoveredId === r.id ? ' is-hovered' : ''}${r.value === null ? ' is-nodata' : ''}`}
            onMouseEnter={() => onHover(r.id)}
          >
            <span className="rank-num">{r.rank ?? '—'}</span>
            <span className="rank-chip" style={{ background: r.color }} />
            <span className="rank-name">
              {r.name}
              {r.sublabel && <span className="rank-sub"> · {r.sublabel}</span>}
            </span>
            <span className="rank-value">
              {r.value === null ? 'No data' : formatValue(r.value, classification)}
            </span>
            {r.value !== null && (
              <span
                className="rank-bar"
                style={{
                  width: `${(Math.abs(r.value) / maxAbs) * 100}%`,
                  background: r.color,
                }}
              />
            )}
          </div>
        ))}
      </div>
      {isAcs && (
        <div className="rank-footnote">
          ACS estimates — nearby ranks may not be statistically meaningful differences.
        </div>
      )}
    </div>
  )
}

export function buildRankRows(
  units: { id: string; name: string; sublabel: string | null }[],
  values: Map<string, number | null>,
  classification: Classification,
): RankRow[] {
  const withValue: RankRow[] = []
  const noData: RankRow[] = []
  for (const u of units) {
    const value = values.get(u.id) ?? null
    if (value === null) {
      noData.push({ ...u, value: null, rank: null, color: NO_DATA_COLOR })
    } else {
      withValue.push({ ...u, value, rank: null, color: '' })
    }
  }
  withValue.sort((a, b) => (b.value as number) - (a.value as number))
  let prev: number | undefined
  let rank = 0
  withValue.forEach((r, i) => {
    if (r.value !== prev) {
      rank = i + 1
      prev = r.value as number
    }
    r.rank = rank
    r.color = colorFor(r.value as number, classification)
  })
  noData.sort((a, b) => a.name.localeCompare(b.name))
  return [...withValue, ...noData]
}

function colorFor(value: number, c: Classification): string {
  let i = 0
  while (i < c.breaks.length && value >= c.breaks[i]) i++
  return c.colors[i]
}
