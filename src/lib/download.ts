import type { CatalogTable, DataRow, MuniCollection } from '../types'

/**
 * Build a GeoJSON of the current view: MAPC municipal polygons with the
 * selected table's row (all columns, selected year) merged into properties.
 */
export function downloadCurrentView(
  boundaries: MuniCollection,
  rowsByMuni: Map<number, DataRow>,
  tableEntry: CatalogTable,
  year: string | null,
): void {
  const features = boundaries.features.map((f) => {
    const row = rowsByMuni.get(Number(f.properties.muni_id))
    return {
      type: 'Feature' as const,
      properties: { ...f.properties, ...(row ?? {}) },
      geometry: f.geometry,
    }
  })
  const fc = {
    type: 'FeatureCollection' as const,
    name: tableEntry.table,
    metadata: {
      source: 'MAPC DataCommon',
      table: tableEntry.table,
      title: tableEntry.title,
      year: year ?? undefined,
      frame: 'MAPC region',
      bin: 'Municipality',
      generatedBy: 'MAPC DataCommon Web Maps (prototype)',
    },
    features,
  }
  const blob = new Blob([JSON.stringify(fc)], { type: 'application/geo+json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${tableEntry.table}${year ? `_${year}` : ''}_mapc_munis.geojson`
  a.click()
  URL.revokeObjectURL(a.href)
}
