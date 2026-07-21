# PRD: MAPC DataCommon Web Maps

**Version:** 1.1
**Author:** Stephen Larrick (with Claude)
**Date:** July 18, 2026
**Status:** Phases 1–2 built and verified (see §9 Build log)
**Source brief:** "A Choropleth Web Map for Every DataCommon Table/Variable" (internal doc, not in this repo)

---

## 1. Overview

**MAPC DataCommon Web Maps** is a standalone prototype web application that generates a simple, interactive choropleth map for (nearly) every MAPC DataCommon table, powered by the public DataCommon API. Users select a geographic frame, a geographic binning unit, a DataCommon table, and a variable — and get an honest, legible choropleth with a tooltip, legend, and spatial (GeoJSON) download.

DataCommon today presents most of its data as tables and charts only; there is no map view. Yet municipal planners — DataCommon's core audience — work in the context of the map. This tool closes that gap.

### Product positioning

- **Prototype / proof of concept**, hosted separately from DataCommon (own repo under @slarrick, deployed on Vercel).
- **Primary audience (now):** MAPC colleagues. Success = colleagues "get it" — they immediately understand the value of a map view for DataCommon data.
- **North star:** these features get adopted into DataCommon proper. Acceptable alternate outcome: a standalone, simpler/more-focused mapping tool that could eventually be shared with municipalities.

### Success criteria (prototype)

1. An MAPC colleague can, without instruction, pick a table and variable and see a correct choropleth of the MAPC region within ~30 seconds.
2. Any Phase 1-eligible municipal table renders correctly (right join, right year, sensible colors, honest legend).
3. A colleague can send a URL to another colleague and they see the same map state.
4. A user can download what they're looking at as GeoJSON and open it in QGIS/ArcGIS with values joined to polygons.

---

## 2. What we verified about the DataCommon API (July 2026 spike)

These findings ground the architecture and were confirmed with live API calls:

| Finding | Detail | Implication |
|---|---|---|
| **Export API** | `GET https://datacommon.mapc.org/api/export?token=datacommon&database=ds&schema=tabular&table=<t>&format=csv\|json\|geojson\|shp&years=<y>` | Powers user-facing downloads; supports year filtering |
| **Query API — full SQL** | `GET https://datacommon.mapc.org/api/?token=datacommon&database=<db>&query=<SQL>` returns `{fields, total_rows, rows}` | We can run arbitrary SELECTs incl. `information_schema` introspection and PostGIS functions. Server-side filtering, aggregation, and table discovery are all possible |
| **Three databases** | `ds` (tabular data + metadata), `gisdata` (spatial), `towndata` | Boundaries and data come from the same API |
| **Per-table metadata** | `ds` has a `metadata` schema with one metadata table per data table, containing rows like `join_key` (e.g. `muni_id`), `title`, `alt_title`, plus column name/alias/description entries | We can build a human-readable table catalog and variable picker, and know each table's geographic join key, without hand-curation |
| **Geography naming convention** | Table suffixes encode geography: `_m` (municipal), `_ct` (census tract), `_bg` (block group) | Cheap first-pass classification of tables by bin level. **168 tables** in `tabular` end in `_m` |
| **Boundary polygons in `gisdata`** | e.g. `gisdata.mapc.ma_municipalities` has `muni_id`, `municipal`, geometry; GeoJSON export works | We may not need ArcGIS Hub layers at all; one API for everything. PostGIS `ST_AsGeoJSON`/`ST_Simplify` available via Query API |
| **No CORS headers** | Responses carry no `Access-Control-Allow-Origin`, even with an `Origin` header sent | **Browser cannot call the API directly.** All API calls must go through a lightweight serverless proxy on our Vercel deployment |
| **Wide (denormalized) rows** | e.g. `hous_building_permits_m` returns one row per municipality per calendar year with many value columns | The frame/bin/variable/year model maps cleanly onto real data; year selection is essential |

