/**
 * build-local-datasets.mjs
 *
 * Builds "preview" datasets from local CSVs that are not yet published to
 * DataCommon. Currently: MAPC rental listings summaries (2026 Q2), long
 * format (one row per unit × bedroom count), pivoted wide so each geography
 * has exactly one row and each bedroom × metric is its own variable.
 *
 * Outputs:
 *   - public/data/local/rental_listings_m.json     (rows keyed muni_id)
 *   - public/data/local/rental_listings_ct.json    (rows keyed ct10_id)
 *   - public/data/local/catalog.json               (preview catalog entries)
 *
 * Cleaning rules (agreed July 2026):
 *   - Small samples are kept as-is (demo); listing-count columns are exposed
 *     as variables so users can judge reliability.
 *   - Tracts straddling municipal lines arrive as two partial rows; they are
 *     MERGED into one tract-wide row: counts summed, means count-weighted,
 *     median taken from the larger-count row.
 *   - Rows with malformed ids or geographies outside the MAPC layers are
 *     dropped (logged).
 *
 * Usage: node scripts/build-local-datasets.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const QUARTER_LABEL = '2026 Q2'
const MUNI_CSV = join(ROOT, 'local-data/listings_muni_summary_quarterly_2026Q2_20260804.csv')
const CT_CSV = join(ROOT, 'local-data/listings_ct_summary_quarterly_2026Q2_20260804.csv')
const OUT = join(ROOT, 'public/data/local')

const BEDROOMS = [0, 1, 2, 3, 4, 5, 6]
const bedroomLabel = (n) => (n === 0 ? 'Studio' : `${n}-bedroom`)

function parseCsv(path) {
  const text = readFileSync(path, 'utf8').trim()
  const lines = text.split(/\r?\n/)
  const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.replace(/^"|"$/g, ''))
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]))
  })
}

/** Merge partial summaries for the same (unit, bedrooms). */
function mergeParts(parts) {
  if (parts.length === 1) return parts[0]
  const count = parts.reduce((s, p) => s + p.count, 0)
  const mean = parts.reduce((s, p) => s + p.mean * p.count, 0) / count
  const biggest = [...parts].sort((a, b) => b.count - a.count)[0]
  return { count, mean, median: biggest.median }
}

function pivot(records, idField) {
  // records: {id, bedrooms, count, mean, median}
  const byUnit = new Map()
  for (const r of records) {
    if (!byUnit.has(r.id)) byUnit.set(r.id, new Map())
    const unit = byUnit.get(r.id)
    if (!unit.has(r.bedrooms)) unit.set(r.bedrooms, [])
    unit.get(r.bedrooms).push(r)
  }
  const rows = []
  let merged = 0
  for (const [id, unit] of byUnit) {
    const row = { [idField]: id, total_listings: 0 }
    for (const n of BEDROOMS) {
      const parts = unit.get(n)
      if (!parts) continue
      if (parts.length > 1) merged += 1
      const m = mergeParts(parts)
      row[`br${n}_count`] = m.count
      row[`br${n}_meanrent`] = Math.round(m.mean)
      row[`br${n}_medrent`] = m.median
      row.total_listings += m.count
    }
    rows.push(row)
  }
  return { rows, merged }
}

function variables() {
  const vars = []
  for (const n of BEDROOMS) {
    vars.push({ name: `br${n}_medrent`, alias: `${bedroomLabel(n)} · Median rent`, type: 'int4' })
  }
  for (const n of BEDROOMS) {
    vars.push({ name: `br${n}_meanrent`, alias: `${bedroomLabel(n)} · Mean rent`, type: 'int4' })
  }
  for (const n of BEDROOMS) {
    vars.push({ name: `br${n}_count`, alias: `${bedroomLabel(n)} · Listings count`, type: 'int4' })
  }
  vars.push({ name: 'total_listings', alias: 'Total listings (all bedroom sizes)', type: 'int4' })
  return vars
}

function catalogEntry(overrides) {
  return {
    level: 'muni',
    sibling: null,
    topic: 'Housing',
    subtopic: 'Rental Listings',
    source: 'MAPC Rental Listings Database',
    datasetId: null,
    altTitle: null,
    geography: null,
    universe: 'Rental listings',
    datesAvail: QUARTER_LABEL,
    joinKey: 'muni_id',
    joinCols: null,
    yearCol: null,
    years: [],
    nRows: null,
    nUnits: null,
    maxRowsPerUnitYear: 1,
    hasSubregionRows: false,
    variables: variables(),
    eligible: true,
    reasons: [],
    local: true,
    ...overrides,
  }
}

