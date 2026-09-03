// Vercel serverless proxy for the MAPC DataCommon API.
// Needed because the API sends no CORS headers, so browsers can't call it
// directly. The API's SQL query mode was removed for security (August 2026);
// this proxies only the parameterized table-fetch mode.

const UPSTREAM = 'https://datacommon.mapc.org/api/'
const ALLOWED_DATABASES = new Set(['ds', 'gisdata', 'towndata'])
const ALLOWED_SCHEMAS = new Set(['tabular', 'mapc'])

export default async function handler(req, res) {
  const { database, schema, table, token } = req.query

  if (!database || !schema || !table) {
    res.status(400).json({ error: 'database, schema, and table parameters are required' })
    return
  }
  if (!ALLOWED_DATABASES.has(database) || !ALLOWED_SCHEMAS.has(schema)) {
    res.status(400).json({ error: 'unknown database or schema' })
    return
  }
  if (!/^[A-Za-z0-9_]{1,200}$/.test(table)) {
    res.status(400).json({ error: 'invalid table name' })
    return
  }

  const url =
    `${UPSTREAM}?token=${encodeURIComponent(token || 'datacommon')}` +
    `&database=${encodeURIComponent(database)}&schema=${encodeURIComponent(schema)}` +
    `&table=${encodeURIComponent(table)}`

  const upstream = await fetch(url)
  const text = await upstream.text()

  // All DataCommon data is public and slow-changing: cache hard at the CDN.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(upstream.ok ? 200 : 502).send(text)
}
