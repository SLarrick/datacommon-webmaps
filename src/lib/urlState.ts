import type { Selection } from '../types'

// frame/bin are fixed in Phase 1 but included in URLs so Phase 2 links
// (with other frames/bins) remain backward-compatible.
export const FRAME = 'mapc'
export const BIN = 'muni'

export function readUrlState(): Selection {
  const p = new URLSearchParams(window.location.search)
  return {
    table: p.get('table'),
    variable: p.get('var'),
    year: p.get('year'),
  }
}

export function writeUrlState(sel: Selection): void {
  const p = new URLSearchParams()
  p.set('frame', FRAME)
  p.set('bin', BIN)
  if (sel.table) p.set('table', sel.table)
  if (sel.variable) p.set('var', sel.variable)
  if (sel.year) p.set('year', sel.year)
  const next = `${window.location.pathname}?${p.toString()}`
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', next)
  }
}