---

## 3. Core product concepts

Every map view is fully described by five selections (this 5-tuple is also the shareable URL state):

1. **Geographic frame/scope** — the extent of the map: Statewide, MA County, RPA region, MAPC region, MAPC subregion, Municipality. *(Census-tract-as-frame is cut from scope — below the municipality, frames add little value.)*
2. **Geographic bin unit** — the polygons that get colored: RPA regions, Counties, Municipalities, Census tracts, Block groups, Blocks. Must nest below the frame, and is constrained by performance rules (see §6.3).
3. **Table** — a DataCommon table, filterable to those joinable to the current bin unit.
4. **Variable** — a numeric column from the selected table.
5. **Year** — where the table is multi-year, defaults to the latest available year.

**Compatibility rules:** bin availability depends on frame (feasibility) and table availability depends on bin (a table with `muni_id` join key is only mappable with municipality bins). The UI enforces these rules by disabling/filtering options, never by erroring.

---

## 4. Phasing

| Phase | Scope | Outcome |
|---|---|---|
| **Phase 1 (this PRD, detailed)** | MAPC-region frame only; municipality bins only; municipal (`_m`) tables only; variable + year selection; tooltip; legend; GeoJSON download of current view; shareable URLs | Demoable end-to-end product proving the concept |
| **Phase 1.5** | Rankings panel: ranked list of all bin units for the selected variable, hover-synced with the map (see §5.7) | Answers "who's highest/lowest" — the first question every planner asks |
| **Phase 2 (specified in §11)** | Frames: MAPC region (max), MAPC subregion, municipality. Bins: subregion, municipality, census tract. Enables the 134 `_ct` tables | The drill-down model planners need, kept inside the MAPC frame for performance and focus |
| **Phase 3** | Table preview panel across bottom of screen (MMA Data Hub pattern): click column header → select variable; click row → highlight geography on map. Census block bins within small frames | Power-user exploration |
| **Later / opportunistic** | Embed mode, PNG export, side-by-side year comparison, DataCommon cross-links per table | Adoption aids |

---

## 5. Phase 1 — Product specification

### 5.1 Scope statement

One page. A choropleth of the **101 MAPC municipalities**, colored by a user-selected variable from a user-selected municipal DataCommon table, for a user-selected year. Frame and bin controls are **visible but locked** to "MAPC region" and "Municipality" (communicating the future model without building it).

### 5.2 User stories

