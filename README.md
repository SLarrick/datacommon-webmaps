# MAPC DataCommon Web Maps

A prototype that generates a simple interactive **choropleth map for (nearly) every MAPC DataCommon dataset**, powered by the public [DataCommon API](https://datacommon.mapc.org/developers).

**Current state (Phases 1–2 shipped):** frames (MAPC region / subregion / municipality), bins (subregion / municipality / census tract with 2010+2020 vintages), 258 eligible datasets grouped by DataCommon topics, searchable variable picker, rankings panel with map hover sync, tooltip, legend, shareable URLs, and GeoJSON download of the current view.

Full product definition, verified API findings, and the build log: **[docs/PRD.md](docs/PRD.md)**.

## Quick start

```bash
npm install
npm run dev        # dev server with API proxy at /api/dc
npm run build      # production build (dist/)
```

## How it works

- **Catalog** — `node scripts/build-catalog.mjs` introspects the DataCommon API (table list, per-table metadata, year columns, row cardinality) and writes `public/data/catalog.json` plus an eligibility audit (`scripts/audit-report.md`). 139 of 168 municipal tables are currently eligible; the rest have subgroup breakdowns (multiple rows per municipality-year) deferred to Phase 2.
- **Boundaries** — `public/data/mapc_munis.geojson` holds the 101 MAPC municipalities (simplified from `gisdata.mapc.mapc_municipalities_poly`, ~480 KB), including subregion attributes for Phase 2.
- **Data fetches** — selecting a table/year runs `SELECT * FROM tabular.<table> WHERE <year_col> = '<year>'` through a proxy; switching variables requires no new fetch. Values join to polygons client-side on `muni_id`.
- **Proxy** — the DataCommon API sends no CORS headers, so the browser can't call it directly. In dev, Vite proxies `/api/dc` (see `vite.config.ts`); in production the Vercel function `api/dc.js` does the same with CDN caching. Only single SELECT statements are forwarded.
- **Classification** — 5-class quantiles, sequential YlGnBu ramp; variables spanning negative and positive get a diverging ramp pivoted at 0. Percent-like variables are detected by name/alias and formatted as percentages. Municipalities without data render gray and are counted in the legend.
- **URL state** — `?frame=mapc&bin=muni&table=…&var=…&year=…` fully describes a view. `frame`/`bin` are fixed in Phase 1 but included so Phase 2 links stay compatible.

## DataCommon API notes (verified July 2026)

- Query API (arbitrary SELECT, incl. `information_schema`; note the required trailing slash):
  `https://datacommon.mapc.org/api/?token=datacommon&database=ds|gisdata|towndata&query=<SQL>`
- Export API (user-facing downloads):
  `https://datacommon.mapc.org/api/export?token=datacommon&database=ds&schema=tabular&table=<t>&format=csv|json|geojson|shp&years=<y>`
- `ds.metadata.<table>` holds each table's title, join key, and column aliases.
- Geometry columns in `gisdata` are Esri `st_geometry` (use `sde.ST_AsText`, or the Export API's GeoJSON format).

## Deploy

Vercel: import the repo, framework preset **Vite**. The `api/` folder deploys automatically as a serverless function. No environment variables required.
