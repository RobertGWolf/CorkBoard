# Project: Corkboard

A digital corkboard app with draggable, repositionable cards. React frontend with a Python backend API.

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Drag & Drop**: @dnd-kit/core (preferred) or react-beautiful-dnd
- **State**: Zustand for client state, React Query for server state
- **Backend**: Python 3.11+ / FastAPI
- **Database**: SQLite (dev) / PostgreSQL (prod) via SQLAlchemy
- **API**: REST with Pydantic models for validation

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── models.py          # SQLAlchemy models (Board, Card)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   ├── boards.py      # Board CRUD endpoints
│   │   │   └── cards.py       # Card CRUD + position updates
│   │   └── database.py        # DB engine and session
│   ├── tests/
│   ├── alembic/               # DB migrations
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.tsx       # Main corkboard canvas
│   │   │   ├── Card.tsx        # Individual draggable card
│   │   │   ├── CardEditor.tsx  # Card content editing
│   │   │   └── Toolbar.tsx     # Actions (add card, change board)
│   │   ├── hooks/
│   │   │   ├── useDrag.ts      # Drag interaction logic
│   │   │   └── useCards.ts     # Card CRUD via React Query
│   │   ├── stores/
│   │   │   └── boardStore.ts   # Zustand store for board state
│   │   ├── types/
│   │   │   └── index.ts        # Card, Board, Position types
│   │   ├── api/
│   │   │   └── client.ts       # API client (fetch wrapper)
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
└── CLAUDE.md
```

## Commands

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload          # Dev server on :8000
pytest tests/ -x                        # Run tests
pytest tests/ -x -k "test_name"         # Single test
alembic upgrade head                    # Run migrations

# Frontend
cd frontend
npm install
npm run dev                             # Dev server on :5173
npm run test                            # Vitest tests
npm run build                           # Production build
npm run lint                            # ESLint
npx tsc --noEmit                        # Typecheck
```

## Workflow

- Create a feature branch before changes
- After changes: run relevant tests, typecheck, lint
- Prefer single tests during development
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

## Architecture Notes

- Cards store `x, y` position (floats, percentage-based relative to board) and `z_index` for layering
- Drag produces optimistic UI updates — position is updated locally on drag-end, then PATCH'd to the API
- Board canvas uses CSS `position: relative`; cards use `position: absolute` with `transform: translate()`
- Card z-index is bumped to top on interaction (click or drag start)
- Backend returns card positions as part of the board GET response to avoid N+1 queries

## Important Rules

- NEVER commit `.env` files
- Card positions MUST be persisted as percentage-based coordinates, not pixels, so boards render correctly at any viewport size
- All card mutations go through React Query so cache stays in sync — never mutate Zustand store directly for server-owned data
- Drag events must be debounced/batched — do NOT fire a PATCH on every pixel of movement, only on drag-end

## Gotchas

- @dnd-kit sensors need a `distance` or `delay` activation constraint, otherwise clicks on card content trigger drags
- Card text editing and drag are competing interactions — the Card component must distinguish between click-to-edit and drag-to-move
- Z-index stacking can overflow if you just increment forever — periodically normalize z-index values
- SQLite doesn't enforce foreign keys by default — backend must set `PRAGMA foreign_keys = ON`

## Reference Docs

Read relevant docs before working on a topic:

- `agent_docs/drag_system.md` — Drag interaction design, coordinate system, and edge cases
- `agent_docs/api_spec.md` — Endpoint contracts and error handling conventions
- `agent_docs/testing.md` — Test fixtures, mocking patterns, and what to cover
