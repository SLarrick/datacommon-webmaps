import type { CatalogVariable } from '../types'

// Sequential (ColorBrewer YlGnBu) and diverging (RdYlBu-ish) 5-class ramps,
// both colorblind-safe.
const SEQUENTIAL = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
const DIVERGING = ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6']
export const NO_DATA_COLOR = '#e3e3e0'

export interface Classification {
  /** Inner break values; classes = breaks.length + 1 */
  breaks: number[]
  colors: string[]
  diverging: boolean
  min: number
  max: number
  /** Count of geographies with no value */
  noDataCount: number
  percent: boolean
  /** True when percent values are stored as 0–1 fractions */
  fraction: boolean
}

function pickColors(ramp: string[], n: number): string[] {
  if (n >= ramp.length) return ramp
  // A truly single-class map (all values equal) reads best as a mid-tone,
  // not the extreme end of the ramp.
  if (n <= 1) return [ramp[Math.floor(ramp.length / 2)]]
  return Array.from({ length: n }, (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (n - 1))])
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function dedupe(breaks: number[]): number[] {
  return [...new Set(breaks)].sort((a, b) => a - b)
}

function isPercentLike(variable: CatalogVariable): boolean {
  const hay = `${variable.name} ${variable.alias}`.toLowerCase()
  return /%|percent|(^|[^a-z])pct|(^|[^a-z])share([^a-z]|$)/.test(hay)
}

export function classify(
  values: number[],
  variable: CatalogVariable,
  noDataCount: number,
  k = 5,
): Classification | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  const diverging = min < 0 && max > 0
  const percent = isPercentLike(variable)
  const fraction = percent && max <= 1.5 && min >= -1.5

  let breaks: number[]
  let colors: string[]

  if (diverging) {
    // Pivot the ramp at 0: warm classes are strictly negative, cool classes
    // start at 0 — quantile breaks within each sign.
    const negs = sorted.filter((v) => v < 0)
    const poss = sorted.filter((v) => v >= 0)
    const negBreaks = negs.length >= 4 ? [quantile(negs, 0.5)] : []
    const posBreaks =
      poss.length >= 6
        ? [quantile(poss, 1 / 3), quantile(poss, 2 / 3)]
        : poss.length >= 3
          ? [quantile(poss, 0.5)]
          : []
    breaks = dedupe([...negBreaks, 0, ...posBreaks])
    const nNeg = breaks.filter((b) => b <= 0).length
    const nPos = breaks.length + 1 - nNeg
    colors = [...DIVERGING.slice(0, nNeg), ...DIVERGING.slice(DIVERGING.length - nPos)]
  } else {
    const rawBreaks: number[] = []
    for (let i = 1; i < k; i++) rawBreaks.push(quantile(sorted, i / k))
    // Skewed distributions can produce duplicate quantile breaks — collapse them.
    breaks = dedupe(rawBreaks).filter((b) => b > min && b <= max)
    // Zero-inflated data (most values at the minimum) can collapse every
    // quantile break — fall back to equal intervals so variation still shows.
    if (breaks.length < 2 && max > min) {
      const step = (max - min) / k
      breaks = dedupe(Array.from({ length: k - 1 }, (_, i) => min + step * (i + 1))).filter(
        (b) => b > min && b <= max,
      )
    }
    colors = pickColors(SEQUENTIAL, breaks.length + 1)
  }

  return { breaks, colors, diverging, min, max, noDataCount, percent, fraction }
}

export function classIndex(value: number, breaks: number[]): number {
  let i = 0
  while (i < breaks.length && value >= breaks[i]) i++
  return i
}

export interface LegendRow {
  color: string
  label: string
}

/** The legend's class rows — shared by the on-map legend and PNG export. */
export function legendRows(c: Classification): LegendRow[] {
  const rows = c.colors.map((color, i) => {
    const lo = i === 0 ? c.min : c.breaks[i - 1]
    const hi = i === c.colors.length - 1 ? c.max : c.breaks[i]
    const flo = formatValue(lo, c)
    const fhi = formatValue(hi, c)
    // Degenerate classes ("12 – 12") read better as a single value.
    const label = c.colors.length === 1 || flo === fhi ? flo : `${flo} – ${fhi}`
    return { color, label }
  })
  if (c.noDataCount > 0) {
    rows.push({ color: NO_DATA_COLOR, label: `No data (${c.noDataCount})` })
  }
  return rows
}

export function formatValue(value: number, c: Pick<Classification, 'percent' | 'fraction'> | null): string {
  if (!Number.isFinite(value)) return '—'
  const display = c?.fraction ? value * 100 : value
  const abs = Math.abs(display)
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 1 : 2
  const s = display.toLocaleString('en-US', { maximumFractionDigits: digits })
  return c?.percent ? `${s}%` : s
}
