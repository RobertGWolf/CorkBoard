# CorkBoard

A single-user digital corkboard for pinning, arranging, and connecting text notes on a freeform canvas.

## Features

- Create and arrange cards on a freeform 2D canvas
- Drag, resize, and color-code cards
- Connect cards with bezier curves
- Pan and zoom the board
- Multiple boards with switching
- Keyboard shortcuts for fast workflows
- Optimistic UI with server persistence

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, TypeScript, Vite, Tailwind CSS |
| Drag & Drop | @dnd-kit/core |
| State | Zustand (UI), React Query (server sync) |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Database | SQLite (dev) / PostgreSQL (prod), SQLAlchemy |
| Migrations | Alembic |

## Prerequisites

- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda
- [Node.js](https://nodejs.org/) 18+

## Quick Start (Windows)

```bat
install.bat
run.bat
```

Then open **http://localhost:5173** in your browser.

## Manual Setup

### Backend

```bash
cd backend
conda create -n corkboard python=3.11 -y
conda activate corkboard
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000` with interactive docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI runs at `http://localhost:5173` and proxies `/api` requests to the backend.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Double-click (empty space) | Create new card |
| Click card | Select card |
| Double-click card | Edit card text |
| Right-click card/connection | Color picker |
| Delete / Backspace | Delete selected card or connection |
| C | Toggle connect mode |
| Escape | Exit connect mode / deselect |
| Mouse wheel | Zoom in/out |
| Click + drag (empty space) | Pan the board |

## Project Structure

```
CorkBoard/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB engine and session
│   │   └── routes/          # API endpoints
│   ├── alembic/             # Database migrations
│   └── tests/               # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── api/             # API client
│   └── package.json
├── install.bat              # One-click install (conda)
├── run.bat                  # Start both servers
└── SPEC.md                  # Full specification
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/{id}` | Get board with cards and connections |
| PATCH | `/api/boards/{id}` | Rename a board |
| DELETE | `/api/boards/{id}` | Delete a board (cascades) |
| POST | `/api/boards/{id}/cards` | Create a card |
| PATCH | `/api/cards/{id}` | Update a card |
| DELETE | `/api/cards/{id}` | Delete a card (cascades connections) |
| POST | `/api/boards/{id}/connections` | Create a connection |
| PATCH | `/api/connections/{id}` | Update a connection |
| DELETE | `/api/connections/{id}` | Delete a connection |

## Development

```bash
# Run backend tests
cd backend
pytest tests/ -x

# Lint frontend
cd frontend
npm run lint

# Typecheck frontend
cd frontend
npx tsc --noEmit

# Build frontend for production
cd frontend
npm run build
```

## License

Private project.
