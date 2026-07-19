import type { Geometry } from 'geojson'

export type Level = 'muni' | 'ct'
export type BinType = 'muni' | 'subreg' | 'ct'
export type FrameType = 'mapc' | 'subreg' | 'muni'

/** Geographic frame: the extent of the map. id is set for subreg/muni frames. */
export interface Frame {
  type: FrameType
  id: number | null
}

export interface CatalogVariable {
  name: string
  alias: string
  type: string
}

export interface CatalogTable {
  table: string
  level: Level
  sibling: string | null
  title: string
  altTitle: string | null
  description: string | null
  geography: string | null
  datesAvail: string | null
  universe: string | null
  joinKey: string | null
  joinCols: { ct10: string | null; ct20: string | null; geoid: string | null } | null
  yearCol: string | null
  years: string[]
  nRows: number | null
  nUnits: number | null
  maxRowsPerUnitYear: number | null
  hasSubregionRows: boolean
  variables: CatalogVariable[]
  eligible: boolean
  reasons: string[]
}

export interface Catalog {
  generatedAt: string
  totals: {
    muni: number
    ct: number
    muniEligible: number
    ctEligible: number
    withSubregionRows: number
    siblingPairs: number
  }
  tables: CatalogTable[]
}

export type DataRow = Record<string, unknown>

export interface Selection {
  table: string | null
  variable: string | null
  year: string | null
}

export interface UnitFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: Geometry
}

export interface UnitCollection {
  type: 'FeatureCollection'
  features: UnitFeature[]
}

/** A bin unit currently visible on the map, in a bin-agnostic shape. */
export interface VisibleUnit {
  id: string
  name: string
  sublabel: string | null
  feature: UnitFeature
}