function main() {
  mkdirSync(OUT, { recursive: true })

  // ---- municipal ----
  const munis = JSON.parse(readFileSync(join(ROOT, 'public/data/mapc_munis.geojson'), 'utf8'))
  const idByName = new Map(
    munis.features.map((f) => [String(f.properties.municipal).toUpperCase(), Number(f.properties.muni_id)]),
  )
  const muniRaw = parseCsv(MUNI_CSV)
  const muniRecords = []
  let outsideMapc = 0
  for (const r of muniRaw) {
    const id = idByName.get(r.muni)
    if (id === undefined) {
      outsideMapc += 1
      continue
    }
    muniRecords.push({
      id,
      bedrooms: Number(r.numRooms),
      count: Number(r.rentcount),
      mean: Number(r.meanrent),
      median: Number(r.medrent),
    })
  }
  const muniPivot = pivot(muniRecords, 'muni_id')
  for (const row of muniPivot.rows) {
    row.municipal = munis.features.find((f) => Number(f.properties.muni_id) === row.muni_id)?.properties.municipal
  }
  writeFileSync(join(OUT, 'rental_listings_m.json'), JSON.stringify({ rows: muniPivot.rows }))
  console.log(
    `municipal: ${muniPivot.rows.length} munis (dropped ${outsideMapc} non-MAPC rows, merged ${muniPivot.merged})`,
  )

  // ---- census tract (2010 vintage) ----
  const tracts = JSON.parse(readFileSync(join(ROOT, 'public/data/mapc_tracts_2010.geojson'), 'utf8'))
  const mapcTracts = new Set(tracts.features.map((f) => String(f.properties.ct_id)))
  const ctRaw = parseCsv(CT_CSV)
  const ctRecords = []
  let badId = 0
  let outsideTracts = 0
  for (const r of ctRaw) {
    const id = String(r.ct10_id).trim()
    if (id.length !== 11) {
      badId += 1
      continue
    }
    if (!mapcTracts.has(id)) {
      outsideTracts += 1
      continue
    }
    ctRecords.push({
      id,
      bedrooms: Number(r.numRooms),
      count: Number(r.rentcount),
      mean: Number(r.meanrent),
      median: Number(r.medrent),
    })
  }
  const ctPivot = pivot(ctRecords, 'ct10_id')
  writeFileSync(join(OUT, 'rental_listings_ct.json'), JSON.stringify({ rows: ctPivot.rows }))
  console.log(
    `tract: ${ctPivot.rows.length} tracts (dropped ${badId} malformed ids, ${outsideTracts} non-MAPC rows, merged ${ctPivot.merged} straddler summaries)`,
  )

  // ---- preview catalog ----
  const catalog = {
    generatedAt: new Date().toISOString(),
    note: 'Preview datasets not yet published to DataCommon',
    tables: [
      catalogEntry({
        table: 'rental_listings_m',
        title: `Rental Listings Summary, ${QUARTER_LABEL} (Municipal) — Preview`,
        description:
          `Median and mean asking rents and listing counts by bedroom size, summarized from the MAPC rental listings database for ${QUARTER_LABEL}. Preview — not yet published to DataCommon. Small-sample medians (see listing counts) reflect very few listings.`,
        sibling: 'rental_listings_ct',
        dataUrl: '/data/local/rental_listings_m.json',
        nUnits: muniPivot.rows.length,
      }),
      catalogEntry({
        table: 'rental_listings_ct',
        level: 'ct',
        title: `Rental Listings Summary, ${QUARTER_LABEL} (Census Tracts) — Preview`,
        description:
          `Median and mean asking rents and listing counts by bedroom size, summarized from the MAPC rental listings database for ${QUARTER_LABEL} on 2010 census tracts. Preview — not yet published to DataCommon. Small-sample medians (see listing counts) reflect very few listings.`,
        sibling: 'rental_listings_m',
        joinKey: 'ct10_id',
        joinCols: { ct10: 'ct10_id', ct20: null, geoid: null },
        dataUrl: '/data/local/rental_listings_ct.json',
        nUnits: ctPivot.rows.length,
      }),
    ],
  }
  writeFileSync(join(OUT, 'catalog.json'), JSON.stringify(catalog, null, 1))
  console.log('preview catalog written')
}

main()
