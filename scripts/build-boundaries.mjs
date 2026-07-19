/**
 * build-boundaries.mjs
 *
 * Generates the Phase 2 boundary files from the DataCommon API:
 *   - public/data/mapc_subregions.geojson   (8 subregions, dissolved from munis)
 *   - public/data/mapc_tracts_2010.geojson  (2010 tracts clipped to MAPC)
 *   - public/data/mapc_tracts_2020.geojson  (2020 tracts clipped to MAPC)
 *
 * Tract features are stamped with their primary municipality (most blocks in
 * the _datakeys_geog_xw_* crosswalks) and that muni's subregion, so the app
 * can filter tracts by frame without any spatial math.
 *
 * Requires public/data/mapc_munis.geojson (Phase 1) and npx mapshaper.
 *
 * Usage: node scripts/build-boundaries.mjs
 */

import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'public/data')
const TMP = mkdtempSync(join(tmpdir(), 'dcwm-boundaries-'))
const API = 'https://datacommon.mapc.org/api/'

async function query(db, sql) {
  const url = `${API}?token=datacommon&database=${db}&query=${encodeURIComponent(sql)}`
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok || text.startsWith('Unable')) throw new Error(`API error: ${text.slice(0, 150)}`)
  return JSON.parse(text)
}

// The GeoJSON export caps results at 500 features; the shapefile export
// returns the full layer (with a .prj we can reproject from).
async function exportShapefile(schema, table, destDir) {
  const url = `https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=${schema}&table=${table}&format=shapefile`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`export failed for ${table}: ${res.status}`)
  const zipPath = join(destDir, `${table}.zip`)
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))
  execSync(`unzip -o -q "${zipPath}" -d "${destDir}/${table}"`)
  const shp = execSync(`ls "${destDir}/${table}"/*.shp`).toString().trim()
  return shp
}

function mapshaper(args) {
  execSync(`npx -y mapshaper ${args}`, { stdio: ['ignore', 'inherit', 'inherit'] })
}

async function buildCrosswalk(xwTable, ctCol, muniInfo) {
  // Primary municipality per tract = the muni contributing the most blocks.
  const res = await query('ds', `
    SELECT trim(${ctCol}) AS ct_id, muni_id, count(*) AS blocks
    FROM tabular.${xwTable}
    GROUP BY 1, 2`)
  const best = new Map()
  for (const r of res.rows) {
    const muniId = Number(r.muni_id)
    if (!muniInfo.has(muniId)) continue // keep MAPC tracts only
    const prev = best.get(r.ct_id)
    if (!prev || Number(r.blocks) > prev.blocks) {
      best.set(r.ct_id, { muniId, blocks: Number(r.blocks) })
    }
  }
  return best
}

function tractName(ctId) {
  // 11-digit GEOID → census display name, e.g. 25017353102 → "3531.02"
  const code = ctId.slice(5)
  const base = String(Number(code.slice(0, 4)))
  const suffix = code.slice(4)
  return suffix === '00' ? base : `${base}.${suffix}`
}

async function buildTracts(vintage, layerTable, layerKey, xwTable, xwCol, muniInfo) {
  console.log(`Tracts ${vintage}: crosswalk…`)
  const primary = await buildCrosswalk(xwTable, xwCol, muniInfo)
  console.log(`  ${primary.size} MAPC tracts`)

  // Crosswalk CSV for mapshaper to join onto the polygons.
  // "tname" avoids colliding with the TIGER layer's own "name" field; the join
  // key isn't copied by mapshaper, so ct_id is re-derived from the layer key.
  const xwPath = join(TMP, `xw_${vintage}.csv`)
  const lines = ['xw_ct,tname,muni_id,municipal,subreg_id,subrg_abbr']
  for (const [ctId, p] of primary) {
    const m = muniInfo.get(p.muniId)
    lines.push(`${ctId},Tract ${tractName(ctId)},${p.muniId},${m.name},${m.subregId},${m.subregAbbr}`)
  }
  writeFileSync(xwPath, lines.join('\n'))

  console.log(`  downloading ${layerTable} (shapefile)…`)
  const shp = await exportShapefile('mapc', layerTable, TMP)
  const outPath = join(DATA, `mapc_tracts_${vintage}.geojson`)
  mapshaper(
    `"${shp}" -proj wgs84 ` +
      `-join "${xwPath}" keys=${layerKey},xw_ct string-fields=xw_ct ` +
      `-filter "muni_id != null" ` +
      `-each "ct_id = String(${layerKey}).trim(), name = tname" ` +
      `-filter-fields ct_id,name,muni_id,municipal,subreg_id,subrg_abbr ` +
      `-simplify 12% keep-shapes -filter remove-empty -o precision=0.00001 force "${outPath}"`,
  )
  const written = JSON.parse(readFileSync(outPath, 'utf8'))
  console.log(`  wrote ${written.features.length} features`)
}

async function main() {
  const munis = JSON.parse(readFileSync(join(DATA, 'mapc_munis.geojson'), 'utf8'))
  const muniInfo = new Map(
    munis.features.map((f) => [
      Number(f.properties.muni_id),
      {
        name: f.properties.municipal,
        subregId: f.properties.subreg_id,
        subregAbbr: f.properties.subrg_abbr,
      },
    ]),
  )
  console.log(`${muniInfo.size} MAPC municipalities loaded`)

  console.log('Subregions: dissolving from munis…')
  const subregNames = await query('ds', `
    SELECT DISTINCT subrg_id, subrg_nm, subrg_acr FROM tabular._datakeys_muni_all
    WHERE subrg_id IS NOT NULL ORDER BY subrg_id`)
  mapshaper(
    `"${join(DATA, 'mapc_munis.geojson')}" -dissolve subreg_id copy-fields=subregion,subrg_abbr ` +
      `-o precision=0.00001 "${join(TMP, 'subregions_raw.geojson')}"`,
  )
  const sub = JSON.parse(readFileSync(join(TMP, 'subregions_raw.geojson'), 'utf8'))
  const nameById = new Map(subregNames.rows.map((r) => [Number(r.subrg_id), r]))
  for (const f of sub.features) {
    const r = nameById.get(Number(f.properties.subreg_id))
    f.properties = {
      subreg_id: Number(f.properties.subreg_id),
      name: r ? r.subrg_nm : f.properties.subregion,
      subrg_abbr: r ? r.subrg_acr : f.properties.subrg_abbr,
    }
  }
  writeFileSync(join(DATA, 'mapc_subregions.geojson'), JSON.stringify(sub))
  console.log(`  ${sub.features.length} subregions written`)

  await buildTracts('2020', 'census2020_tracts_poly', 'GEOID', '_datakeys_geog_xw_2020', 'ct20_id', muniInfo)
  await buildTracts('2010', 'census2010_tracts_poly', 'ct10_id', '_datakeys_geog_xw_2010', 'ct10_id', muniInfo)

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
