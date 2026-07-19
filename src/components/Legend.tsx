import type { Classification } from '../lib/classify'
import { legendRows } from '../lib/classify'

interface Props {
  classification: Classification | null
  title: string | null
  yearLabel: string | null
}

export default function Legend({ classification, title, yearLabel }: Props) {
  if (!classification || !title) return null

  return (
    <div className="legend">
      <div className="legend-title">
        {title}
        {yearLabel && <span className="legend-year">{yearLabel}</span>}
      </div>
      {legendRows(classification).map((r, i) => (
        <div className="legend-row" key={i}>
          <span className="legend-swatch" style={{ background: r.color }} />
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  )
}
