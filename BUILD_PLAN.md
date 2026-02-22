# CorkBoard — Build Plan

This plan breaks the project into 4 milestones (matching SPEC.md) and further into discrete, implementable phases. Each phase produces a working increment that can be tested independently.

---

## Milestone 1: Canvas & Cards

The foundation — a usable board with draggable text cards and backend persistence.

### Phase 1.1 — Backend Scaffolding

**Goal**: Runnable FastAPI server with database models and full CRUD endpoints.

**Tasks**:
1. Initialize `backend/` project structure with `pyproject.toml` (FastAPI, SQLAlchemy, Alembic, uvicorn, pytest, httpx as dev deps).
2. Create `app/database.py` — SQLite engine, `SessionLocal` dependency, startup event that sets `PRAGMA foreign_keys = ON`.
3. Create `app/models.py` — SQLAlchemy models for `Board`, `Card`, `Connection` with UUID primary keys, relationships, and cascade deletes.
4. Create `app/schemas.py` — Pydantic v2 request/response schemas for all models (create, update, read).
5. Set up Alembic (`alembic init`, env.py wired to models, initial migration).
6. Create `app/routes/boards.py`:
   - `GET /api/boards` — list all boards.
   - `POST /api/boards` — create board.
   - `GET /api/boards/{id}` — get board with all cards and connections (single query, avoid N+1).
   - `PATCH /api/boards/{id}` — rename board.
   - `DELETE /api/boards/{id}` — delete with cascade.
7. Create `app/routes/cards.py`:
   - `POST /api/boards/{id}/cards` — create card on board.
   - `PATCH /api/cards/{id}` — update card (position, size, content, color — all optional fields).
   - `DELETE /api/cards/{id}` — delete card (cascade connections).
   - `PATCH /api/cards/batch` — batch position updates.
8. Create `app/routes/connections.py`:
   - `POST /api/boards/{id}/connections` — create connection (validate: same board, not self-referencing, no duplicates).
   - `PATCH /api/connections/{id}` — update connection color.
   - `DELETE /api/connections/{id}` — delete connection.
9. Create `app/main.py` — wire routers, CORS middleware (allow localhost:5173), startup/shutdown events.
10. Write backend tests:
    - Board CRUD lifecycle.
    - Card CRUD and position/size persistence.
    - Connection constraints (self-reference, duplicate prevention, cascade delete).
    - Batch card update.

**Deliverable**: `pytest tests/ -x` passes. Server starts and all endpoints return correct responses via httpx test client.

---

### Phase 1.2 — Frontend Scaffolding

**Goal**: React/Vite/TypeScript project with Tailwind, Zustand, React Query, and routing to a board view.

**Tasks**:
1. Initialize `frontend/` with Vite React-TS template.
2. Install dependencies: `tailwindcss`, `@dnd-kit/core`, `@dnd-kit/utilities`, `zustand`, `@tanstack/react-query`, `axios` or custom fetch wrapper.
3. Configure Tailwind (`tailwind.config.js`, base styles).
4. Create `src/types/index.ts` — TypeScript interfaces for `Board`, `Card`, `Connection`, `Position`, `Viewport`.
5. Create `src/api/client.ts` — fetch wrapper with base URL `/api`, JSON headers, error handling.
6. Create `src/stores/boardStore.ts` — Zustand store with:
   - `viewport` (x, y, zoom).
   - `snapEnabled`, `connectMode`, `selectedCardId`.
   - Actions: `setViewport`, `setZoom`, `toggleSnap`, `toggleConnectMode`, `selectCard`, `clearSelection`.
7. Create `src/App.tsx` — QueryClientProvider, basic layout shell, router placeholder.
8. Verify: `npm run dev` starts, `npm run build` succeeds, `npx tsc --noEmit` clean.

**Deliverable**: Empty app shell renders with Tailwind styling. Store is importable and functional.

---

### Phase 1.3 — Board Canvas with Pan & Zoom

**Goal**: Interactive canvas that can pan (click-drag empty space) and zoom (scroll wheel).

**Tasks**:
1. Create `src/components/Board.tsx`:
   - Full-viewport container with `overflow: hidden`.
   - Inner div representing the 3000×3000 virtual board, transformed via `translate` + `scale` from viewport state.
   - Board background: subtle warm off-white / cork texture via CSS.
2. Implement pan: `onPointerDown` on empty board space starts panning. Track delta, update `boardStore.viewport` on every frame. `onPointerUp` stops pan.
3. Implement zoom: `onWheel` adjusts `boardStore.zoom` (clamped 0.25–2.0). Zoom toward cursor position (adjust viewport x/y to keep cursor point stable).
4. Wire `Board.tsx` into `App.tsx`.

