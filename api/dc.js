// Vercel serverless proxy for the MAPC DataCommon API.
// Needed because the API sends no CORS headers, so browsers can't call it directly.
// Only read-only SELECT queries against datacommon.mapc.org are forwarded.

const UPSTREAM = 'https://datacommon.mapc.org/api/'
const ALLOWED_DATABASES = new Set(['ds', 'gisdata', 'towndata'])

export default async function handler(req, res) {
  const { database, query, token } = req.query

  if (!database || !query) {
    res.status(400).json({ error: 'database and query parameters are required' })
    return
  }
  if (!ALLOWED_DATABASES.has(database)) {
    res.status(400).json({ error: 'unknown database' })
    return
  }
  if (!/^\s*select\b/i.test(query) || /;/.test(query)) {
    res.status(400).json({ error: 'only single SELECT queries are allowed' })
    return
  }

  const url = `${UPSTREAM}?token=${encodeURIComponent(token || 'datacommon')}` +
    `&database=${encodeURIComponent(database)}&query=${encodeURIComponent(query)}`

  const upstream = await fetch(url)
  const text = await upstream.text()

  // All DataCommon data is public and slow-changing: cache hard at the CDN.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(upstream.ok ? 200 : 502).send(text)
}
