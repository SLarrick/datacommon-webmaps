import type { Classification } from '../lib/classify'
import { NO_DATA_COLOR, formatValue } from '../lib/classify'

interface Props {
  classification: Classification | null
  title: string | null
  yearLabel: string | null
}

export default function Legend({ classification, title, yearLabel }: Props) {
  if (!classification || !title) return null
  const { breaks, colors, min, max, noDataCount } = classification

  const rows = colors.map((color, i) => {
    const lo = i === 0 ? min : breaks[i - 1]
    const hi = i === colors.length - 1 ? max : breaks[i]
    const flo = formatValue(lo, classification)
    const fhi = formatValue(hi, classification)
    // Degenerate classes ("12 – 12") read better as a single value.
    const label = colors.length === 1 || flo === fhi ? flo : `${flo} – ${fhi}`
    return { color, label }
  })

  return (
    <div className="legend">
      <div className="legend-title">
        {title}
        {yearLabel && <span className="legend-year">{yearLabel}</span>}
      </div>
      {rows.map((r, i) => (
        <div className="legend-row" key={i}>
          <span className="legend-swatch" style={{ background: r.color }} />
          <span>{r.label}</span>
        </div>
      ))}
      {noDataCount > 0 && (
        <div className="legend-row">
          <span className="legend-swatch legend-swatch-nodata" style={{ background: NO_DATA_COLOR }} />
          <span>No data ({noDataCount})</span>
        </div>
      )}
    </div>
  )
}