**Deliverable**: User can pan and zoom an empty canvas. Viewport state persists in Zustand during the session.

---

### Phase 1.4 — Card Rendering & CRUD Hooks

**Goal**: Cards render on the board at their stored positions. React Query hooks manage server sync.

**Tasks**:
1. Create `src/hooks/useCards.ts`:
   - `useCards(boardId)` — React Query `useQuery` fetching from `GET /api/boards/{id}` (returns cards + connections).
   - `useCreateCard()` — `useMutation` for `POST /api/boards/{id}/cards` with optimistic update.
   - `useUpdateCard()` — `useMutation` for `PATCH /api/cards/{id}` with optimistic update.
   - `useDeleteCard()` — `useMutation` for `DELETE /api/cards/{id}` with optimistic update.
2. Create `src/components/Card.tsx`:
   - Absolutely positioned using percentage-based `left`/`top`/`width`/`height` relative to the board container.
   - Displays `content` text, background `color`.
   - Visual states: default, selected (border highlight), editing.
   - Click to select, double-click to enter edit mode.
3. Create `src/components/CardEditor.tsx`:
   - Inline `<textarea>` or `contentEditable` div shown when card is in edit mode.
   - Auto-focus on enter. Save on blur or Escape. Basic markdown-lite rendering for display mode (bold, italic, bullets).
4. Render cards inside `Board.tsx` by mapping over query data.
5. Implement "Add Card" — double-click on empty board space creates card at cursor position. Toolbar button creates card at viewport center.
6. Implement delete — select card + Delete/Backspace key. Confirmation dialog for non-empty cards.

**Deliverable**: User can create, view, edit, and delete cards. Cards persist across refresh.

---

### Phase 1.5 — Drag System

**Goal**: Cards are draggable with optimistic UI and persist on drag-end.

**Tasks**:
1. Create `src/hooks/useDrag.ts`:
   - Uses `@dnd-kit/core` `DndContext`, `useDraggable` on each card.
   - Activation constraint: `distance: 5` to distinguish click from drag.
   - During drag: update card position in local state every frame (optimistic, no API call).
   - On drag-end: fire `useUpdateCard` mutation with final position.
   - Coordinate math: convert pixel deltas to percentage deltas based on board dimensions and current zoom level.
2. Integrate `DndContext` in `Board.tsx`.
3. Bring-to-front: on drag start (or click), set card `z_index` to `max(all z_indexes) + 1`. Persist via PATCH.
4. Z-index normalization utility: when any card's z_index exceeds a threshold (e.g., 10000), compress all cards' z_indexes to sequential values 1..N.
5. Ensure drag does NOT fire during edit mode.

**Deliverable**: Cards drag smoothly at 60fps. Position persists. Z-order works correctly.

---

### Phase 1.6 — Board Management

**Goal**: Multiple boards with a sidebar/switcher.

**Tasks**:
1. Create `src/hooks/useBoards.ts` — React Query hooks for board list, create, rename, delete.
2. Create board switcher in `src/components/Toolbar.tsx` — dropdown listing all boards, create-new option.
3. Implement board rename (inline edit in toolbar or sidebar).
4. Implement board delete with confirmation dialog (warns about cascade).
5. Last-used board: persist `lastBoardId` in `localStorage`, load it on app start.

**Deliverable**: User can manage multiple boards and switch between them.

---

## Milestone 2: Resize & Color

### Phase 2.1 — Resize Handles

**Goal**: Cards can be resized via a bottom-right corner handle.

**Tasks**:
1. Create `src/components/ResizeHandle.tsx`:
   - Positioned at bottom-right of card. Visible on hover, always visible on touch.
   - `onPointerDown` starts resize tracking. `pointer-events` scoped so it does NOT trigger card drag.
2. Create `src/hooks/useResize.ts`:
   - Track pointer delta from resize start.
   - Convert pixel delta to percentage based on board size and zoom.
   - Clamp: min width 10%, min height 5%, max 50% either dimension (as defined in SPEC).
   - Optimistic UI during resize. Single PATCH on pointer-up.
3. Integrate into `Card.tsx` — render `ResizeHandle` only when card is selected or hovered.
4. Card content reflows during resize (CSS handles this naturally with percentage widths).
5. Add scrollbar for content overflow at small sizes.

**Deliverable**: Cards resize smoothly. Constraints enforced. Persisted on release.

---

### Phase 2.2 — Color Picker

**Goal**: Cards have configurable background colors from a preset palette.

**Tasks**:
1. Create color picker component (floating popover):
   - 8 preset color swatches matching SPEC palette.
   - Custom hex input field.
   - Opens on right-click on card or via a small color indicator on the card.
