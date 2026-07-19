import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import type { FrameOption } from './components/Sidebar'
import Legend from './components/Legend'
import RankingPanel, { buildRankRows } from './components/RankingPanel'
import { dcQuery, sqlLiteral } from './lib/api'
import { classify } from './lib/classify'
import { downloadCurrentView } from './lib/download'
import { exportMapPng } from './lib/exportPng'
import {
  BIN_LABELS,
  FRAME_LABELS,
  VALID_BINS,
  getVisibleUnits,
  rowJoinId,
  tableSupportsBin,
  tractVintage,
} from './lib/geo'
import { readUrlState, writeUrlState } from './lib/urlState'
import type {
  BinType,
  Catalog,
  CatalogTable,
  DataRow,
  Frame,
  Selection,
  UnitCollection,
} from './types'
import './App.css'

/** Prefer a substantive default variable: skip margin-of-error and flag columns. */
function defaultVariable(t: CatalogTable): string | null {
  const v =
    t.variables.find(
      (x) => x.name !== 'mapc' && !/_me$|_moe$|margin of error/i.test(`${x.name} ${x.alias}`),
    ) ?? t.variables[0]
  return v?.name ?? null
}

function normalizeSelection(sel: Selection, catalog: Catalog, bin: BinType): Selection {
  const entry =
    catalog.tables.find((t) => t.table === sel.table && t.eligible && tableSupportsBin(t, bin)) ??
    null
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
  const initial = useRef(readUrlState()).current
  const embed = initial.embed
  const mapCanvasRef = useRef<(() => HTMLCanvasElement | null) | null>(null)

  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [munis, setMunis] = useState<UnitCollection | null>(null)
  const [subregions, setSubregions] = useState<UnitCollection | null>(null)
  const [tracts2010, setTracts2010] = useState<UnitCollection | null>(null)
  const [tracts2020, setTracts2020] = useState<UnitCollection | null>(null)
  const [frame, setFrame] = useState<Frame>(initial.frame)
  const [bin, setBin] = useState<BinType>(initial.bin)
  const [sel, setSel] = useState<Selection>({
    table: initial.table,
    variable: initial.variable,
    year: initial.year,
  })
  const [rankOpen, setRankOpen] = useState(initial.rankOpen)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [rows, setRows] = useState<DataRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [boundaryLoading, setBoundaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staleUrlNotice, setStaleUrlNotice] = useState(false)

  useEffect(() => {
    fetch('/data/catalog.json')
      .then((r) => r.json())
      .then((c: Catalog) => {
        setCatalog(c)
        setSel((s) => {
          const normalized = normalizeSelection(s, c, initial.bin)
          if (s.table && !normalized.table) setStaleUrlNotice(true)
          return normalized
        })
      })
      .catch(() => setError('Failed to load the dataset catalog.'))
    fetch('/data/mapc_munis.geojson')
      .then((r) => r.json())
      .then(setMunis)
      .catch(() => setError('Failed to load municipal boundaries.'))
    fetch('/data/mapc_subregions.geojson')
      .then((r) => r.json())
      .then(setSubregions)
      .catch(() => setError('Failed to load subregion boundaries.'))
  }, [initial])

  const tableEntry = useMemo(
    () =>
      catalog?.tables.find((t) => t.table === sel.table && t.eligible && tableSupportsBin(t, bin)) ??
      null,
    [catalog, sel.table, bin],
  )

  const vintage = tableEntry?.level === 'ct' ? tractVintage(tableEntry, sel.year) : 2020

  // Tract boundaries load lazily, per vintage.
  useEffect(() => {
    if (bin !== 'ct') return
    const need = vintage === 2020 ? !tracts2020 : !tracts2010
    if (!need) return
    setBoundaryLoading(true)
    fetch(`/data/mapc_tracts_${vintage}.geojson`)
      .then((r) => r.json())
      .then((fc: UnitCollection) => {
        if (vintage === 2020) setTracts2020(fc)
        else setTracts2010(fc)
        setBoundaryLoading(false)
      })
      .catch(() => {
        setBoundaryLoading(false)
        setError('Failed to load tract boundaries.')
      })
  }, [bin, vintage, tracts2010, tracts2020])

  useEffect(() => {
    writeUrlState(frame, bin, sel, rankOpen, embed)
  }, [frame, bin, sel, rankOpen, embed])

  const onHover = useCallback((id: string | null) => setHoveredId(id), [])

  // ---- navigation transitions ----

  const changeBin = useCallback(
    (newBin: BinType, frameArg?: Frame) => {
      const f = frameArg ?? frame
      if (!VALID_BINS[f.type].includes(newBin) || !catalog) return
      let nextTable: CatalogTable | null = tableEntry
      if (nextTable && !tableSupportsBin(nextTable, newBin)) {
        const sib = nextTable.sibling
          ? (catalog.tables.find((t) => t.table === nextTable!.sibling && t.eligible) ?? null)
          : null
        nextTable = sib && tableSupportsBin(sib, newBin) ? sib : null
      }
      setBin(newBin)
      setSel((s) =>
        normalizeSelection(
          { table: nextTable?.table ?? null, variable: s.variable, year: s.year },
          catalog,
          newBin,
        ),
      )
    },
    [catalog, frame, tableEntry],
  )

  const changeFrame = useCallback(
    (newFrame: Frame) => {
      setFrame(newFrame)
      if (!VALID_BINS[newFrame.type].includes(bin)) {
        changeBin(VALID_BINS[newFrame.type][0], newFrame)
      }
    },
    [bin, changeBin],
  )

  // ---- data ----

  const tables = useMemo(
    () =>
      (catalog?.tables ?? [])
        .filter((t) => t.eligible && tableSupportsBin(t, bin))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [catalog, bin],
  )

  const binAvailability = useMemo(() => {
    const all = catalog?.tables.filter((t) => t.eligible) ?? []
    return {
      muni: all.some((t) => tableSupportsBin(t, 'muni')),
      subreg: all.some((t) => tableSupportsBin(t, 'subreg')),
      ct: all.some((t) => tableSupportsBin(t, 'ct')),
    }
  }, [catalog])

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

  const visibleUnits = useMemo(
    () => getVisibleUnits(bin, frame, vintage, { munis, subregions, tracts2010, tracts2020 }),
    [bin, frame, vintage, munis, subregions, tracts2010, tracts2020],
  )

  const rowsById = useMemo(() => {
    const m = new Map<string, DataRow>()
    if (rows && tableEntry) {
      for (const r of rows) {
        const id = rowJoinId(r, tableEntry, bin, vintage)
        if (id !== null) m.set(id, r)
      }
    }
    return m
  }, [rows, tableEntry, bin, vintage])

  const values = useMemo(() => {
    if (!rows || !sel.variable || !visibleUnits) return null
    const m = new Map<string, number | null>()
    for (const u of visibleUnits) {
      const raw = rowsById.get(u.id)?.[sel.variable]
      const num = raw == null || raw === '' ? NaN : Number(raw)
      m.set(u.id, Number.isFinite(num) ? num : null)
    }
    return m
  }, [rows, rowsById, sel.variable, visibleUnits])

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

  const displayData = useMemo<FeatureCollection | null>(() => {
    if (!visibleUnits) return null
    return {
      type: 'FeatureCollection',
      features: visibleUnits.map((u) => {
        const raw = values?.get(u.id)
        const hasData = raw != null && Number.isFinite(raw)
        return {
          type: 'Feature',
          properties: {
            __id: u.id,
            __name: u.name,
            __sub: u.sublabel,
            __value: hasData ? raw : 0,
            __hasData: values ? (hasData ? 1 : 0) : -1,
          },
          geometry: u.feature.geometry,
        }
      }),
    }
  }, [visibleUnits, values])

  // Municipal boundary lines stay visible above tract choropleths for orientation.
  const overlayData = useMemo<FeatureCollection | null>(() => {
    if (bin !== 'ct' || !munis) return null
    const features = munis.features.filter((f) => {
      if (frame.type === 'muni') return Number(f.properties.muni_id) === frame.id
      if (frame.type === 'subreg') return Number(f.properties.subreg_id) === frame.id
      return true
    })
    return { type: 'FeatureCollection', features } as FeatureCollection
  }, [bin, frame, munis])

  const subregionOptions = useMemo<FrameOption[]>(
    () =>
      (subregions?.features ?? [])
        .map((f) => ({
          id: Number(f.properties.subreg_id),
          name: `${f.properties.subrg_abbr} — ${f.properties.name}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subregions],
  )

  const muniOptions = useMemo<FrameOption[]>(
    () =>
      (munis?.features ?? [])
        .map((f) => ({ id: Number(f.properties.muni_id), name: String(f.properties.municipal) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [munis],
  )

  const frameLabel = useMemo(() => {
    if (frame.type === 'subreg') {
      return subregionOptions.find((o) => o.id === frame.id)?.name ?? FRAME_LABELS.subreg
    }
    if (frame.type === 'muni') {
      return muniOptions.find((o) => o.id === frame.id)?.name ?? FRAME_LABELS.muni
    }
    return FRAME_LABELS.mapc
  }, [frame, subregionOptions, muniOptions])

  const yearLabel = tableEntry?.yearCol ? sel.year : null
  const fitKey = `${frame.type}:${frame.id ?? ''}:${bin}:${bin === 'ct' ? vintage : ''}`

  const rankRows = useMemo(() => {
    if (!values || !classification || !visibleUnits) return null
    return buildRankRows(visibleUnits, values, classification)
  }, [values, classification, visibleUnits])

  const showRankPanel = rankOpen && !!(rankRows && classification && variableEntry)

  const handleExportPng = () => {
    const mapCanvas = mapCanvasRef.current?.()
    if (!mapCanvas || !classification || !variableEntry || !tableEntry) return
    exportMapPng({
      mapCanvas,
      title: variableEntry.alias,
      subtitle: `${tableEntry.title} · ${frameLabel} · ${BIN_LABELS[bin]}${yearLabel ? ` · ${yearLabel}` : ''}`,
      classification,
      filename: `${tableEntry.table}${sel.year ? `_${sel.year}` : ''}_map.png`,
    })
  }

  const fullViewUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('embed')
    return url.toString()
  }

  return (
    <div className={`app${embed ? ' app-embed' : ''}`}>
      {!embed && (
        <header className="header">
          <div className="header-brand">
            <img src="/favicon.svg" alt="" className="header-mark" />
            <div>
              <h1>MAPC DataCommon Web Maps</h1>
              <p>An interactive choropleth for every DataCommon dataset · Prototype</p>
            </div>
          </div>
          <a className="header-link" href="https://datacommon.mapc.org/" target="_blank" rel="noreferrer">
            DataCommon ↗
          </a>
        </header>
      )}
      <div className="main">
        {!embed && (
        <Sidebar
          frame={frame}
          bin={bin}
          subregionOptions={subregionOptions}
          muniOptions={muniOptions}
          tables={tables}
          selected={tableEntry}
          variable={sel.variable}
          year={sel.year}
          loading={loading}
          canDownload={!!(rows && visibleUnits && tableEntry)}
          binAvailability={binAvailability}
          onFrameChange={changeFrame}
          onBinChange={changeBin}
          onSelectTable={(table) =>
            catalog &&
            setSel(normalizeSelection({ table, variable: null, year: null }, catalog, bin))
          }
          onSelectVariable={(variable) => setSel((s) => ({ ...s, variable }))}
          onSelectYear={(year) => setSel((s) => ({ ...s, year }))}
          onDownload={() => {
            if (visibleUnits && tableEntry) {
              downloadCurrentView(visibleUnits, rowsById, tableEntry, sel.year, bin, frameLabel)
            }
          }}
          onExportPng={handleExportPng}
          canExportPng={!!classification}
        />
        )}
        <main className={`map-area${showRankPanel ? ' rank-open' : ''}`}>
          <MapView
            data={displayData}
            overlay={overlayData}
            classification={classification}
            variableLabel={variableEntry?.alias ?? null}
            yearLabel={yearLabel}
            fitKey={fitKey}
            hoveredId={hoveredId}
            onHover={onHover}
            canvasRef={mapCanvasRef}
          />
          <Legend
            classification={classification}
            title={variableEntry?.alias ?? null}
            yearLabel={yearLabel}
          />
          {classification && variableEntry && !showRankPanel && !embed && (
            <button type="button" className="rank-toggle" onClick={() => setRankOpen(true)}>
              ☰ Rankings
            </button>
          )}
          {embed && (
            <a className="embed-credit" href={fullViewUrl()} target="_blank" rel="noreferrer">
              MAPC DataCommon Web Maps ↗
            </a>
          )}
          {showRankPanel && rankRows && classification && variableEntry && (
            <RankingPanel
              rows={rankRows}
              classification={classification}
              variableLabel={variableEntry.alias}
              yearLabel={yearLabel}
              isAcs={!!tableEntry && tableEntry.table.includes('_acs_')}
              hoveredId={hoveredId}
              onHover={onHover}
              onClose={() => setRankOpen(false)}
            />
          )}
          {(loading || boundaryLoading) && (
            <div className="map-banner">{boundaryLoading ? 'Loading boundaries…' : 'Loading data…'}</div>
          )}
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
