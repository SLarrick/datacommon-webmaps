import { useMemo, useRef, useState } from 'react'
import type { CatalogTable } from '../types'

interface Props {
  tables: CatalogTable[]
  selected: CatalogTable | null
  variable: string | null
  year: string | null
  loading: boolean
  canDownload: boolean
  onSelectTable: (table: string | null) => void
  onSelectVariable: (variable: string) => void
  onSelectYear: (year: string) => void
  onDownload: () => void
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

  const matches = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return tables
    return tables.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.table.toLowerCase().includes(q) ||
        (t.altTitle ?? '').toLowerCase().includes(q),
    )
  }, [tables, filter])

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
        placeholder={selected ? selected.title : 'Search datasets…'}
        className={selected && !open ? 'has-selection' : ''}
        value={open ? filter : selected ? selected.title : ''}
        onFocus={() => {
          setOpen(true)
          setFilter('')
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length > 0) choose(matches[0].table)
          if (e.key === 'Escape') inputRef.current?.blur()
        }}
      />
      {open && (
        <div className="table-picker-list">
          {matches.length === 0 && <div className="table-picker-empty">No matching datasets</div>}
          {matches.map((t) => (
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
              <span className="item-table">{t.table}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  tables,
  selected,
  variable,
  year,
  loading,
  canDownload,
  onSelectTable,
  onSelectVariable,
  onSelectYear,
  onDownload,
}: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — URL bar still works */
    }
  }

  return (
    <aside className="sidebar">
      <div className="control-group">
        <label>Geographic frame</label>
        <select disabled value="mapc" title="More frames coming in Phase 2">
          <option value="mapc">MAPC Region</option>
        </select>
        <label>Binning unit</label>
        <select disabled value="muni" title="More bin units coming in Phase 2">
          <option value="muni">Municipality</option>
        </select>
        <div className="phase-note">Frame &amp; bin are fixed in this prototype phase.</div>
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
            <label>Variable</label>
            <select value={variable ?? ''} onChange={(e) => onSelectVariable(e.target.value)}>
              {selected.variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.alias}
                </option>
              ))}
            </select>
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

          <div className="dataset-info">
            <div className="dataset-info-title">{selected.title}</div>
            {selected.description && <p>{selected.description}</p>}
            <dl>
              {selected.universe && (
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
          </div>

          <div className="control-group actions">
            <button type="button" className="btn btn-primary" onClick={onDownload} disabled={!canDownload || loading}>
              {loading ? 'Loading data…' : 'Download GeoJSON (current view)'}
            </button>
            <button type="button" className="btn" onClick={copyLink}>
              {copied ? 'Link copied ✓' : 'Copy link to this map'}
            </button>
          </div>
        </>
      )}

      {!selected && (
        <div className="empty-hint">
          Select a dataset above to map it across the 101 municipalities of the MAPC region.
        </div>
      )}

      <div className="sidebar-footer">
        Data:{' '}
        <a href="https://datacommon.mapc.org/" target="_blank" rel="noreferrer">
          MAPC DataCommon
        </a>{' '}
        · Prototype
      </div>
    </aside>
  )
}