2. On color selection: immediately PATCH card with new color. Optimistic update.
3. Close picker on selection, outside click, or Escape.
4. Default color for new cards: `#FEF3C7`.

**Deliverable**: Cards can be color-coded. Change is instant and persisted.

---

## Milestone 3: Connections

### Phase 3.1 — Connection SVG Layer

**Goal**: Render bezier curves between connected cards.

**Tasks**:
1. Create `src/components/ConnectionLayer.tsx`:
   - SVG element positioned behind cards, above board background.
   - SVG viewBox matches the virtual board coordinate space.
   - Renders one `<ConnectionLine>` per connection in the data.
2. Create `src/components/ConnectionLine.tsx`:
   - Calculate nearest edge midpoints between two card rects.
   - Render a quadratic bezier `<path>` between the two midpoints.
   - Stroke color from connection data. Stroke width ~2px.
   - Hover state: thicken line, show highlight for click target.
3. Connection endpoints recalculate on every render (driven by card position changes during drag).
4. Wire `ConnectionLayer` into `Board.tsx` at the correct z-layer.

**Deliverable**: Existing connections (if manually created via API) render as smooth curves that follow cards during drag.

---

### Phase 3.2 — Connect Mode & Connection CRUD

**Goal**: User can create and delete connections via connect mode.

**Tasks**:
1. Create `src/hooks/useConnections.ts`:
   - `useCreateConnection()` — mutation for `POST /api/boards/{id}/connections`.
   - `useDeleteConnection()` — mutation for `DELETE /api/connections/{id}`.
   - `useUpdateConnection()` — mutation for `PATCH /api/connections/{id}` (color).
2. Implement connect mode in `boardStore`:
   - Toggle via `C` key or toolbar button.
   - When active: card clicks select source, then target. On second click, create connection and exit (or stay in connect mode for chaining).
   - Visual feedback: selected source card gets a highlight, cursor changes.
   - Disable normal drag in connect mode.
3. Connection deletion:
   - Click on a connection line to select it.
   - Delete/Backspace to remove.
4. Connection color picker — same pattern as card color, triggered by right-click on a connection line.
5. Validation: prevent self-connections and duplicates (backend enforces, frontend also checks).

**Deliverable**: Full connection lifecycle — create, render, follow drag, change color, delete.

---

## Milestone 4: Polish

### Phase 4.1 — Snap System

**Goal**: Grid snap and smart alignment guides.

**Tasks**:
1. Create `src/hooks/useSnap.ts`:
   - Grid snap: on drag-end, round position to nearest grid point. Grid size configurable (10, 20, 40 px-equivalent).
   - Smart guides: during drag, compare dragged card edges/center to all other cards. If within 8px threshold, apply magnetic pull and show guide line.
2. Create `src/components/SmartGuides.tsx`:
   - Renders temporary horizontal/vertical lines at the alignment position.
   - Lines appear during drag, disappear instantly on drag-end.
3. Dot grid background: render when snap is active — subtle dots at each grid intersection via CSS or a tiled SVG pattern.
4. Toggle: `G` key toggles grid snap. `Shift+drag` temporarily enables snap for that drag. Both stored in `boardStore`.

**Deliverable**: Snap-to-grid and smart guide alignment work independently. Grid dots visible only when snap is active.

---

### Phase 4.2 — Undo/Redo

**Goal**: Session-local undo/redo stack for all mutations.

**Tasks**:
1. Create `src/hooks/useUndoRedo.ts`:
   - Maintains a stack of action records: `{ type, before, after }`.
   - Supports: card move, card resize, card content edit, card color change, card create, card delete, connection create, connection delete.
   - `undo()`: reverses the last action by applying `before` state (calls appropriate mutation).
   - `redo()`: re-applies `after` state.
   - Stack is session-local — cleared on refresh. Max depth: ~50 actions.
2. Wire `Ctrl+Z` / `Ctrl+Shift+Z` keyboard shortcuts.
3. Push action records from each mutation hook (drag-end, resize-end, content save, color change, create, delete).

**Deliverable**: User can undo/redo all actions within the current session.

---

### Phase 4.3 — Keyboard Shortcuts & Accessibility

**Goal**: Full keyboard support matching SPEC table.

**Tasks**:
1. Implement global keyboard listener (attached to `window`, respects focus):
   - `Delete/Backspace` — delete selected card or connection.
   - `Escape` — deselect, exit edit mode, exit connect mode.
   - `G` — toggle grid snap.
   - `C` — toggle connect mode.
   - `Ctrl+Z` / `Ctrl+Shift+Z` — undo/redo (from Phase 4.2).
   - `Ctrl+A` — select all cards.
   - `+/-` or scroll — zoom.
   - `Space+drag` — pan board.
