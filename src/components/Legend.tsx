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
    const label =
      colors.length === 1
        ? formatValue(min, classification)
        : `${formatValue(lo, classification)} – ${formatValue(hi, classification)}`
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
