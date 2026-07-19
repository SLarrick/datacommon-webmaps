import type { BinType, Frame, Selection } from '../types'
import { VALID_BINS } from './geo'

export interface UrlState extends Selection {
  frame: Frame
  bin: BinType
  rankOpen: boolean
  embed: boolean
}

function parseFrame(raw: string | null): Frame {
  if (raw) {
    const m = raw.match(/^(subreg|muni):(\d+)$/)
    if (m) return { type: m[1] as 'subreg' | 'muni', id: Number(m[2]) }
  }
  return { type: 'mapc', id: null }
}

function serializeFrame(frame: Frame): string {
  return frame.type === 'mapc' ? 'mapc' : `${frame.type}:${frame.id}`
}

export function readUrlState(): UrlState {
  const p = new URLSearchParams(window.location.search)
  const frame = parseFrame(p.get('frame'))
  const rawBin = p.get('bin') as BinType | null
  const bin =
    rawBin && VALID_BINS[frame.type].includes(rawBin) ? rawBin : VALID_BINS[frame.type][0]
  return {
    frame,
    bin,
    table: p.get('table'),
    variable: p.get('var'),
    year: p.get('year'),
    rankOpen: p.get('rank') === '1',
    embed: p.get('embed') === '1',
  }
}

export function writeUrlState(
  frame: Frame,
  bin: BinType,
  sel: Selection,
  rankOpen: boolean,
  embed: boolean,
): void {
  const p = new URLSearchParams()
  p.set('frame', serializeFrame(frame))
  p.set('bin', bin)
  if (sel.table) p.set('table', sel.table)
  if (sel.variable) p.set('var', sel.variable)
  if (sel.year) p.set('year', sel.year)
  if (rankOpen) p.set('rank', '1')
  if (embed) p.set('embed', '1')
  const next = `${window.location.pathname}?${p.toString()}`
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', next)
  }
}