2. Tab navigation: cards receive focus in DOM order (or z-index order). Focused card shows selection ring. Enter or Space to select, then double-tap to edit.
3. Ensure sufficient color contrast for card text on all 8 preset backgrounds (WCAG AA).

**Deliverable**: All SPEC keyboard shortcuts functional. Cards are keyboard-navigable.

---

### Phase 4.4 — Status Bar & Toolbar Completion

**Goal**: Full toolbar and status bar as shown in the SPEC UI layout.

**Tasks**:
1. Complete `src/components/Toolbar.tsx`:
   - Board name (editable inline) with board switcher dropdown.
   - "Add Card" button.
   - "Connect" toggle (highlights when connect mode active).
   - Snap toggle indicator.
   - Settings gear (grid size config).
2. Status bar at bottom:
   - Zoom slider with +/- buttons and numeric readout.
   - Card count for current board.

**Deliverable**: UI matches the SPEC wireframe layout.

---

### Phase 4.5 — Performance Tuning & Final Testing

**Goal**: Meet non-functional requirements. End-to-end test pass.

**Tasks**:
1. Performance testing:
   - Create test board with 200 cards and 100 connections.
   - Profile drag performance — ensure 60fps (16ms frame budget).
   - Identify and fix any render bottlenecks (memo, virtualization if needed).
2. Z-index normalization: verify compression triggers and works correctly.
3. Debounce audit: confirm no endpoint is called more than once per interaction.
4. Write/run comprehensive tests:
   - Backend: full endpoint coverage with edge cases.
   - Frontend: component tests with Vitest + Testing Library for Card, Board, ConnectionLine.
   - Integration: create board → add cards → drag → connect → delete flow.
5. Lint pass (`npm run lint`), typecheck pass (`npx tsc --noEmit`), build pass (`npm run build`).

**Deliverable**: All tests pass. Performance targets met. Clean build.

---

## Phase Dependency Graph

```
Phase 1.1 (Backend) ─────────────┐
                                  ├──→ Phase 1.4 (Card CRUD Hooks)
Phase 1.2 (Frontend Scaffold) ───┤
                                  ├──→ Phase 1.3 (Canvas Pan/Zoom)
                                  │         │
                                  │         ▼
                                  │    Phase 1.5 (Drag System)
                                  │         │
                                  │         ▼
                                  │    Phase 2.1 (Resize)
                                  │    Phase 2.2 (Color Picker)
                                  │         │
                                  │         ▼
                                  │    Phase 3.1 (Connection Layer)
                                  │         │
                                  │         ▼
                                  │    Phase 3.2 (Connect Mode)
                                  │
                                  ▼
                             Phase 1.6 (Board Management)

Phase 4.1 (Snap) ← depends on Phase 1.5 (Drag)
Phase 4.2 (Undo) ← depends on all mutation hooks
Phase 4.3 (Keyboard) ← depends on all features
Phase 4.4 (Toolbar) ← depends on all features
Phase 4.5 (Performance) ← final phase, depends on everything
```

## Implementation Order (Recommended)

| Order | Phase | Description |
|-------|-------|-------------|
| 1 | 1.1 | Backend scaffolding + all endpoints + tests |
| 2 | 1.2 | Frontend scaffolding (Vite, Tailwind, Zustand, React Query) |
| 3 | 1.3 | Board canvas with pan & zoom |
| 4 | 1.4 | Card rendering + CRUD hooks + create/edit/delete |
| 5 | 1.5 | Drag system with @dnd-kit |
| 6 | 1.6 | Board management + switcher |
| 7 | 2.1 | Resize handles |
| 8 | 2.2 | Color picker |
| 9 | 3.1 | SVG connection layer |
| 10 | 3.2 | Connect mode + connection CRUD |
| 11 | 4.1 | Snap-to-grid + smart guides |
| 12 | 4.2 | Undo/redo |
| 13 | 4.3 | Keyboard shortcuts + accessibility |
| 14 | 4.4 | Toolbar + status bar completion |
| 15 | 4.5 | Performance tuning + final test pass |

---

## Notes

- **Phases 1.1 and 1.2 can be built in parallel** since backend and frontend are independent at this stage.
- **Each phase should end with passing tests** for that phase's scope before moving on.
- **The backend is intentionally built first** (Phase 1.1) so the frontend can develop against real endpoints from Phase 1.4 onward.
- **Snap (Phase 4.1) is deferred to Milestone 4** rather than built alongside drag (Phase 1.5) to keep the drag system simple initially and layer complexity on top.
- **Undo/redo (Phase 4.2) depends on all mutation hooks being stable**, which is why it comes near the end.
