import type { DataRow } from '../types'

interface QueryResponse {
  fields: Record<string, { type?: string }>
  total_rows: number
  rows: DataRow[]
}

/** Run a SELECT against the DataCommon API via our proxy (see api/dc.js). */
export async function dcQuery(database: 'ds' | 'gisdata' | 'towndata', sql: string): Promise<QueryResponse> {
  const url = `/api/dc?token=datacommon&database=${database}&query=${encodeURIComponent(sql)}`
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok || text.startsWith('Unable')) {
    throw new Error(`DataCommon API error: ${text.slice(0, 200)}`)
  }
  return JSON.parse(text) as QueryResponse
}

export function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}
