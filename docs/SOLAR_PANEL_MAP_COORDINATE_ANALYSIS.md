# Solar panel ↔ map coordinate analysis

## Current architecture (before fix)

- **Basemap:** Google Maps via `DesignMapLayer` (`@react-google-maps/api`).
- **Design overlay:** HTML/SVG on top (`DesignCanvasOverlay`) draws roofs, panels, equipment.
- **World model:** Panel/roof positions are already **meters east (x) / north (y)** — not CSS pixels (schema ≥ 2).
- **Transforms:** `lib/design/coordinates.ts` (`worldToScreen` / `screenToWorld`) using Web Mercator `metersPerPixel`.

Convention:

| Axis | Meaning |
|------|---------|
| **+X** | East |
| **+Y** | North |
| Screen +Y | Down (world Y is inverted in projection) |

## Root cause of pan/zoom detach

World offsets were stored **relative to `doc.map.center`**, and the React camera was treated as that same center.

In **PAN** mode the overlay sets `pointer-events: none`, so Google Maps pans/zooms **internally**. `DesignMapLayer` only **pushed** `setCenter` / `setZoom` from React — it never read the map camera back.

Result:

1. Satellite imagery moved under the overlay.
2. Overlay kept projecting panels with the **stale** `doc.map.center` / `zoom`.
3. Panels looked “stuck” on the screen while the house moved — or jumped when React re-applied the old center.

Panel `x`/`y` were **not** rewritten by hand-pan; the bug was a **split camera** (Google vs document).

Secondary issue: treating **camera center = design origin** meant any future center sync without rebasing would slide the whole design in geographic space.

## New coordinate model

Separate:

1. **`map.origin`** — fixed ENU origin for all design world coordinates (usually the geocoded site / address point). **Does not move when panning.**
2. **`map.center` / `zoom` / `bearing` / `pitch`** — camera only.
3. **Panel `x`,`y`** — meters east/north of **`origin`** (authoritative). Screen pixels are render-only.

When `origin === center` (legacy docs), behavior matches the old model.

Projection:

```
camRelative = world − latLngToWorldOffset(origin, center)
screen = f(camRelative, zoom, viewport size)
```

Inverse for pointer → world uses the same origin.

## Map pan / zoom behavior (required)

| Action | Camera | Panel world `x,y` |
|--------|--------|-------------------|
| Pan map | Updates `center` from Google idle/drag | **Unchanged** |
| Zoom | Updates `zoom` | **Unchanged** |
| Drag panel | Unchanged (except edge auto-pan camera) | Updated via `screenToWorld` |
| Geocode address | Sets `origin` + `center`, house-level zoom | Unchanged (empty or relative to new origin) |

## Address / site marker

- Show project address in the header field.
- Geocode → fly camera → place **SITE_MARKER** at origin (geographic), separate from PV panels.
- Marker is adjustable; geocode quality may be street/parcel, not building centroid — UI must not claim otherwise.

## Duplication

Directional duplicate uses **world** spacing (`width/height + gap`), not screen pixels:

- RIGHT/EAST → +X  
- LEFT/WEST → −X  
- UP/NORTH → +Y  
- DOWN/SOUTH → −Y  

Collision + roof/setback checks before commit; never silent overlap.

## Files changed (implementation)

- `docs/SOLAR_PANEL_MAP_COORDINATE_ANALYSIS.md` (this file)
- `frontend/src/lib/design/coordinates.ts` — origin-aware transforms, geo helpers, directional offsets
- `frontend/src/lib/design/panel-layout.ts` — duplicate / free-position APIs
- `frontend/src/types/design.ts` — map origin/pitch, site marker type
- `frontend/src/lib/design/document.ts` — normalize origin, schema 10
- `frontend/src/components/design/studio/design-map-layer.tsx` — camera sync + marker
- `frontend/src/hooks/design/use-design-studio.ts` — viewport origin, geocode, duplicate commands
- Persist/API/schema version sync (FE + BE)
- Tests in `design-core.test.ts`

## SOMS green-sketch reference (`../soms/soms_front`)

Pylon adapts these SOMS patterns **without replacing the Google map stack**:

| SOMS | Pylon |
|------|-------|
| `useMapProjection` + `bounds_changed` re-project | `DesignMapLayer` idle/drag/zoom → `onMapCameraChange` updates `map.center`/`zoom` only |
| Lat/lng panel centres | World metres relative to fixed **`map.origin`** (ENU); screen via `worldToScreen` |
| `propertyMarker` + geocode | `site_marker` + `geocodeAddress` on address save |
| `addPanelInDirection` / SelectionControls | Actions menu Duplicate ←→↑↓ (`duplicatePanel*`) |
| Lock map while dragging panel | `mapPanEnabled = pan && !draggingPanel` |
| `preventOverlap` | `collideWithOthers` / `findNearestFreePosition` |

Do **not** store panel CSS pixels. Do **not** rewrite panel world coords on map pan.

