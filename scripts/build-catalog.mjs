/**
 * build-catalog.mjs (v2)
 *
 * Introspects the MAPC DataCommon API and generates:
 *   - public/data/catalog.json  (the app's table catalog)
 *   - scripts/audit-report.md   (human-readable eligibility audit)
 *
 * Covers municipal (`_m`) and census-tract (`_ct`) tables.
 *
 * Eligibility rules:
 *   - `_m`: has muni_id column; >=1 numeric variable; one row per muni(-year)
 *   - `_ct`: has a tract join column (ct10_id / ct20_id / geoid); >=1 numeric
 *     variable; one row per tract(-year)
 *
 * Also records, per `_m` table, whether pre-computed subregion rows exist
 * (muni_id 355–362), and pairs sibling tables that exist at both levels.
 *
 * Usage: node scripts/build-catalog.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://datacommon.mapc.org/api/'
const TOKEN = 'datacommon'
const CONCURRENCY = 5

const HEADER_KEYS = new Set([
  'join_key', 'title', 'alt_title', 'tbl_table', 'tbl_num', 'geography',
  'descriptn', 'description', 'datesavail', 'coverage', 'universe', 'creator',
  'publisher', 'contributor', 'source', 'date_created', 'date_modified',
  'language', 'relation', 'rights', 'subject', 'format', 'identifier', 'type',
])

const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'money',
])

const ID_COLUMNS = new Set(['seq_id', 'muni_id', 'objectid', 'gid', 'id', 'logrecno', 'geoid'])

const YEAR_EXACT = ['cal_year', 'acs_year', 'fy', 'year', 'years', 'yr', 'survey_year', 'report_year', 'school_year']

async function query(db, sql, attempt = 0) {
  const url = `${API}?token=${TOKEN}&database=${db}&query=${encodeURIComponent(sql)}`
  try {
    const res = await fetch(url)
    const text = await res.text()
    if (!res.ok || text.startsWith('Unable')) throw new Error(`API error: ${text.slice(0, 120)}`)
    return JSON.parse(text)
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      return query(db, sql, attempt + 1)
    }
    throw err
  }
}

async function mapConcurrent(items, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

function pickYearColumn(columns) {
  const names = columns.map((c) => c.name)
  for (const cand of YEAR_EXACT) {
    if (names.includes(cand)) return cand
  }
  const fuzzy = names.find((n) => n.includes('year') && !n.includes('years_'))
  return fuzzy ?? null
}

async function main() {
  console.log('1/4 Listing municipal + tract tables…')
  const tablesRes = await query('ds', `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'tabular'
      AND (right(table_name, 2) = '_m' OR right(table_name, 3) = '_ct')
      AND left(table_name, 1) <> '_'
    ORDER BY table_name`)
  const tableNames = tablesRes.rows.map((r) => r.table_name)
  console.log(`   ${tableNames.length} tables`)

  console.log('2/4 Fetching all column definitions…')
  const colsRes = await query('ds', `
    SELECT table_name, column_name, udt_name, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'tabular'
      AND (right(table_name, 2) = '_m' OR right(table_name, 3) = '_ct')
    ORDER BY table_name, ordinal_position`)
  const columnsByTable = new Map()
  for (const r of colsRes.rows) {
    if (!columnsByTable.has(r.table_name)) columnsByTable.set(r.table_name, [])
    columnsByTable.get(r.table_name).push({ name: r.column_name, type: r.udt_name })
  }

  const metaTablesRes = await query('ds', `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'metadata'`)
  const metaTables = new Set(metaTablesRes.rows.map((r) => r.table_name))

  // The DataCommon browser's own registry: topic (menu1), subtopic (menu2),
  // display name (menu3), and source, keyed by table name.
  const browserRes = await query('ds', `
    SELECT table_name, menu1, menu2, menu3, source, active
    FROM tabular._data_browser WHERE db_name = 'ds'`)
  const browserByTable = new Map()
  for (const r of browserRes.rows) {
    const prev = browserByTable.get(r.table_name)
    if (!prev || (r.active === 'Y' && prev.active !== 'Y')) browserByTable.set(r.table_name, r)
  }

  console.log('3/4 Auditing each table (metadata + cardinality)…')
  let done = 0
  const entries = await mapConcurrent(tableNames, async (table) => {
    const level = table.endsWith('_ct') ? 'ct' : 'muni'
    const columns = columnsByTable.get(table) ?? []
    const colNames = new Set(columns.map((c) => c.name))
    const reasons = []

    const header = {}
    const aliases = new Map()
    if (metaTables.has(table)) {
      try {
        const meta = await query('ds', `SELECT name, alias, details FROM metadata.${table} ORDER BY orderid`)
        for (const row of meta.rows) {
          if (HEADER_KEYS.has(row.name)) header[row.name] = row.details
          else if (colNames.has(row.name)) aliases.set(row.name, row.alias)
        }
      } catch {
        reasons.push('metadata query failed (using column names as labels)')
      }
    } else {
      reasons.push('no metadata table (using column names as labels)')
    }

    const yearCol = pickYearColumn(columns)
    const variables = columns
      .filter((c) => NUMERIC_TYPES.has(c.type))
      .filter((c) => !ID_COLUMNS.has(c.name) && !c.name.endsWith('_id') && c.name !== yearCol)
      .filter((c) => !/geoid|geo_id|fips/i.test(`${c.name} ${aliases.get(c.name) ?? ''}`))
      .map((c) => ({ name: c.name, alias: aliases.get(c.name) ?? c.name, type: c.type }))

    const joinCols =
      level === 'ct'
        ? {
            ct10: colNames.has('ct10_id') ? 'ct10_id' : null,
            ct20: colNames.has('ct20_id') ? 'ct20_id' : null,
            geoid: colNames.has('geoid') ? 'geoid' : null,
          }
        : null

    const browser = browserByTable.get(table) ?? null
    const entry = {
      table,
      level,
      sibling: null, // filled in below
      topic: browser?.menu1 ?? null,
      subtopic: browser?.menu2 ?? null,
      source: browser?.source ?? null,
      title: header.title || header.alt_title || table,
      altTitle: header.alt_title || null,
      description: header.descriptn || header.description || null,
      geography: header.geography || null,
      datesAvail: header.datesavail || null,
      universe: header.universe || null,
      joinKey: header.join_key || (colNames.has('muni_id') ? 'muni_id' : null),
      joinCols,
      yearCol,
      years: [],
      nRows: null,
      nUnits: null,
      maxRowsPerUnitYear: null,
      hasSubregionRows: false,
      variables,
      eligible: false,
      reasons,
    }

    const unitCol =
      level === 'muni'
        ? colNames.has('muni_id')
          ? 'muni_id'
          : null
        : ['ct20_id', 'ct10_id', 'geoid'].filter((c) => colNames.has(c)).length > 0
          ? `COALESCE(${['ct20_id', 'ct10_id', 'geoid'].filter((c) => colNames.has(c)).join(', ')})`
          : null

    if (!unitCol) {
      entry.reasons.push(level === 'muni' ? 'no muni_id column' : 'no tract join column (ct10_id/ct20_id/geoid)')
      return entry
    }
    if (variables.length === 0) {
      entry.reasons.push('no numeric variable columns')
      return entry
    }

    try {
      const groupCols = yearCol ? `${unitCol}, ${yearCol}` : unitCol
      const yearsSel = yearCol
        ? `(SELECT string_agg(DISTINCT ${yearCol}::text, '|') FROM tabular.${table})`
        : `NULL`
      const subregSel =
        level === 'muni'
          ? `(SELECT count(*) FROM tabular.${table} WHERE muni_id BETWEEN 355 AND 362)`
          : `0`
      const stats = await query('ds', `
        SELECT
          (SELECT count(*) FROM tabular.${table}) AS n_rows,
          (SELECT count(DISTINCT ${unitCol}) FROM tabular.${table}) AS n_units,
          (SELECT max(c) FROM (SELECT count(*) AS c FROM tabular.${table} GROUP BY ${groupCols}) g) AS max_per,
          ${yearsSel} AS years,
          ${subregSel} AS subreg_rows`)
      const s = stats.rows[0]
      entry.nRows = Number(s.n_rows)
      entry.nUnits = Number(s.n_units)
      entry.maxRowsPerUnitYear = Number(s.max_per)
      entry.hasSubregionRows = Number(s.subreg_rows) > 0
      entry.years = s.years
        ? [...new Set(String(s.years).split('|'))].sort((a, b) => String(a).localeCompare(String(b)))
        : []

      if (entry.maxRowsPerUnitYear > 1) {
        entry.reasons.push(
          yearCol
            ? `multiple rows per unit-year (max ${entry.maxRowsPerUnitYear}) — subgroup breakdowns not supported`
            : `multiple rows per unit (max ${entry.maxRowsPerUnitYear}) and no year column detected`,
        )
      } else {
        entry.eligible = true
      }
    } catch (err) {
      entry.reasons.push(`stats query failed: ${String(err.message).slice(0, 100)}`)
    }

    done += 1
    if (done % 25 === 0) console.log(`   …${done}/${tableNames.length}`)
    return entry
  })

  // Sibling pairing: same base name at both levels, both eligible.
  const byBase = new Map()
  for (const e of entries) {
    const base = e.table.replace(/_(m|ct)$/, '')
    if (!byBase.has(base)) byBase.set(base, {})
    byBase.get(base)[e.level] = e
  }
  for (const pair of byBase.values()) {
    if (pair.muni?.eligible && pair.ct?.eligible) {
      pair.muni.sibling = pair.ct.table
      pair.ct.sibling = pair.muni.table
    }
  }

  console.log('4/4 Writing outputs…')
  const eligible = entries.filter((e) => e.eligible)
  const muniEligible = eligible.filter((e) => e.level === 'muni')
  const ctEligible = eligible.filter((e) => e.level === 'ct')
  const catalog = {
    generatedAt: new Date().toISOString(),
    source: API,
    phase: 2,
    totals: {
      muni: entries.filter((e) => e.level === 'muni').length,
      ct: entries.filter((e) => e.level === 'ct').length,
      muniEligible: muniEligible.length,
      ctEligible: ctEligible.length,
      withSubregionRows: muniEligible.filter((e) => e.hasSubregionRows).length,
      siblingPairs: eligible.filter((e) => e.sibling).length / 2,
    },
    tables: entries,
  }
  mkdirSync(join(ROOT, 'public/data'), { recursive: true })
  writeFileSync(join(ROOT, 'public/data/catalog.json'), JSON.stringify(catalog, null, 1))

  const byReason = new Map()
  for (const e of entries.filter((x) => !x.eligible)) {
    const key = e.reasons.filter((r) => !r.includes('metadata')).join('; ') || e.reasons.join('; ')
    if (!byReason.has(key)) byReason.set(key, [])
    byReason.get(key).push(e.table)
  }
  const report = [
    '# DataCommon table audit (municipal + census tract)',
    '',
    `Generated: ${catalog.generatedAt}`,
    '',
    `- Municipal (\`_m\`): **${muniEligible.length} of ${catalog.totals.muni}** eligible; ${catalog.totals.withSubregionRows} of those carry pre-computed subregion rows`,
    `- Census tract (\`_ct\`): **${ctEligible.length} of ${catalog.totals.ct}** eligible`,
    `- Sibling pairs (same dataset at both levels): ${catalog.totals.siblingPairs}`,
    '',
    '## Ineligible tables by reason',
    '',
    ...[...byReason.entries()].map(([reason, tables]) =>
      `### ${reason} (${tables.length})\n\n${tables.map((t) => `- \`${t}\``).join('\n')}\n`),
    '## Eligible tables',
    '',
    ...eligible.map((e) =>
      `- \`${e.table}\` — ${e.title} (${e.variables.length} vars${e.level === 'muni' && e.hasSubregionRows ? ', subregion rows' : ''}${e.sibling ? `, sibling: \`${e.sibling}\`` : ''})`),
  ].join('\n')
  writeFileSync(join(ROOT, 'scripts/audit-report.md'), report)

  console.log(`\nDone. Municipal ${muniEligible.length}/${catalog.totals.muni}, tract ${ctEligible.length}/${catalog.totals.ct} eligible.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