1. *As an MAPC planner, I select a table from a searchable list of municipal DataCommon datasets and see it mapped immediately with sensible defaults (first numeric variable, latest year).*
2. *As a planner, I switch variables and years and the map + legend update in under a second.*
3. *As a planner, I hover over a municipality and see its name, the variable value, and the year.*
4. *As a planner, I copy the URL and send it to a colleague, who sees the exact same map.*
5. *As a GIS user, I download the current view as GeoJSON (municipal polygons + selected table's columns for the selected year) and open it in ArcGIS (or QGIS).*

### 5.3 UI layout

```
┌────────────────────────────────────────────────────────────┐
│ Header: "MAPC DataCommon Web Maps" + one-line description  │
├──────────────┬─────────────────────────────────────────────┤
│ Sidebar      │                                             │
│  Frame:      │                                             │
│   [MAPC ▾]   │              MAP                            │
│   (locked)   │   (MapLibre, MAPC munis choropleth,         │
│  Bin unit:   │    hover tooltip, zoom/pan)                 │
│   [Muni ▾]   │                                             │
│   (locked)   │                          ┌───────────────┐  │
│  Table:      │                          │ Legend        │  │
│   [search ▾] │                          │ (classes +    │  │
│  Variable:   │                          │  no-data)     │  │
│   [select ▾] │                          └───────────────┘  │
│  Year:       │                                             │
│   [select ▾] │                                             │
│  ──────────  │                                             │
│  [⬇ GeoJSON] │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

- **Table picker:** searchable dropdown (type-ahead), listing Phase 1-eligible tables by human-readable title (from metadata schema), with table-name shown secondarily. Grouped or tagged by DataCommon category if recoverable from metadata.
- **Variable picker:** enabled once a table is selected; lists numeric columns by their metadata alias (fallback: column name). Defaults to first numeric non-ID column.
- **Year picker:** shown only when the table has a detected year column; defaults to most recent year. Single-select.
- **Empty state (no table selected):** map shows MAPC munis with neutral fill + instruction ("Select a dataset to map").
- **Tooltip (hover):** municipality name, variable alias, formatted value, year. On no-data munis: "No data."
- **Legend:** color ramp with class breaks, formatted numbers, and an explicit no-data swatch.
- **Download button:** "Download GeoJSON (current view)" — munis + all columns of the selected table for the selected year (not just the selected variable), so the file is analysis-ready.
- **Mobile:** desktop-first; must not break on tablet. Phone support is out of scope for Phase 1.

### 5.4 Cartographic defaults (honesty rules)

- **Classification:** 5-class quantiles by default (robust to skewed civic data). Ties/degenerate distributions fall back to fewer classes.
- **Ramp:** single-hue sequential (light→dark), colorblind-safe (ColorBrewer/CARTO ramp), loosely aligned with MAPC palette.
- **Diverging data:** columns whose values span negative and positive (e.g. % change) get a diverging ramp centered at 0.
- **Nulls/suppressed:** rendered in a hatched/neutral gray, never as the lowest class; counted in legend as "No data (n)".
- **Number formatting:** thousands separators; percentages detected via metadata alias/name (`pct`, `%`, `share`, or 0–1/0–100 range heuristics) and formatted accordingly.
- **Non-goals:** we do not attempt normalization on the user's behalf (no auto-dividing counts by population). The variable is mapped as-is; the tooltip shows the raw value.

### 5.5 Shareable URL state

All of: `table`, `variable` (column name), `year` — plus `frame` and `bin` (fixed values in Phase 1, but included so Phase 2 URLs are backward-compatible) — encoded as query params, e.g.:

```
/?frame=mapc&bin=muni&table=hous_building_permits_m&var=total_units&year=2023
```

Loading a URL with invalid/stale params degrades gracefully to defaults with a non-blocking notice.

### 5.6 Out of scope for Phase 1

Other frames/bins (controls visible but locked), whole-table download, table preview panel, multi-year comparison, embeds, authentication (none — everything is public data), analytics beyond a basic page-view counter, phone layouts.

### 5.7 Rankings panel (Phase 1.5)

A collapsible panel overlaying the right side of the map, toggled by a button, listing **all bin units ranked by the selected variable** (descending). Because the joined values already live client-side, this requires no new API calls.

- **Row contents:** rank number (competition ranking — ties share a rank), municipality name, formatted value, a horizontal bar scaled to the maximum absolute value (making the distribution's drop-off scannable), and a color chip matching the unit's choropleth class. No-data munis are listed last in gray.
- **Hover sync, both directions:** hovering a row highlights that municipality on the map (reusing the hover outline); hovering the map highlights and scrolls to the corresponding row. This turns "Wellesley is dark blue" into "Wellesley is #4 of 101."
- **URL state:** the panel's open state is encoded (`rank=1`) so shared links can present a ranking view.
- **Honesty caveat:** ACS-based tables show a footnote that adjacent ranks may not represent statistically meaningful differences (margins of error overlap). Displaying MOE ranges inline is deferred.
- **Trajectory:** when the Phase 3 full table panel arrives, this panel becomes its "sorted by variable" view rather than being discarded.

---

## 6. Technical design

### 6.1 Stack

- **Framework:** React + Vite SPA (matches MAPC precedent — homesforprofit.mapc.org is a Vite React SPA), deployed on **Vercel**.
- **Serverless proxy:** Vercel serverless functions (`/api/*`) that forward requests to the DataCommon API. **Required** because the DataCommon API sends no CORS headers (verified). The proxy is a thin pass-through with an allowlist (only `datacommon.mapc.org` endpoints, only SELECT queries) and response caching headers.
- **Mapping:** **MapLibre GL JS** (open-source, no token, vector rendering, smooth at Phase 2+ scales where Leaflet + raw GeoJSON would struggle; consistent with modern MAPC/Vercel map tools like the OSM Explorer).
- **State:** URL query params as source of truth; React state hydrated from/synced to URL. No global state library needed at this size.
- **Styling:** lightweight (CSS modules or Tailwind), loose MAPC visual inspiration (typography/colors), prototype-neutral where the style guide doesn't cover map UI.

### 6.2 Data flow (Phase 1)

1. **Build-time (or cached at runtime) catalog:** a script queries `information_schema` + the `metadata` schema to produce `catalog.json`: for each `_m` table — table name, human title, join key, numeric columns with aliases, detected year column, available years, eligibility flag. Checked into the repo; regenerable with one command. This *is* the "table eligibility audit" — its summary output (X of 168 municipal tables eligible, with reasons for exclusions) is a deliverable.
2. **Boundaries:** MAPC municipal polygons fetched once from `gisdata` via the Query API using `ST_AsGeoJSON(ST_Simplify(...))` selecting only `muni_id`, `municipal`, geometry — then cached as a static file in the repo (boundaries change ~never). Source of truth remains the API; ArcGIS Hub layers are fallback only.
3. **Runtime data fetch:** on table/year selection, proxy a Query API call: `SELECT <join_key>, <numeric cols> FROM tabular.<table> WHERE <year_col> = <year>` → join client-side to polygons by `muni_id` → restyle fill layer. Variable switching within a loaded table/year requires **no new fetch**.
4. **Download:** client generates the GeoJSON in-browser from the already-joined data (polygons + all table columns for the selected year) — no extra API load, exactly matches what's on screen.

### 6.3 Performance guardrails (Phase 1 + forward-looking)

- Phase 1 (101 munis) is trivially performant; simplified geometries keep the payload well under ~1 MB.
- The frame→bin feasibility matrix from the brief (e.g. no blocks statewide, tracts only within MAPC region or smaller) is recorded as a config table in code from day one so Phase 2 inherits it.
- Proxy responses cached (CDN `s-maxage`) since all data is public and slow-changing.

### 6.4 Repo & deployment

- New GitHub repo under **@slarrick** (per brief; not in MAPC/datacommon-react).
- Vercel auto-deploy from `main`; preview deploys on PRs for colleague feedback.
- README covers: what it is, architecture sketch, how to regenerate the catalog, DataCommon API notes learned in the spike.

---

## 7. Phase 1 build plan

| # | Milestone | Contents | Exit criterion |
|---|---|---|---|
| 1 | **Catalog + audit** | Catalog generation script; classify all 168 `_m` tables; detect join keys, year columns, numeric variables; eligibility report | `catalog.json` + audit summary ("X/168 mappable; exclusions and why") |
| 2 | **Map shell** | Vite/React app; MapLibre map of MAPC munis (from `gisdata`, simplified); Vercel deploy with proxy function | Deployed URL showing MAPC munis with hover names |
| 3 | **Choropleth core** | Table/variable/year pickers wired to catalog; data fetch via proxy; quantile classification; fill styling; legend; tooltip with values; no-data handling | Any eligible table renders a correct, honest choropleth |
| 4 | **Share + download** | URL state sync (load + update); GeoJSON download of current view | URL round-trips exactly; download opens in QGIS with joined values |
| 5 | **Polish + demo** | MAPC-inspired styling; locked frame/bin controls; empty/edge states; pass over ~10 diverse tables (permits, ACS demographics, tax, sales) for formatting bugs | Demo-ready; colleague walkthrough without hand-holding |

Suggested sequencing note: milestones 1 and 2 are independent and can proceed in parallel.

---

## 8. Risks & open questions

| Risk / question | Likelihood · impact | Mitigation |
|---|---|---|
| Year columns are inconsistently named across tables (`cal_year`, `acs_year`, `fy`, year ranges like `2019-23`) | High · Medium | Catalog script detects year-like columns per table via name patterns + value inspection; tables where detection fails are marked ineligible for Phase 1 (counted in audit) rather than mis-mapped |
| Some `_m` tables have multiple rows per muni per year (subgroup breakdowns) | Medium · High | Catalog script checks row cardinality per muni-year; such tables are Phase 1-ineligible (honest exclusion) — generic dimension filters are a Phase 2+ feature |
| API stability/rate limits are undocumented; proxy adds a dependency on token `datacommon` remaining public | Medium · Medium | Aggressive CDN caching; graceful error states; this is a prototype for colleagues, not production infrastructure |
| Metadata schema coverage may be incomplete for some tables | Medium · Low | Fallbacks: raw column names as labels; table name as title |
| MAPC 101-muni boundary set vs. 351 statewide munis — confirm `gisdata.mapc.mapc_municipalities_poly` (or filter `ma_municipalities` by MAPC membership) is the right Phase 1 layer | Low · Low | Verify during milestone 2; both exist in `gisdata` |
| Scope creep toward DataCommon-replacement | Medium · Medium | Phase gates in this PRD; Phase 1 ships before any Phase 2 work starts |

**Open question for MAPC conversations (not blocking):** should the tool link each map back to its DataCommon dataset page (adoption bridge)? Cheap to add in Phase 1 polish if a stable URL pattern exists.

---

## 9. Build log (July 18, 2026)

Phase 1 was implemented and verified in one session. Code: `datacommon-webmaps/` (repo: github.com/SLarrick/datacommon-webmaps).

**All five Phase 1 milestones completed:**

1. **Catalog + audit** — `scripts/build-catalog.mjs` introspects the API (~340 queries, ~2 min) and classifies all 168 `_m` tables. **Result: 139/168 eligible.** All 29 exclusions are subgroup-breakdown tables (multiple rows per municipality-year: population by age/gender/race, household income by race, ES-202 industry rows, etc.), confirming the PRD's top risk and its mitigation. Audit: `scripts/audit-report.md`; catalog: `public/data/catalog.json`.
2. **Map shell** — Vite + React + TypeScript + MapLibre GL; CARTO Positron basemap; 101 MAPC munis simplified from 11 MB (`gisdata.mapc.mapc_municipalities_poly`, which usefully carries subregion attributes for Phase 2) to ~480 KB via mapshaper; Vite dev proxy + Vercel serverless function (`api/dc.js`) for the CORS-less API.
3. **Choropleth core** — searchable dataset picker (titles from metadata schema), variable/year pickers, quantile classification, legend with no-data count, hover tooltip with muni + subregion + formatted value.
4. **Share + download** — URL state (`?frame=mapc&bin=muni&table=…&var=…&year=…`) round-trips exactly, with graceful degradation for stale links; GeoJSON download of current view verified in-file (101 features, all columns joined, provenance metadata).
5. **Polish + verify** — browser-verified across five diverse tables (permit counts, permit percent shares, ACS per-capita income with year-range vintages, census 2010–2020 change, municipal taxes); console/typecheck/build clean.

**Phase 1.5 (rankings panel) — shipped same day.** Built per §5.7 and verified live: ranked list with competition ranking for ties, class-colored chips, distribution bars, bidirectional map↔panel hover sync, `rank=1` URL state, and the ACS caveat footnote. Two fixes shipped with it: single-class classifications previously produced an invalid MapLibre step expression (now a flat fill), and degenerate legend classes ("12 – 12") now display as a single value.

**Phase 2 — shipped July 18, 2026.** Built per §11 and verified live across all frame×bin combinations:

- **Catalog v2 audit:** 137/168 municipal + **121/134 tract** tables eligible; **120** municipal tables carry pre-computed subregion rows; **105 sibling pairs** power auto-swap when switching bins.
- **Boundaries:** 813 (2020) and 706 (2010) MAPC tracts clipped and stamped with primary municipality via the `_datakeys_geog_xw` block crosswalks (the shapefile export was required — the GeoJSON export silently caps at 500 features); 8 subregions dissolved from the munis layer.
- **Vintage-aware joins** verified: the same ACS tract table renders against 2020 tracts for the 2017-21 vintage and against 2010 tracts for 2015-19.
- **Subregion bins** use MAPC's own aggregate rows (no client math), labeled as such in the UI.
- Fixes shipped with it: null-geometry water tracts dropped at build time; ID-like columns (`geoid`) excluded from variable pickers.

**Feedback round — July 18, 2026 (post-Phase 2).** Colleague-style feedback from Stephen, all shipped: municipal boundary lines stay visible above tract choropleths; the dataset picker is grouped by the DataCommon browser's own topics (`tabular._data_browser` — menu1/menu2/source joined into the catalog; only 15 of 258 eligible tables lack a topic) with search across titles, topics, and sources; the variable picker is a searchable combobox (tables run to 80+ variables); dataset info shows Topic › Subtopic and Source. **Bug fixed:** zero-inflated variables (e.g. tract counts that are mostly 0) collapsed every quantile break, producing a single class rendered in the darkest ramp color and a legend showing only "0" — classification now falls back to equal-interval breaks when quantiles collapse, and a true single class renders as a mid-tone. Deferred by choice: embed mode and PNG export (assessed as worthwhile; embed is nearly free given URL state).

**"Share & Show" slice — July 18, 2026.** Portability before depth, so demos turn into other people's demos: embed mode (`?embed=1`, chromeless map + legend + credit chip; "Copy embed code" produces the iframe snippet), PNG export (map + title band + legend + attribution composited into a report-ready image), a per-dataset **"View on DataCommon"** deep link (via `_data_browser.seq_id` — the adoption bridge from §8's open question, now closed), and whole-table CSV download via the Export API. Explicitly deferred until colleague feedback steers Phase 3: table preview panel, block-group bins, year comparison, county/RPA geographies.

**Deviations and decisions made during the build:**

- **Cartographic honesty fixes found in testing:** numeric ID columns (Census GEOIDs) initially leaked into variable pickers — now excluded by the catalog script; diverging ramps initially used raw quantile breaks (a town growing +4% could render red) — the diverging ramp now pivots at 0, warm classes strictly negative.
- Margin-of-error columns are kept as selectable variables but skipped as defaults.
- Year values are treated as strings throughout (ACS vintages like `2019-23` coexist with calendar years); year columns detected per table (`acs_year` ×99, `years` ×21, `cal_year`, `fy`, etc. among eligible tables).
- Environment note: Vite 8's rolldown bundler hit a known npm optional-dependency bug on this machine; `@rolldown/binding-darwin-arm64` was manually extracted into `node_modules`.

## 10. Appendix: verified API call patterns

```text
# List tables
https://datacommon.mapc.org/api/?token=datacommon&database=ds&query=
  SELECT table_name FROM information_schema.tables WHERE table_schema='tabular'

# Table metadata (title, join_key, column aliases)
... &query=SELECT * FROM metadata.<table_name>

# Data for one year
... &query=SELECT * FROM tabular.hous_building_permits_m WHERE cal_year='2023'

# Boundaries (PostGIS available)
... &database=gisdata&query=SELECT muni_id, municipal,
  ST_AsGeoJSON(ST_Simplify(geom, <tolerance>)) FROM mapc.ma_municipalities

# User-facing export (Phase 2 whole-table download)
https://datacommon.mapc.org/api/export?token=datacommon&database=ds
  &schema=tabular&table=<t>&format=csv|json|geojson|shp&years=2023
```

---

## 11. Phase 2 specification (July 2026)

Adds census-tract tables and the frame/bin drill-down, scoped to the MAPC region as the largest frame.

### 11.1 Frame × bin matrix

Bin must nest strictly below the frame:

| Frame ↓ / Bin → | Subregion | Municipality | Census tract |
|---|---|---|---|
| MAPC Region | ✓ | ✓ (Phase 1 behavior) | ✓ |
| MAPC Subregion (pick one of 8) | — | ✓ | ✓ |
| Municipality (pick one of 101) | — | — | ✓ |

Frames "MAPC Subregion" and "Municipality" require an instance picker (which subregion / which municipality). URL scheme: `frame=mapc`, `frame=subreg:356`, `frame=muni:49`; `bin=muni|subreg|ct`.

### 11.2 Key data facts (verified against the API)

- **Subregion values are pre-computed rows in the `_m` tables themselves**: `muni_id` 352 = MAPC, 353 = Massachusetts, **355–362 = the eight subregions** (ICC, MAGIC, MWRC, NSPC, NSTF, SSC, SWAP, TRIC), 363–376 = counties, plus community types. No client-side aggregation — medians and rates are as valid as counts. Not every table carries these rows, so the catalog audits `hasSubregionRows` per table; tables without them can't use subregion bins.
- **134 `_ct` tables** exist. Join columns: `ct10_id` (129 tables), `ct20_id` (92), `geoid` with an ACS `14000US` prefix (104). **Vintage rule** (stated in DataCommon metadata): rows join to 2020 tracts when the year's end-vintage ≥ 2020, else to 2010 tracts. The app selects join column and boundary layer per selected year.
- **Tract → municipality assignment** via `tabular._datakeys_geog_xw_2020` / `_2010` (block-level crosswalks; distinct tract→muni pairs, primary muni by block count for tracts spanning towns). `_datakeys_muni_all` is the registry of all geography IDs (subregion ids/names/acronyms, county ids, RPA ids, MAPC membership flag).
- **Boundary sources** (gisdata): `census2010_tracts_poly` (keyed `ct10_id`), `census2020_tracts_poly` (keyed `GEOID`); subregion polygons dissolved at build time from the munis file's `subreg_id`.

### 11.3 Design decisions

- Table availability follows the bin: `_m` tables for municipality/subregion bins (subregion additionally requires `hasSubregionRows`); `_ct` tables for tract bins.
- **Sibling auto-swap**: many datasets exist as both `_m` and `_ct` (same base name). Switching bins swaps to the sibling table when one exists instead of clearing the selection.
- Tracts spanning municipal lines are assigned to their primary (most-blocks) municipality for frame filtering; tooltips and rankings show "Tract NNNN.NN · Muni".
- Classification stays frame-scoped (breaks computed on visible units only). Rankings, tooltip, URL state, and current-view GeoJSON download all generalize across bins unchanged.
- Deferred beyond Phase 2: counties/RPA/state frames-bins (data exists at muni_ids 353, 363–376 — cheap later), block groups/blocks, whole-table download, table preview panel.

### 11.4 Milestones

1. **Boundary + crosswalk prep** — tract layers both vintages clipped to MAPC and simplified, stamped with primary `muni_id`/`subreg_id` from the crosswalks; subregions dissolved from munis.
2. **Catalog v2** — audit extended to `_ct` tables (join columns, vintage support, cardinality per tract-year); `hasSubregionRows` per `_m` table; sibling pairs recorded.
3. **Frame/bin state machine** — unlocked selects + instance pickers, matrix enforcement, extended URL state, per-frame map fitting.
4. **Tract + subregion rendering** — vintage-aware joins, generalized tooltips/rankings labels, download metadata.
5. **Verify + ship** — browser pass across frame/bin/vintage combinations; build log updated.
