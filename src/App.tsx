import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import Legend from './components/Legend'
import RankingPanel, { buildRankRows } from './components/RankingPanel'
import { dcQuery, sqlLiteral } from './lib/api'
import { classify } from './lib/classify'
import { downloadCurrentView } from './lib/download'
import { readUrlState, writeUrlState } from './lib/urlState'
import type { Catalog, CatalogTable, DataRow, MuniCollection, Selection } from './types'
import './App.css'

/** Prefer a substantive default variable: skip margin-of-error and flag columns. */
function defaultVariable(t: CatalogTable): string | null {
  const v =
    t.variables.find(
      (x) => x.name !== 'mapc' && !/_me$|_moe$|margin of error/i.test(`${x.name} ${x.alias}`),
    ) ?? t.variables[0]
  return v?.name ?? null
}

function normalizeSelection(sel: Selection, catalog: Catalog): Selection {
  const entry = catalog.tables.find((t) => t.table === sel.table && t.eligible) ?? null
  if (!entry) return { table: null, variable: null, year: null }
  const variable = entry.variables.some((v) => v.name === sel.variable)
    ? sel.variable
    : defaultVariable(entry)
  const year = entry.yearCol
    ? entry.years.includes(sel.year ?? '')
      ? sel.year
      : (entry.years[entry.years.length - 1] ?? null)
    : null
  return { table: entry.table, variable, year }
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [boundaries, setBoundaries] = useState<MuniCollection | null>(null)
  const [sel, setSel] = useState<Selection>(() => {
    const { table, variable, year } = readUrlState()
    return { table, variable, year }
  })
  const [rankOpen, setRankOpen] = useState<boolean>(() => readUrlState().rankOpen)
  const [hoveredMuniId, setHoveredMuniId] = useState<number | null>(null)
  const [rows, setRows] = useState<DataRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staleUrlNotice, setStaleUrlNotice] = useState(false)

  useEffect(() => {
    fetch('/data/catalog.json')
      .then((r) => r.json())
      .then((c: Catalog) => {
        setCatalog(c)
        setSel((s) => {
          const normalized = normalizeSelection(s, c)
          if (s.table && !normalized.table) setStaleUrlNotice(true)
          return normalized
        })
      })
      .catch(() => setError('Failed to load the dataset catalog.'))
    fetch('/data/mapc_munis.geojson')
      .then((r) => r.json())
      .then(setBoundaries)
      .catch(() => setError('Failed to load municipal boundaries.'))
  }, [])

  const tables = useMemo(
    () =>
      (catalog?.tables ?? [])
        .filter((t) => t.eligible)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [catalog],
  )

  const tableEntry = useMemo(
    () => tables.find((t) => t.table === sel.table) ?? null,
    [tables, sel.table],
  )

  useEffect(() => {
    writeUrlState(sel, rankOpen)
  }, [sel, rankOpen])

  const onHoverMuni = useCallback((id: number | null) => setHoveredMuniId(id), [])

  // Fetch table rows whenever table or year changes (variable switches are free).
  useEffect(() => {
    if (!tableEntry) {
      setRows(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const where =
      tableEntry.yearCol && sel.year ? ` WHERE ${tableEntry.yearCol} = ${sqlLiteral(sel.year)}` : ''
    dcQuery('ds', `SELECT * FROM tabular.${tableEntry.table}${where}`)
      .then((res) => {
        if (cancelled) return
        setRows(res.rows)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setRows(null)
        setLoading(false)
        setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [tableEntry, sel.year])

  const rowsByMuni = useMemo(() => {
    const m = new Map<number, DataRow>()
    if (rows) for (const r of rows) m.set(Number(r.muni_id), r)
    return m
  }, [rows])

  // muni_id → numeric value for the selected variable, for MAPC munis only.
  const values = useMemo(() => {
    if (!rows || !sel.variable || !boundaries) return null
    const m = new Map<number, number | null>()
    for (const f of boundaries.features) {
      const row = rowsByMuni.get(Number(f.properties.muni_id))
      const raw = row?.[sel.variable]
      const num = raw == null || raw === '' ? NaN : Number(raw)
      m.set(Number(f.properties.muni_id), Number.isFinite(num) ? num : null)
    }
    return m
  }, [rows, rowsByMuni, sel.variable, boundaries])

  const variableEntry = useMemo(
    () => tableEntry?.variables.find((v) => v.name === sel.variable) ?? null,
    [tableEntry, sel.variable],
  )

  const classification = useMemo(() => {
    if (!values || !variableEntry) return null
    const nums = [...values.values()].filter((v): v is number => v !== null)
    const noData = values.size - nums.length
    return classify(nums, variableEntry, noData)
  }, [values, variableEntry])

  const yearLabel = tableEntry?.yearCol ? sel.year : null

  const rankRows = useMemo(() => {
    if (!values || !classification || !boundaries) return null
    const features = boundaries.features.map((f) => ({
      muniId: Number(f.properties.muni_id),
      name: f.properties.municipal,
    }))
    return buildRankRows(features, values, classification)
  }, [values, classification, boundaries])

  const showRankPanel = rankOpen && !!(rankRows && classification && variableEntry)

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>MAPC DataCommon Web Maps</h1>
          <p>An interactive choropleth for every DataCommon dataset · Phase 1 prototype</p>
        </div>
        <a className="header-link" href="https://datacommon.mapc.org/" target="_blank" rel="noreferrer">
          DataCommon ↗
        </a>
      </header>
      <div className="main">
        <Sidebar
          tables={tables}
          selected={tableEntry}
          variable={sel.variable}
          year={sel.year}
          loading={loading}
          canDownload={!!(rows && boundaries && tableEntry)}
          onSelectTable={(table) =>
            setSel(catalog ? normalizeSelection({ table, variable: null, year: null }, catalog) : sel)
          }
          onSelectVariable={(variable) => setSel((s) => ({ ...s, variable }))}
          onSelectYear={(year) => setSel((s) => ({ ...s, year }))}
          onDownload={() => {
            if (boundaries && tableEntry) downloadCurrentView(boundaries, rowsByMuni, tableEntry, sel.year)
          }}
        />
        <main className={`map-area${showRankPanel ? ' rank-open' : ''}`}>
          <MapView
            boundaries={boundaries}
            values={values}
            classification={classification}
            variableLabel={variableEntry?.alias ?? null}
            yearLabel={yearLabel}
            hoveredMuniId={hoveredMuniId}
            onHoverMuni={onHoverMuni}
          />
          <Legend
            classification={classification}
            title={variableEntry?.alias ?? null}
            yearLabel={yearLabel}
          />
          {classification && variableEntry && !showRankPanel && (
            <button type="button" className="rank-toggle" onClick={() => setRankOpen(true)}>
              ☰ Rankings
            </button>
          )}
          {showRankPanel && rankRows && classification && variableEntry && (
            <RankingPanel
              rows={rankRows}
              classification={classification}
              variableLabel={variableEntry.alias}
              yearLabel={yearLabel}
              isAcs={!!tableEntry && tableEntry.table.includes('_acs_')}
              hoveredMuniId={hoveredMuniId}
              onHoverMuni={onHoverMuni}
              onClose={() => setRankOpen(false)}
            />
          )}
          {loading && <div className="map-banner">Loading data…</div>}
          {error && <div className="map-banner map-banner-error">{error}</div>}
          {staleUrlNotice && (
            <div className="map-banner map-banner-warn" onClick={() => setStaleUrlNotice(false)}>
              The linked dataset is unavailable — reset to defaults. (dismiss)
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
