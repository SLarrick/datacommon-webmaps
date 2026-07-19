import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection } from 'geojson'
import type { Classification } from '../lib/classify'
import { NO_DATA_COLOR, formatValue } from '../lib/classify'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const NEUTRAL_FILL = '#c9d6d3'

interface HoverInfo {
  x: number
  y: number
  name: string
  sublabel: string | null
  value: number | null
  hasData: boolean
}

interface Props {
  /** Display features carrying __id/__name/__sub/__value/__hasData props. */
  data: FeatureCollection | null
  /** Reference boundaries drawn as lines above the choropleth (e.g. munis over tracts). */
  overlay: FeatureCollection | null
  classification: Classification | null
  variableLabel: string | null
  yearLabel: string | null
  /** Changing this string re-fits the map to the data extent. */
  fitKey: string
  hoveredId: string | null
  onHover: (id: string | null) => void
  /** Receives the live map canvas getter, for PNG export. */
  canvasRef?: React.MutableRefObject<(() => HTMLCanvasElement | null) | null>
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
  data,
  overlay,
  classification,
  variableLabel,
  yearLabel,
  fitKey,
  hoveredId,
  onHover,
  canvasRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const prevHoverRef = useRef<string | null>(null)
  const lastFitRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [-71.06, 42.35],
      zoom: 8.3,
      attributionControl: { compact: true },
      // Keeps the WebGL buffer readable for PNG export.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('units', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: '__id',
      })
      map.addLayer({
        id: 'units-fill',
        type: 'fill',
        source: 'units',
        paint: { 'fill-color': NEUTRAL_FILL, 'fill-opacity': 0.82 },
      })
      map.addLayer({
        id: 'units-line',
        type: 'line',
        source: 'units',
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
      map.addSource('overlay', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'overlay-line',
        type: 'line',
        source: 'overlay',
        paint: { 'line-color': '#3d4f5a', 'line-width': 1.4, 'line-opacity': 0.8 },
      })
      setMapReady(true)
    })
    mapRef.current = map
    if (canvasRef) canvasRef.current = () => mapRef.current?.getCanvas() ?? null
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

  // Push display data into the source.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !data) return
    const source = map.getSource('units') as maplibregl.GeoJSONSource
    source.setData(data)
  }, [data, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource('overlay') as maplibregl.GeoJSONSource
    source.setData(overlay ?? { type: 'FeatureCollection', features: [] })
  }, [overlay, mapReady])

  // Re-fit when the frame/bin extent changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !data || data.features.length === 0) return
    if (lastFitRef.current === fitKey) return
    lastFitRef.current = fitKey
    const bounds = new maplibregl.LngLatBounds()
    const walk = (coords: unknown): void => {
      if (typeof (coords as number[])[0] === 'number') {
        bounds.extend(coords as [number, number])
      } else {
        for (const c of coords as unknown[]) walk(c)
      }
    }
    for (const f of data.features) {
      const coords = (f.geometry as { coordinates?: unknown } | null)?.coordinates
      if (coords) walk(coords)
    }
    map.fitBounds(bounds, { padding: 30, animate: false })
  }, [data, fitKey, mapReady])

  // Restyle fills when classification changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setPaintProperty('units-fill', 'fill-color', fillColorExpression(classification) as never)
  }, [classification, mapReady])

  // The shared hover id (map- or panel-driven) controls the outline highlight.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (prevHoverRef.current !== null && prevHoverRef.current !== hoveredId) {
      map.setFeatureState({ source: 'units', id: prevHoverRef.current }, { hover: false })
    }
    if (hoveredId !== null) {
      map.setFeatureState({ source: 'units', id: hoveredId }, { hover: true })
    }
    prevHoverRef.current = hoveredId
  }, [hoveredId, mapReady])

  // Mouse interactions on the map itself (tooltip stays map-local).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const onMove = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f) return
      onHover(String(f.properties.__id))
      map.getCanvas().style.cursor = 'pointer'
      setHover({
        x: e.point.x,
        y: e.point.y,
        name: String(f.properties.__name),
        sublabel: f.properties.__sub ? String(f.properties.__sub) : null,
        value: f.properties.__hasData === 1 ? Number(f.properties.__value) : null,
        hasData: f.properties.__hasData === 1,
      })
    }
    const onLeave = () => {
      onHover(null)
      map.getCanvas().style.cursor = ''
      setHover(null)
    }
    map.on('mousemove', 'units-fill', onMove)
    map.on('mouseleave', 'units-fill', onLeave)
    return () => {
      map.off('mousemove', 'units-fill', onMove)
      map.off('mouseleave', 'units-fill', onLeave)
    }
  }, [mapReady, onHover])

  const showValueRow = classification !== null

  return (
    <div className="map-wrap" ref={containerRef}>
      {hover && (
        <div className="map-tooltip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <div className="tooltip-name">
            {hover.name}
            {hover.sublabel && <span className="tooltip-subregion"> · {hover.sublabel}</span>}
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
