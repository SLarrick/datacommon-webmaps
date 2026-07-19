import type { BinType, CatalogTable, DataRow, VisibleUnit } from '../types'
import { BIN_LABELS } from './geo'

/**
 * Build a GeoJSON of the current view: visible bin-unit polygons with the
 * selected table's row (all columns, selected year) merged into properties.
 */
export function downloadCurrentView(
  units: VisibleUnit[],
  rowsById: Map<string, DataRow>,
  tableEntry: CatalogTable,
  year: string | null,
  bin: BinType,
  frameLabel: string,
): void {
  const features = units.map((u) => {
    const row = rowsById.get(u.id)
    return {
      type: 'Feature' as const,
      properties: { ...u.feature.properties, ...(row ?? {}) },
      geometry: u.feature.geometry,
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
      frame: frameLabel,
      bin: BIN_LABELS[bin],
      generatedBy: 'MAPC DataCommon Web Maps (prototype)',
    },
    features,
  }
  const blob = new Blob([JSON.stringify(fc)], { type: 'application/geo+json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${tableEntry.table}${year ? `_${year}` : ''}_${bin}.geojson`
  a.click()
  URL.revokeObjectURL(a.href)
}
