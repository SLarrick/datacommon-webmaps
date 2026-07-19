import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { Polygon } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Classification } from '../lib/classify'
import { NO_DATA_COLOR, formatValue } from '../lib/classify'
import type { MuniCollection } from '../types'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const NEUTRAL_FILL = '#c9d6d3'

interface HoverInfo {
  x: number
  y: number
  name: string
  subregion: string | null
  value: number | null
  hasData: boolean
}

interface Props {
  boundaries: MuniCollection | null
  /** muni_id → value (null = table selected but no data for this muni) */
  values: Map<number, number | null> | null
  classification: Classification | null
  variableLabel: string | null
  yearLabel: string | null
  /** Shared hover state — may be driven by the map or the rankings panel. */
  hoveredMuniId: number | null
  onHoverMuni: (id: number | null) => void
}

function fillColorExpression(classification: Classification | null): unknown {
  if (!classification) return NEUTRAL_FILL
  // A 'step' expression needs at least one stop; a single class is a flat color.
  let ramp: unknown = classification.colors[0]
  if (classification.breaks.length > 0) {
    const step: unknown[] = ['step', ['get', '__value'], classification.colors[0]]
    classification.breaks.forEach((b, i) => {
      step.push(b, classification.colors[i + 1])
    })
    ramp = step
  }
  return ['case', ['==', ['get', '__hasData'], 1], ramp, NO_DATA_COLOR]
}

export default function MapView({
  boundaries,
  values,
  classification,
  variableLabel,
  yearLabel,
  hoveredMuniId,
  onHoverMuni,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const prevHoverRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [-71.06, 42.35],
      zoom: 8.3,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('munis', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'muni_id',
      })
      map.addLayer({
        id: 'munis-fill',
        type: 'fill',
        source: 'munis',
        paint: { 'fill-color': NEUTRAL_FILL, 'fill-opacity': 0.82 },
      })
      map.addLayer({
        id: 'munis-line',
        type: 'line',
        source: 'munis',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#1f3a4d',
            '#7d8f99',
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0.7],
        },
      })
      setMapReady(true)
    })
    mapRef.current = map
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__map = map
    // The flex layout can settle after map construction — keep canvas in sync.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Push data (boundaries + joined values) into the source.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !boundaries) return
    const features = boundaries.features.map((f) => {
      const raw = values?.get(Number(f.properties.muni_id))
      const hasData = raw != null && Number.isFinite(raw)
      return {
        ...f,
        properties: {
          ...f.properties,
          __value: hasData ? raw : 0,
          __hasData: values ? (hasData ? 1 : 0) : -1, // -1 = no table selected
        },
      }
    })
    const source = map.getSource('munis') as maplibregl.GeoJSONSource
    source.setData({ type: 'FeatureCollection', features })
  }, [boundaries, values, mapReady])

  // Fit to MAPC region once boundaries arrive.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !boundaries || boundaries.features.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    for (const f of boundaries.features) {
      const walk = (coords: unknown): void => {
        if (typeof (coords as number[])[0] === 'number') {
          bounds.extend(coords as [number, number])
        } else {
          for (const c of coords as unknown[]) walk(c)
        }
      }
      walk((f.geometry as Polygon).coordinates)
    }
    map.fitBounds(bounds, { padding: 30, animate: false })
  }, [boundaries, mapReady])

  // Restyle fills when classification changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setPaintProperty('munis-fill', 'fill-color', fillColorExpression(classification) as never)
  }, [classification, mapReady])

  // The shared hover id (map- or panel-driven) controls the outline highlight.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (prevHoverRef.current !== null && prevHoverRef.current !== hoveredMuniId) {
      map.setFeatureState({ source: 'munis', id: prevHoverRef.current }, { hover: false })
    }
    if (hoveredMuniId !== null) {
      map.setFeatureState({ source: 'munis', id: hoveredMuniId }, { hover: true })
    }
    prevHoverRef.current = hoveredMuniId
  }, [hoveredMuniId, mapReady])

  // Mouse interactions on the map itself (tooltip stays map-local).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const onMove = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f) return
      onHoverMuni(Number(f.properties.muni_id))
      map.getCanvas().style.cursor = 'pointer'
      setHover({
        x: e.point.x,
        y: e.point.y,
        name: String(f.properties.municipal),
        subregion: f.properties.subrg_abbr ? String(f.properties.subrg_abbr) : null,
        value: f.properties.__hasData === 1 ? Number(f.properties.__value) : null,
        hasData: f.properties.__hasData === 1,
      })
    }
    const onLeave = () => {
      onHoverMuni(null)
      map.getCanvas().style.cursor = ''
      setHover(null)
    }
    map.on('mousemove', 'munis-fill', onMove)
    map.on('mouseleave', 'munis-fill', onLeave)
    return () => {
      map.off('mousemove', 'munis-fill', onMove)
      map.off('mouseleave', 'munis-fill', onLeave)
    }
  }, [mapReady, onHoverMuni])

  const showValueRow = values !== null

  return (
    <div className="map-wrap" ref={containerRef}>
      {hover && (
        <div
          className="map-tooltip"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="tooltip-name">
            {hover.name}
            {hover.subregion && <span className="tooltip-subregion"> · {hover.subregion}</span>}
          </div>
          {showValueRow && (
            <div className="tooltip-value">
              {variableLabel && <span className="tooltip-var">{variableLabel}</span>}
              <span className="tooltip-num">
                {hover.hasData && hover.value !== null
                  ? formatValue(hover.value, classification)
                  : 'No data'}
              </span>
              {yearLabel && <span className="tooltip-year">{yearLabel}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
