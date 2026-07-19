import type {
  BinType,
  CatalogTable,
  DataRow,
  Frame,
  FrameType,
  UnitCollection,
  VisibleUnit,
} from '../types'

/** Subregion rows live in the `_m` tables at these muni_ids. */
export const SUBREGION_ID_MIN = 355
export const SUBREGION_ID_MAX = 362

/** Bins must nest strictly below the frame. First entry is the default. */
export const VALID_BINS: Record<FrameType, BinType[]> = {
  mapc: ['muni', 'subreg', 'ct'],
  subreg: ['muni', 'ct'],
  muni: ['ct'],
}

export const BIN_LABELS: Record<BinType, string> = {
  muni: 'Municipality',
  subreg: 'MAPC Subregion',
  ct: 'Census Tract',
}

export const FRAME_LABELS: Record<FrameType, string> = {
  mapc: 'MAPC Region',
  subreg: 'MAPC Subregion',
  muni: 'Municipality',
}

/** Parse a year value's end vintage: '2015-19' → 2019, '2019-23' → 2023, '2023' → 2023. */
export function yearEndVintage(year: string | null): number | null {
  if (!year) return null
  const range = year.match(/^(\d{4})-(\d{2})$/)
  if (range) {
    const start = Number(range[1])
    let end = Math.floor(start / 100) * 100 + Number(range[2])
    if (end < start) end += 100
    return end
  }
  const plain = year.match(/^\d{4}$/)
  return plain ? Number(year) : null
}

/** Which tract boundary vintage a ct-level table/year combination joins to. */
export function tractVintage(table: CatalogTable, year: string | null): 2010 | 2020 {
  const end = yearEndVintage(year)
  if (end !== null) return end >= 2020 ? 2020 : 2010
  // No usable year: prefer the vintage the table actually has a join column for.
  if (table.joinCols?.ct20) return 2020
  if (table.joinCols?.ct10) return 2010
  return 2020
}

function stripGeoid(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null
  const us = s.indexOf('US')
  return us >= 0 ? s.slice(us + 2) : s
}

/** The join id of a data row for the given bin, or null if it has none. */
export function rowJoinId(
  row: DataRow,
  table: CatalogTable,
  bin: BinType,
  vintage: 2010 | 2020,
): string | null {
  if (table.level === 'muni') {
    const id = Number(row.muni_id)
    if (!Number.isFinite(id)) return null
    if (bin === 'subreg') {
      return id >= SUBREGION_ID_MIN && id <= SUBREGION_ID_MAX ? String(id) : null
    }
    return String(id)
  }
  // ct-level: pick the vintage's join column, geoid as fallback.
  const primary = vintage === 2020 ? row.ct20_id : row.ct10_id
  if (primary != null && String(primary).trim()) return String(primary).trim()
  return stripGeoid(row.geoid)
}

interface BoundarySet {
  munis: UnitCollection | null
  subregions: UnitCollection | null
  tracts2010: UnitCollection | null
  tracts2020: UnitCollection | null
}

/** The bin units visible under the current frame, in render order. */
export function getVisibleUnits(
  bin: BinType,
  frame: Frame,
  vintage: 2010 | 2020,
  b: BoundarySet,
): VisibleUnit[] | null {
  if (bin === 'muni') {
    if (!b.munis) return null
    return b.munis.features
      .filter((f) => frame.type !== 'subreg' || Number(f.properties.subreg_id) === frame.id)
      .map((f) => ({
        id: String(Number(f.properties.muni_id)),
        name: String(f.properties.municipal),
        sublabel: f.properties.subrg_abbr ? String(f.properties.subrg_abbr) : null,
        feature: f,
      }))
  }
  if (bin === 'subreg') {
    if (!b.subregions) return null
    return b.subregions.features.map((f) => ({
      id: String(Number(f.properties.subreg_id)),
      name: String(f.properties.subrg_abbr ?? f.properties.name),
      sublabel: String(f.properties.name),
      feature: f,
    }))
  }
  const tracts = vintage === 2020 ? b.tracts2020 : b.tracts2010
  if (!tracts) return null
  return tracts.features
    .filter((f) => {
      if (frame.type === 'muni') return Number(f.properties.muni_id) === frame.id
      if (frame.type === 'subreg') return Number(f.properties.subreg_id) === frame.id
      return true
    })
    .map((f) => ({
      id: String(f.properties.ct_id),
      name: String(f.properties.name),
      sublabel: String(f.properties.municipal),
      feature: f,
    }))
}

/** Whether a table can serve the given bin. */
export function tableSupportsBin(table: CatalogTable, bin: BinType): boolean {
  if (bin === 'ct') return table.level === 'ct'
  if (bin === 'subreg') return table.level === 'muni' && table.hasSubregionRows
  return table.level === 'muni'
}
