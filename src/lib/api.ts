import type { DataRow } from '../types'

interface TableResponse {
  fields: string[]
  rows: DataRow[]
  total_rows?: number
}

/**
 * Fetch a full table through our proxy (see api/dc.js).
 *
 * The DataCommon API's SQL query mode was removed for security (August 2026);
 * the parameterized replacement returns whole tables, so year filtering
 * happens client-side and tables are cached per selection.
 */
export async function dcTable(table: string): Promise<TableResponse> {
  const url = `/api/dc?token=datacommon&database=ds&schema=tabular&table=${encodeURIComponent(table)}`
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok || /^(Token|Invalid|Unable)/.test(text)) {
    throw new Error(`DataCommon API error: ${text.slice(0, 200)}`)
  }
  return JSON.parse(text) as TableResponse
}
