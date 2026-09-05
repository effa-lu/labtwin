# LabTwin

Data-first spatial twin for labs — turn a floor plan into a searchable, maintainable spatial index of a lab in the browser. No BIM software, no mesh files: the database stores polygons, transforms and parameters; 3D is derived at runtime.

## Quick start

```bash
npm install          # Node ≥ 20
npm run dev          # http://localhost:5173
```

You will see a demo room with 10 placed entities. Click one in the scene or in the right-hand list; drag it in the top view; pick a component on the left and click the floor to place it; `R` rotates, `Delete` removes, `Ctrl+Z` undoes. The **Library** tab shows every component at its default size for reviewing shapes, colours and icons.

No database is needed for the demo. When you are ready to connect Supabase:

```bash
cp .env.example .env # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint (includes the "only `src/api/` may import Supabase" rule) |
| `npm run typecheck` | `tsc -b` only |
| `npm test` | Vitest unit tests (geometry pure functions, api layer with mocked client) |
| `npm run e2e` | Playwright end-to-end (builds, serves, drives a real Chromium). First run: `npx playwright install chromium` |

## Layout

```
src/
  api/              # The ONLY place that touches Supabase. Domain functions + domain types.
  store/            # zustand: auth, workspace, editor (UI state only)
  features/
    plan/           # Plan Studio (2D): upload, calibrate, trace rooms, doors      — not started
    space/
      geometry/     # Pure math: coords, polygon, walls, entity boxes. Unit-tested. No three.js.
      scene/        # R3F: Room, EntityMesh, Floor (placement ghost + drag), Cameras
      components/   # registry.ts (8 parametric presets + custom GLB presets), meshes/, CustomModel
      commands/     # do/undo commands + history — the only way scene data changes
      Palette.tsx   # left panel (component library)
      InspectorPanel.tsx  # right panel (selected record + entity list)
      demo.ts       # Hard-coded Space + Entities standing in for the database
    library/        # Showroom view of every preset
    viewer/         # Search / navigate                                            — not started
    inventory/      # Items, CSV import                                            — not started
  store/            # zustand: auth, workspace, editor (UI state), entities (scene data)
  ui/primitives.tsx # Button, Field, Swatch… all read tokens
  i18n/             # zh.json, en.json — all copy goes through t()
  theme/tokens.ts   # Design tokens — colours, spacing, fonts (Effa owns this)
  theme/icons.ts    # lucide icon set
public/models/      # Custom .glb models (see docs/models.md)
e2e/                # Playwright specs; screenshots land in e2e/__screenshots__/
supabase/           # SQL migrations + Edge Functions                              — not started
docs/               # Plans, schema, component table, lab data
```

## Conventions that matter

- **Metres everywhere.** Pixels exist only inside the Plan Studio canvas.
- **Plan coords** (x right, y down, origin top-left) map to **world** (x, elevation, +z). See `src/features/space/geometry/coords.ts` for why.
- **`code` (Location ID)** like `CAB-01` / `CAB-01-S2` is the primary key across 2D, 3D, QR and the database. Never edited, never reused.
- **Walls:** one box per polygon edge, 0.15 m thick. Doors: left + lintel + right. No CSG.
- **Feature code never imports Supabase.** ESLint enforces it; call `api.*` from `@/api`.
- **Scene data changes only through commands** (`features/space/commands`), so everything is undoable and, later, persisted + logged in one place.
- **Two kinds of component:** parametric (drawn in code from dims + params) and custom GLB (hand-made low-poly, auto-fitted to dims). Adding a GLB = one file + one registry line — `docs/models.md`.

Full context for AI-assisted work: `CLAUDE.md`.
