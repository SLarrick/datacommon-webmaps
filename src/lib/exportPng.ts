import type { Classification } from './classify'
import { legendRows } from './classify'

interface ExportOptions {
  mapCanvas: HTMLCanvasElement
  title: string
  subtitle: string
  classification: Classification
  filename: string
}

/**
 * Composite the map canvas with a title band, legend box, and attribution
 * into a self-explanatory PNG, then trigger a download.
 */
export function exportMapPng({ mapCanvas, title, subtitle, classification, filename }: ExportOptions): void {
  const scale = 2 // crisp output regardless of screen DPR
  const HEADER = 64 * scale
  const FOOTER = 26 * scale
  const outW = Math.round(mapCanvas.clientWidth * scale)
  const outH = Math.round(mapCanvas.clientHeight * scale) + HEADER + FOOTER

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background + map
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(mapCanvas, 0, HEADER, outW, outH - HEADER - FOOTER)

  // Header band
  ctx.fillStyle = '#1f3a4d'
  ctx.fillRect(0, 0, outW, HEADER)
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${16 * scale}px -apple-system, 'Segoe UI', Roboto, sans-serif`
  ctx.fillText(truncate(ctx, title, outW - 24 * scale), 12 * scale, 26 * scale)
  ctx.fillStyle = '#b8c7d1'
  ctx.font = `400 ${12 * scale}px -apple-system, 'Segoe UI', Roboto, sans-serif`
  ctx.fillText(truncate(ctx, subtitle, outW - 24 * scale), 12 * scale, 46 * scale)

  // Legend box (bottom-right of the map area)
  const rows = legendRows(classification)
  const rowH = 18 * scale
  const pad = 10 * scale
  const boxW = 190 * scale
  const boxH = pad * 2 + rows.length * rowH
  const boxX = outW - boxW - 12 * scale
  const boxY = outH - FOOTER - boxH - 12 * scale
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.strokeStyle = '#dde4e6'
  ctx.lineWidth = 1 * scale
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 6 * scale)
  ctx.fill()
  ctx.stroke()
  rows.forEach((r, i) => {
    const y = boxY + pad + i * rowH
    ctx.fillStyle = r.color
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.roundRect(boxX + pad, y + 3 * scale, 16 * scale, 11 * scale, 2 * scale)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#2b3438'
    ctx.font = `400 ${11 * scale}px -apple-system, 'Segoe UI', Roboto, sans-serif`
    ctx.fillText(truncate(ctx, r.label, boxW - pad * 2 - 22 * scale), boxX + pad + 22 * scale, y + 12 * scale)
  })

  // Footer attribution
  ctx.fillStyle = '#66757c'
  ctx.font = `400 ${10 * scale}px -apple-system, 'Segoe UI', Roboto, sans-serif`
  ctx.fillText(
    truncate(
      ctx,
      'Data: MAPC DataCommon · Basemap: © CARTO, © OpenStreetMap contributors · datacommon-webmaps.vercel.app',
      outW - 24 * scale,
    ),
    12 * scale,
    outH - 9 * scale,
  )

  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }, 'image/png')
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}
