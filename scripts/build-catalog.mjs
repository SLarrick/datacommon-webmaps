/**
 * build-catalog.mjs
 *
 * Introspects the MAPC DataCommon API and generates:
 *   - public/data/catalog.json  (the app's table catalog)
 *   - scripts/audit-report.md   (human-readable eligibility audit)
 *
 * Phase 1 scope: municipal tables only (tabular.*_m).
 *
 * Eligibility rules (Phase 1):
 *   - table has a muni_id column
 *   - table has >= 1 numeric variable column (excluding IDs and the year column)
 *   - exactly one row per municipality per year (no subgroup breakdowns)
 *
 * Usage: node scripts/build-catalog.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://datacommon.mapc.org/api/'
const TOKEN = 'datacommon'
const CONCURRENCY = 5

// Metadata rows with these names are table-level header fields; everything
// else in a metadata table is assumed to describe a column.
const HEADER_KEYS = new Set([
  'join_key', 'title', 'alt_title', 'tbl_table', 'tbl_num', 'geography',
  'descriptn', 'description', 'datesavail', 'coverage', 'universe', 'creator',
  'publisher', 'contributor', 'source', 'date_created', 'date_modified',
  'language', 'relation', 'rights', 'subject', 'format', 'identifier', 'type',
])

const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'money',
])

// Columns that are identifiers/bookkeeping, never variables.
const ID_COLUMNS = new Set(['seq_id', 'muni_id', 'objectid', 'gid', 'id', 'logrecno'])

// Year-column candidates, highest priority first.
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
  console.log('1/4 Listing municipal tables…')
  const tablesRes = await query('ds', `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'tabular' AND right(table_name, 2) = '_m'
    ORDER BY table_name`)
  const tableNames = tablesRes.rows.map((r) => r.table_name)
  console.log(`   ${tableNames.length} tables`)

  console.log('2/4 Fetching all column definitions…')
  const colsRes = await query('ds', `
    SELECT table_name, column_name, udt_name, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'tabular' AND right(table_name, 2) = '_m'
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

  console.log('3/4 Auditing each table (metadata + cardinality)…')
  let done = 0
  const entries = await mapConcurrent(tableNames, async (table) => {
    const columns = columnsByTable.get(table) ?? []
    const colNames = new Set(columns.map((c) => c.name))
    const reasons = []

    // --- metadata ---
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

    const entry = {
      table,
      title: header.title || header.alt_title || table,
      altTitle: header.alt_title || null,
      description: header.descriptn || header.description || null,
      geography: header.geography || null,
      datesAvail: header.datesavail || null,
      universe: header.universe || null,
      joinKey: header.join_key || (colNames.has('muni_id') ? 'muni_id' : null),
      yearCol,
      years: [],
      nRows: null,
      nMunis: null,
      maxRowsPerMuniYear: null,
      variables,
      eligible: false,
      reasons,
    }

    // --- hard requirements before touching data ---
    if (!colNames.has('muni_id')) {
      entry.reasons.push('no muni_id column')
      return entry
    }
    if (variables.length === 0) {
      entry.reasons.push('no numeric variable columns')
      return entry
    }

    // --- cardinality + years, one stats query per table ---
    try {
      const groupCols = yearCol ? `muni_id, ${yearCol}` : 'muni_id'
      const yearsSel = yearCol
        ? `(SELECT string_agg(DISTINCT ${yearCol}::text, '|') FROM tabular.${table})`
        : `NULL`
      const stats = await query('ds', `
        SELECT
          (SELECT count(*) FROM tabular.${table}) AS n_rows,
          (SELECT count(DISTINCT muni_id) FROM tabular.${table}) AS n_munis,
          (SELECT max(c) FROM (SELECT count(*) AS c FROM tabular.${table} GROUP BY ${groupCols}) g) AS max_per,
          ${yearsSel} AS years`)
      const s = stats.rows[0]
      entry.nRows = Number(s.n_rows)
      entry.nMunis = Number(s.n_munis)
      entry.maxRowsPerMuniYear = Number(s.max_per)
      entry.years = s.years
        ? [...new Set(String(s.years).split('|'))].sort((a, b) => String(a).localeCompare(String(b)))
        : []

      if (entry.maxRowsPerMuniYear > 1) {
        entry.reasons.push(
          yearCol
            ? `multiple rows per municipality-year (max ${entry.maxRowsPerMuniYear}) — subgroup breakdowns not supported in Phase 1`
            : `multiple rows per municipality (max ${entry.maxRowsPerMuniYear}) and no year column detected`,
        )
      } else {
        entry.eligible = true
      }
    } catch (err) {
      entry.reasons.push(`stats query failed: ${String(err.message).slice(0, 100)}`)
    }

    done += 1
    if (done % 20 === 0) console.log(`   …${done}/${tableNames.length}`)
    return entry
  })

  console.log('4/4 Writing outputs…')
  const eligible = entries.filter((e) => e.eligible)
  const catalog = {
    generatedAt: new Date().toISOString(),
    source: API,
    phase: 1,
    totalMunicipalTables: entries.length,
    eligibleCount: eligible.length,
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
    '# DataCommon municipal table audit',
    '',
    `Generated: ${catalog.generatedAt}`,
    '',
    `**${eligible.length} of ${entries.length}** municipal (\`_m\`) tables are eligible for Phase 1 choropleths.`,
    '',
    '## Ineligible tables by reason',
    '',
    ...[...byReason.entries()].map(([reason, tables]) =>
      `### ${reason} (${tables.length})\n\n${tables.map((t) => `- \`${t}\``).join('\n')}\n`),
    '## Eligible tables',
    '',
    ...eligible.map((e) => `- \`${e.table}\` — ${e.title} (${e.variables.length} vars, years: ${e.years.length ? `${e.years[0]}…${e.years[e.years.length - 1]}` : 'single'})`),
  ].join('\n')
  writeFileSync(join(ROOT, 'scripts/audit-report.md'), report)

  console.log(`\nDone. ${eligible.length}/${entries.length} tables eligible.`)
  console.log('  public/data/catalog.json')
  console.log('  scripts/audit-report.md')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
