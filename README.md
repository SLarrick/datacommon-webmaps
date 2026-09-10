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
- **Data fetches** — selecting a table fetches the whole table once through the proxy (`?database=ds&schema=tabular&table=<t>`) and caches it client-side; year filtering happens during the join, so switching variables or years requires no new fetch. Values join to polygons client-side on the table's join key (`muni_id`, `ct10_id`, `ct20_id`).
- **Proxy** — the DataCommon API sends no CORS headers, so the browser can't call it directly. In dev, Vite proxies `/api/dc` (see `vite.config.ts`); in production the Vercel function `api/dc.js` does the same with CDN caching. The proxy allowlists `database` and `schema` and validates `table` as a bare identifier; nothing else is forwarded.
- **Preview datasets** (this branch) — catalog entries in `public/data/local/catalog.json` with `local: true` load from static JSON instead of the API and show a "Preview — not yet published" badge; DataCommon link and CSV export are hidden for them. Regenerate with `node scripts/build-local-datasets.mjs` from the CSVs in `local-data/`. Currently: MAPC rental listings summaries, 2026 Q2, municipal + tract.
- **Basemap resilience** — the CARTO basemap is fetched with a timeout and a sprite probe; if the map hasn't fully loaded within 10 s it falls back to a minimal self-contained style so the choropleth always renders.
- **Classification** — 5-class quantiles, sequential YlGnBu ramp; variables spanning negative and positive get a diverging ramp pivoted at 0. Percent-like variables are detected by name/alias and formatted as percentages. Municipalities without data render gray and are counted in the legend.
- **URL state** — `?frame=mapc&bin=muni&table=…&var=…&year=…` fully describes a view. `frame`/`bin` are fixed in Phase 1 but included so Phase 2 links stay compatible.

## DataCommon API notes (updated September 2026)

- **Table-fetch API** (the mode the app uses; returns the whole table, no filtering; note the required trailing slash):
  `https://datacommon.mapc.org/api/?token=datacommon&database=ds|gisdata|towndata&schema=<schema>&table=<t>` → `{fields, rows}`
- **SQL query mode was removed in August 2026** (`&query=<SQL>` now returns "not authorized"). The catalog and boundary build scripts (`scripts/build-catalog.mjs` and the tract prep) were written against it and **cannot currently regenerate**; the checked-in `catalog.json` and boundary files stay valid until DataCommon adds or renames tables. See `docs/PRD.md` §8 for options.
- Export API (user-facing downloads):
  `https://datacommon.mapc.org/api/export?token=datacommon&database=ds&schema=tabular&table=<t>&format=csv|json|geojson|shp&years=<y>`
- `ds.metadata.<table>` holds each table's title, join key, and column aliases.
- Geometry columns in `gisdata` are Esri `st_geometry` (use `sde.ST_AsText`, or the Export API's GeoJSON format).

## Deploy

Vercel: import the repo, framework preset **Vite**. The `api/` folder deploys automatically as a serverless function. No environment variables required.
