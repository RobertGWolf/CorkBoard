# Project: Corkboard

Single-user digital corkboard for pinning, arranging, and connecting text notes on a freeform canvas. See `SPEC.md` for full product specification.

## Tech Stack

- **Frontend**: React 18+ / TypeScript / Vite / Tailwind CSS
- **Drag & Resize**: @dnd-kit/core for drag; custom resize handles
- **Connections**: SVG overlay layer (inline SVG, positioned behind cards, above board background)
- **State**: Zustand for board/UI state, React Query for server sync
- **Backend**: Python 3.11+ / FastAPI / Pydantic
- **Database**: SQLite (dev) / PostgreSQL (prod) / SQLAlchemy ORM
- **Migrations**: Alembic

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry, CORS, PRAGMA foreign_keys
│   │   ├── models.py            # SQLAlchemy: Board, Card, Connection
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   ├── boards.py        # Board CRUD
│   │   │   ├── cards.py         # Card CRUD + position/size PATCH + batch
│   │   │   └── connections.py   # Connection CRUD
│   │   └── database.py          # Engine, session, FK pragma
│   ├── tests/
│   ├── alembic/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.tsx         # Canvas with pan/zoom, dot grid, SVG connection layer
│   │   │   ├── Card.tsx          # Draggable, resizable card with color
│   │   │   ├── CardEditor.tsx    # Inline text editing (markdown-lite)
│   │   │   ├── ResizeHandle.tsx  # Bottom-right resize grip
│   │   │   ├── ConnectionLine.tsx # Single SVG bezier between two cards
│   │   │   ├── ConnectionLayer.tsx # SVG overlay rendering all connections
│   │   │   ├── SmartGuides.tsx   # Alignment guide lines during drag
│   │   │   └── Toolbar.tsx       # Add card, connect mode, snap toggle, board switcher
│   │   ├── hooks/
│   │   │   ├── useDrag.ts        # Drag logic with snap support
│   │   │   ├── useResize.ts      # Resize handle logic
│   │   │   ├── useSnap.ts        # Grid snap + smart guide calculations
│   │   │   ├── useCards.ts       # Card CRUD via React Query
│   │   │   ├── useConnections.ts # Connection CRUD via React Query
│   │   │   └── useUndoRedo.ts    # Session-local undo stack
│   │   ├── stores/
│   │   │   └── boardStore.ts     # Zustand: viewport, zoom, snap mode, connect mode, selection
│   │   ├── types/
│   │   │   └── index.ts          # Card, Board, Connection, Position types
│   │   ├── api/
│   │   │   └── client.ts         # Fetch wrapper for /api/*
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── CLAUDE.md
└── SPEC.md
```

## Commands

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload          # Dev server :8000
pytest tests/ -x                        # Run tests
pytest tests/ -x -k "test_name"         # Single test
alembic upgrade head                    # Migrations

# Frontend
cd frontend
npm install
npm run dev                             # Dev server :5173
npm run test                            # Vitest
npm run build                           # Prod build
npm run lint                            # ESLint
npx tsc --noEmit                        # Typecheck
```

## Workflow

- Feature branch before changes
- After changes: run relevant tests, typecheck, lint
- Prefer single tests during development
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

## Architecture Notes

- **Coordinate system**: Virtual board is 3000×3000 units. Card x/y stored as percentage floats (0–100). All positions are percentage-based so boards render at any viewport size.
- **Rendering layers** (bottom to top): board background → dot grid (when snap active) → SVG connection layer → cards → smart guide overlays
- **Drag**: Optimistic UI update on every frame; single PATCH to API on drag-end only
- **Resize**: Custom handle in bottom-right corner of card. Same optimistic + PATCH-on-release pattern as drag. Min size 120×80px, max 50% board.
- **Snap**: Two independent systems — grid snap (rounds position on drag-end, toggled via G key or Shift+drag) and smart guides (magnetic pull within 8px of other card edges/centers, active during drag)
- **Connections**: SVG bezier curves between nearest edge midpoints of two cards. Recalculated every frame during drag. Connect mode entered via C key or toolbar toggle.
- **Z-index**: Bumped to top on click/drag. IMPORTANT: periodically normalize z-index values to prevent overflow.
- **Board GET** returns all cards + connections in one response to avoid N+1

## Data Models

Three models: **Board**, **Card**, **Connection**. Card has `x, y, width, height` (floats), `color` (hex string, default `#FEF3C7`), `z_index` (int). Connection has `from_card_id`, `to_card_id`, `color` (default `#92400E`). Deleting a card cascades to its connections. See `SPEC.md` Data Model section for full schema.

## Important Rules

- NEVER commit `.env` files
- Card positions MUST be percentage-based, never pixels
- All server-owned data mutations go through React Query — never mutate Zustand directly for persisted state
- Do NOT fire PATCH on every drag/resize frame — only on drag-end / resize-end
- Connections MUST recalculate endpoints on every drag frame for smooth following
- Cannot connect a card to itself; duplicate connections between same pair are prevented
- SQLite: backend MUST set `PRAGMA foreign_keys = ON`

## Gotchas

- @dnd-kit sensors need `distance` or `delay` activation constraint — otherwise clicks trigger drags
- Card has three competing interactions: click-to-select, double-click-to-edit, drag-to-move. The Card component must cleanly distinguish all three.
- Resize handle area must NOT trigger card drag — pointer events are scoped to the handle
- Smart guides must clean up instantly when drag ends — stale guide lines are a common bug
- Connect mode must disable normal drag on cards — clicks in connect mode select source/target, not drag
- Z-index normalization: don't just increment forever, periodically compress values

## Reference Docs

Read the relevant doc before working on a feature area:

- `SPEC.md` — Full product specification, acceptance criteria, API contracts, keyboard shortcuts
- `agent_docs/drag_system.md` — Drag + snap interaction design, coordinate math, edge cases
- `agent_docs/connections.md` — SVG rendering, bezier math, endpoint calculation
- `agent_docs/api_spec.md` — Endpoint contracts, error handling, batch operations
- `agent_docs/testing.md` — Test fixtures, mocking patterns, coverage expectations
