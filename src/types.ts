import type { Geometry } from 'geojson'

export interface CatalogVariable {
  name: string
  alias: string
  type: string
}

export interface CatalogTable {
  table: string
  title: string
  altTitle: string | null
  description: string | null
  geography: string | null
  datesAvail: string | null
  universe: string | null
  joinKey: string | null
  yearCol: string | null
  years: string[]
  nRows: number | null
  nMunis: number | null
  maxRowsPerMuniYear: number | null
  variables: CatalogVariable[]
  eligible: boolean
  reasons: string[]
}

export interface Catalog {
  generatedAt: string
  totalMunicipalTables: number
  eligibleCount: number
  tables: CatalogTable[]
}

export type DataRow = Record<string, unknown>

export interface Selection {
  table: string | null
  variable: string | null
  year: string | null
}

export interface MuniFeature {
  type: 'Feature'
  properties: {
    muni_id: number
    municipal: string
    subreg_id: number | null
    subregion: string | null
    subrg_abbr: string | null
  }
  geometry: Geometry
}

export interface MuniCollection {
  type: 'FeatureCollection'
  features: MuniFeature[]
}
