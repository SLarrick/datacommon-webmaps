import { useEffect, useRef } from 'react'
import type { Classification } from '../lib/classify'
import { NO_DATA_COLOR, formatValue } from '../lib/classify'

export interface RankRow {
  muniId: number
  name: string
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
  hoveredMuniId: number | null
  onHoverMuni: (id: number | null) => void
  onClose: () => void
}

export default function RankingPanel({
  rows,
  classification,
  variableLabel,
  yearLabel,
  isAcs,
  hoveredMuniId,
  onHoverMuni,
  onClose,
}: Props) {
  const rowRefs = useRef(new Map<number, HTMLDivElement>())

  // When the map drives the hover, keep the matching row in view.
  useEffect(() => {
    if (hoveredMuniId === null) return
    rowRefs.current.get(hoveredMuniId)?.scrollIntoView({ block: 'nearest' })
  }, [hoveredMuniId])

  const maxAbs = Math.max(Math.abs(classification.min), Math.abs(classification.max)) || 1

  return (
    <div className="rank-panel" onMouseLeave={() => onHoverMuni(null)}>
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
            key={r.muniId}
            ref={(el) => {
              if (el) rowRefs.current.set(r.muniId, el)
              else rowRefs.current.delete(r.muniId)
            }}
            className={`rank-row${hoveredMuniId === r.muniId ? ' is-hovered' : ''}${r.value === null ? ' is-nodata' : ''}`}
            onMouseEnter={() => onHoverMuni(r.muniId)}
          >
            <span className="rank-num">{r.rank ?? '—'}</span>
            <span className="rank-chip" style={{ background: r.color }} />
            <span className="rank-name">{r.name}</span>
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
  features: { muniId: number; name: string }[],
  values: Map<number, number | null>,
  classification: Classification,
): RankRow[] {
  const withValue: RankRow[] = []
  const noData: RankRow[] = []
  for (const f of features) {
    const value = values.get(f.muniId) ?? null
    if (value === null) {
      noData.push({ muniId: f.muniId, name: f.name, value: null, rank: null, color: NO_DATA_COLOR })
    } else {
      withValue.push({ muniId: f.muniId, name: f.name, value, rank: null, color: '' })
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
