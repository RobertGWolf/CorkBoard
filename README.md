# CorkBoard

A single-user digital corkboard for pinning, arranging, and connecting text notes on a freeform canvas. Drag cards anywhere, resize them, color-code them, and draw string connections between them.

## Features

- **Freeform canvas** — pan, zoom, and arrange cards anywhere on a large virtual board
- **Drag & drop** — fluid card movement with optional snap-to-grid and smart alignment guides
- **Resizable cards** — drag the corner handle to resize; content reflows automatically
- **Color coding** — 8 preset background colors plus custom hex input
- **Connections** — draw curved lines between cards to show relationships
- **Keyboard shortcuts** — `G` toggle grid, `C` connect mode, `Ctrl+Z` undo, and more
- **Multiple boards** — create, rename, and switch between boards

## Prerequisites

- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/download)

Conda is used to provision both Python 3.11 and Node.js 20 in a single environment.

## Quick Start (Windows)

```
install.bat          # Create conda env, install all dependencies
run.bat              # Start backend + frontend dev servers
```

After running `run.bat`:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173         |
| Backend  | http://localhost:8000         |
| API docs | http://localhost:8000/docs    |

Close the spawned terminal windows to stop the servers.

## Manual Setup

### Backend

```bash
cd backend
conda create -n corkboard python=3.11 -y
conda activate corkboard
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload          # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

## Development Commands

```bash
# Backend
cd backend
pytest tests/ -x                       # Run tests
pytest tests/ -x -k "test_name"        # Single test
alembic upgrade head                   # Run migrations

# Frontend
cd frontend
npm run test                           # Vitest
npm run build                          # Production build
npm run lint                           # ESLint
npx tsc --noEmit                       # Type check
```

## Tech Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS |
| Drag & Resize  | @dnd-kit/core, custom resize handles     |
| Connections    | SVG overlay with bezier curves           |
| State          | Zustand (UI), React Query (server sync)  |
| Backend        | Python 3.11, FastAPI, Pydantic           |
| Database       | SQLite (dev) / PostgreSQL (prod)         |
| ORM/Migrations | SQLAlchemy, Alembic                      |

## Keyboard Shortcuts

| Key                    | Action                          |
|------------------------|---------------------------------|
| Double-click empty area| Create card at cursor           |
| Delete / Backspace     | Delete selected card            |
| Escape                 | Deselect / exit edit / connect  |
| G                      | Toggle snap-to-grid             |
| Shift + drag           | Temporary snap during drag      |
| C                      | Toggle connect mode             |
| Ctrl+Z                 | Undo                            |
| Ctrl+Shift+Z           | Redo                            |
| +/- or scroll          | Zoom in/out                     |
| Space + drag           | Pan board                       |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routes/            # API route handlers
│   │   └── database.py        # DB engine and session
│   ├── tests/
│   ├── alembic/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── api/               # API client
│   │   └── App.tsx
│   └── package.json
├── install.bat                # Windows setup script (conda)
├── run.bat                    # Windows launch script
└── SPEC.md                    # Full product specification
```

## License

Private project. All rights reserved.
