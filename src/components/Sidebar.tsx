import { useMemo, useRef, useState } from 'react'
import type { BinType, CatalogTable, CatalogVariable, Frame, FrameType } from '../types'
import { BIN_LABELS, FRAME_LABELS, VALID_BINS } from '../lib/geo'
import mapcLogo from '../assets/mapc-logo.svg'

export interface FrameOption {
  id: number
  name: string
}

interface Props {
  frame: Frame
  bin: BinType
  subregionOptions: FrameOption[]
  muniOptions: FrameOption[]
  tables: CatalogTable[]
  selected: CatalogTable | null
  variable: string | null
  year: string | null
  loading: boolean
  canDownload: boolean
  /** bins that no eligible table can serve under the current frame */
  binAvailability: Record<BinType, boolean>
  onFrameChange: (frame: Frame) => void
  onBinChange: (bin: BinType) => void
  onSelectTable: (table: string | null) => void
  onSelectVariable: (variable: string) => void
  onSelectYear: (year: string) => void
  onDownload: () => void
  onExportPng: () => void
  canExportPng: boolean
}

function TablePicker({
  tables,
  selected,
  onSelect,
}: {
  tables: CatalogTable[]
  selected: CatalogTable | null
  onSelect: (table: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const matches = !q
      ? tables
      : tables.filter((t) =>
          [t.title, t.table, t.altTitle, t.topic, t.subtopic, t.source]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q)),
        )
    const byTopic = new Map<string, CatalogTable[]>()
    for (const t of matches) {
      const topic = t.topic ?? 'Other'
      if (!byTopic.has(topic)) byTopic.set(topic, [])
      byTopic.get(topic)!.push(t)
    }
    return [...byTopic.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [tables, filter])

  const flatMatches = useMemo(() => grouped.flatMap(([, ts]) => ts), [grouped])

  const choose = (table: string) => {
    onSelect(table)
    setOpen(false)
    setFilter('')
    inputRef.current?.blur()
  }

  return (
    <div className="table-picker">
      <input
        ref={inputRef}
        type="text"
        placeholder={selected ? selected.title : 'Search datasets, topics, sources…'}
        className={selected && !open ? 'has-selection' : ''}
        value={open ? filter : selected ? selected.title : ''}
        onFocus={() => {
          setOpen(true)
          setFilter('')
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && flatMatches.length > 0) choose(flatMatches[0].table)
          if (e.key === 'Escape') inputRef.current?.blur()
        }}
      />
      {open && (
        <div className="table-picker-list">
          {flatMatches.length === 0 && <div className="table-picker-empty">No matching datasets</div>}
          {grouped.map(([topic, ts]) => (
            <div key={topic}>
              <div className="picker-group-header">{topic}</div>
              {ts.map((t) => (
                <button
                  key={t.table}
                  type="button"
                  className={`table-picker-item${selected?.table === t.table ? ' is-selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(t.table)
                  }}
                >
                  <span className="item-title">{t.title}</span>
                  <span className="item-table">
                    {t.subtopic ? `${t.subtopic} · ` : ''}
                    {t.table}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VariablePicker({
  variables,
  selected,
  onSelect,
}: {
  variables: CatalogVariable[]
  selected: string | null
  onSelect: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedVar = variables.find((v) => v.name === selected) ?? null
  const matches = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return variables
    return variables.filter(
      (v) => v.alias.toLowerCase().includes(q) || v.name.toLowerCase().includes(q),
    )
  }, [variables, filter])

  const choose = (name: string) => {
    onSelect(name)
    setOpen(false)
    setFilter('')
    inputRef.current?.blur()
  }

  return (
    <div className="table-picker">
      <input
        ref={inputRef}
        type="text"
        placeholder={selectedVar ? selectedVar.alias : 'Search variables…'}
        className={selectedVar && !open ? 'has-selection' : ''}
        value={open ? filter : (selectedVar?.alias ?? '')}
        onFocus={() => {
          setOpen(true)
          setFilter('')
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length > 0) choose(matches[0].name)
          if (e.key === 'Escape') inputRef.current?.blur()
        }}
      />
      {open && (
        <div className="table-picker-list">
          {matches.length === 0 && <div className="table-picker-empty">No matching variables</div>}
          {matches.map((v) => (
            <button
              key={v.name}
              type="button"
              className={`table-picker-item${selected === v.name ? ' is-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(v.name)
              }}
            >
              <span className="item-title">{v.alias}</span>
              <span className="item-table">{v.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  frame,
  bin,
  subregionOptions,
  muniOptions,
  tables,
  selected,
  variable,
  year,
  loading,
  canDownload,
  binAvailability,
  onFrameChange,
  onBinChange,
  onSelectTable,
  onSelectVariable,
  onSelectYear,
  onDownload,
  onExportPng,
  canExportPng,
}: Props) {
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null)

  const copyText = async (kind: 'link' | 'embed', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      /* clipboard unavailable — URL bar still works */
    }
  }

  const embedSnippet = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('embed', '1')
    return `<iframe src="${url.toString()}" width="100%" height="520" style="border:1px solid #dde4e6;border-radius:8px" loading="lazy" title="MAPC DataCommon Web Map"></iframe>`
  }

  const validBins = VALID_BINS[frame.type]

  return (
    <aside className="sidebar">
      <div className="control-group">
        <label>Geographic frame</label>
        <select
          value={frame.type}
          onChange={(e) => {
            const type = e.target.value as FrameType
            if (type === 'mapc') onFrameChange({ type, id: null })
            else if (type === 'subreg') onFrameChange({ type, id: subregionOptions[0]?.id ?? null })
            else onFrameChange({ type, id: muniOptions[0]?.id ?? null })
          }}
        >
          {(['mapc', 'subreg', 'muni'] as FrameType[]).map((t) => (
            <option key={t} value={t}>
              {FRAME_LABELS[t]}
            </option>
          ))}
        </select>
        {frame.type === 'subreg' && (
          <select
            value={frame.id ?? ''}
            onChange={(e) => onFrameChange({ type: 'subreg', id: Number(e.target.value) })}
          >
            {subregionOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        {frame.type === 'muni' && (
          <select
            value={frame.id ?? ''}
            onChange={(e) => onFrameChange({ type: 'muni', id: Number(e.target.value) })}
          >
            {muniOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}

        <label>Binning unit</label>
        <select value={bin} onChange={(e) => onBinChange(e.target.value as BinType)}>
          {(['subreg', 'muni', 'ct'] as BinType[]).map((b) => {
            const nests = validBins.includes(b)
            const hasTables = binAvailability[b]
            return (
              <option
                key={b}
                value={b}
                disabled={!nests || !hasTables}
                title={
                  !nests
                    ? 'This unit does not nest below the selected frame'
                    : !hasTables
                      ? 'No datasets available at this level'
                      : undefined
                }
              >
                {BIN_LABELS[b]}
                {!nests ? ' (not below frame)' : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className="control-group">
        <label>
          Dataset <span className="count-badge">{tables.length} available</span>
        </label>
        <TablePicker tables={tables} selected={selected} onSelect={onSelectTable} />
      </div>

      {selected && (
        <>
          <div className="control-group">
            <label>
              Variable <span className="count-badge">{selected.variables.length}</span>
            </label>
            <VariablePicker
              variables={selected.variables}
              selected={variable}
              onSelect={onSelectVariable}
            />
            {selected.yearCol && selected.years.length > 0 && (
              <>
                <label>Year</label>
                <select value={year ?? ''} onChange={(e) => onSelectYear(e.target.value)}>
                  {[...selected.years].reverse().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {bin === 'subreg' && (
            <div className="phase-note">
              Subregion values are MAPC's pre-computed aggregates from this dataset.
            </div>
          )}

          <div className="dataset-info">
            <div className="dataset-info-title">{selected.title}</div>
            {selected.description && <p>{selected.description}</p>}
            <dl>
              {selected.topic && (
                <>
                  <dt>Topic</dt>
                  <dd>
                    {selected.topic}
                    {selected.subtopic ? ` › ${selected.subtopic}` : ''}
                  </dd>
                </>
              )}
              {selected.source && (
                <>
                  <dt>Source</dt>
                  <dd>{selected.source}</dd>
                </>
              )}
              {selected.universe && selected.universe !== 'n/a' && (
                <>
                  <dt>Universe</dt>
                  <dd>{selected.universe}</dd>
                </>
              )}
              {selected.datesAvail && (
                <>
                  <dt>Dates</dt>
                  <dd>{selected.datesAvail}</dd>
                </>
              )}
              <dt>Source table</dt>
              <dd>
                <code>{selected.table}</code>
              </dd>
            </dl>
            {selected.datasetId && (
              <a
                className="datacommon-link"
                href={`https://datacommon.mapc.org/browser/datasets/${selected.datasetId}`}
                target="_blank"
                rel="noreferrer"
              >
                View on DataCommon ↗
              </a>
            )}
          </div>

          <div className="control-group actions">
            <button type="button" className="btn btn-primary" onClick={onDownload} disabled={!canDownload || loading}>
              {loading ? 'Loading data…' : 'Download GeoJSON (current view)'}
            </button>
            <button type="button" className="btn" onClick={onExportPng} disabled={!canExportPng || loading}>
              Download map image (PNG)
            </button>
            <a
              className="btn btn-anchor"
              href={`https://datacommon.mapc.org/api/export?token=datacommon&database=ds&schema=tabular&table=${selected.table}&format=csv`}
            >
              Download full table (CSV)
            </a>
            <button type="button" className="btn" onClick={() => copyText('link', window.location.href)}>
              {copied === 'link' ? 'Link copied ✓' : 'Copy link to this map'}
            </button>
            <button type="button" className="btn" onClick={() => copyText('embed', embedSnippet())}>
              {copied === 'embed' ? 'Embed code copied ✓' : 'Copy embed code'}
            </button>
          </div>
        </>
      )}

      {!selected && (
        <div className="empty-hint">
          Select a dataset above to map it across the current frame and bin unit.
        </div>
      )}

      <div className="sidebar-footer">
        <div className="footer-logos">
          <a
            className="mapc-chip"
            href="https://www.mapc.org/"
            target="_blank"
            rel="noreferrer"
            title="Metropolitan Area Planning Council"
          >
            <img src={mapcLogo} alt="MAPC" />
          </a>
          <a
            className="dc-wordmark"
            href="https://datacommon.mapc.org/"
            target="_blank"
            rel="noreferrer"
            title="MAPC DataCommon"
          >
            DataCommon
          </a>
        </div>
        <div>
          <a
            href="https://github.com/SLarrick/datacommon-webmaps"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>{' '}
          · Prototype
        </div>
      </div>
    </aside>
  )
}
