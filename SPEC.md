# Corkboard — Product Specification

## Overview

Corkboard is a single-user digital corkboard web app for pinning, arranging, and connecting text notes on a freeform canvas. Think sticky notes on a real corkboard — drag them anywhere, resize them, color-code them, and optionally draw string connections between them.

**Target user**: An individual organizing thoughts, plans, research, or brainstorming — not a team tool.

**Core philosophy**: Fast, tactile, zero-friction. Creating a note should take one click. Moving it should feel instant. The board should stay out of the way and let the user think spatially.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, TypeScript, Vite, Tailwind CSS |
| Drag & Resize | @dnd-kit/core for drag; custom resize handles |
| Connections | SVG overlay layer rendered on `<canvas>` or inline SVG |
| State | Zustand (board/card state), React Query (server sync) |
| Backend | Python 3.11+, FastAPI |
| Database | SQLite (dev), PostgreSQL (prod), SQLAlchemy ORM |
| Migrations | Alembic |

---

## Data Model

### Board

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | User-facing board title |
| created_at | datetime | |
| updated_at | datetime | |

### Card

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| board_id | UUID | FK → Board |
| content | text | Markdown or plain text body |
| x | float | Horizontal position, 0–100 (% of board width) |
| y | float | Vertical position, 0–100 (% of board height) |
| width | float | Card width, percentage-based, min 10, max 50 |
| height | float | Card height, percentage-based, min 5, max 50 |
| color | string | Hex color code, default `#FEF3C7` (warm yellow) |
| z_index | int | Stacking order, higher = on top |
| created_at | datetime | |
| updated_at | datetime | |

### Connection

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| board_id | UUID | FK → Board |
| from_card_id | UUID | FK → Card |
| to_card_id | UUID | FK → Card |
| color | string | Hex color, default `#92400E` (cork brown) |

**Constraints**:
- A card belongs to exactly one board.
- A connection links two distinct cards on the same board.
- Deleting a card cascades to delete its connections.

---

## Features — Priority Order

### P0: Free-form Drag & Position

This is the core interaction. It must feel instant and fluid.

**Behavior**:
- Cards are absolutely positioned on the board canvas.
- User clicks and drags a card to move it anywhere on the board.
- Position updates optimistically in the UI on every drag frame.
- On drag-end, the final position is persisted via a single PATCH request.
- Dragging a card brings it to the top of the z-index stack.

**Snapping**:
- Snap-to-grid is togglable via a toolbar button or holding Shift during drag.
- Grid size default: 20px equivalent (configurable in settings: 10, 20, 40).
- Grid is invisible by default. When snap is active, a subtle dot grid renders on the board background.
- Additionally, cards snap to alignment guides when their edges or centers come within 8px of another card's edge or center (smart guides). A thin colored line flashes to show the alignment.
- Smart guides work independently of grid snap — both can be active simultaneously.
- Snap behavior: card position rounds to nearest grid point on drag-end (not during drag, to keep movement fluid). Smart guides apply a magnetic pull during drag when within threshold.
- Board canvas should be pannable (click-drag on empty space) and zoomable (scroll wheel or pinch) for large arrangements.

**Coordinate system**:
- All positions stored as percentages (0–100) relative to a virtual board area.
- The virtual board area is larger than the viewport (e.g. 3000×3000 virtual units) to allow sprawling layouts.
- Viewport panning moves the visible window over this virtual area.

**Acceptance criteria**:
- Drag latency under 16ms (single frame) on a board with 100 cards.
- Card position survives page refresh.
- No jank or flicker during drag.
- Grid dots render only when snap is active and do not impact drag performance.
- Smart guides appear and disappear instantly during drag with no lingering artifacts.

### P1: Resizable Cards

**Behavior**:
- Each card has a drag handle in the bottom-right corner.
- User drags the handle to resize width and/or height.
- Minimum size: 120×80px equivalent. Maximum size: 50% of board in either dimension.
- Resize is persisted on release, same pattern as drag (optimistic + PATCH).
- Card content reflows as size changes (text wraps, scrollbar appears if content overflows).

**Acceptance criteria**:
- Resize handle is discoverable (visible on hover, always visible on touch).
- Resize does not conflict with drag — handle area resizes, card body area drags.
- Content remains readable at minimum size.

### P2: Color Coding / Labels

**Behavior**:
- Each card has a background color.
- Right-click (or a small menu icon) opens a color picker with 8 preset colors plus a custom hex input.
- Preset palette: warm yellow (#FEF3C7), light blue (#DBEAFE), light green (#D1FAE5), light pink (#FCE7F3), light purple (#EDE9FE), light orange (#FFEDD5), light red (#FEE2E2), white (#FFFFFF).
- Color change is persisted immediately.
- Optional future enhancement: named labels/tags that map to colors.

**Acceptance criteria**:
- Color change is visible immediately with no flash or rerender artifact.
- Color picker closes on selection or outside click.
- Default color for new cards is warm yellow.

### P3: String Connections Between Cards

**Behavior**:
- User enters "connect mode" via a toolbar toggle or keyboard shortcut (e.g. `C`).
- In connect mode, user clicks a source card, then clicks a target card to create a connection.
- Connections render as curved lines (quadratic bezier) between the nearest edges of the two cards.
- Connections update position live as either card is dragged.
- Connections have a default color (cork brown) but can be changed via right-click.
- User can delete a connection by clicking on it (highlight on hover) and pressing Delete/Backspace.
- Exiting connect mode returns to normal drag behavior.

**Rendering**:
- Connections are drawn on an SVG layer positioned behind cards but above the board background.
- Line endpoints attach to the nearest edge midpoint of each card, recalculated on every frame during drag.

**Acceptance criteria**:
- Connections follow cards smoothly during drag with no visible lag.
- Cannot connect a card to itself.
- Duplicate connections between the same pair are prevented.
- Deleting a card removes all its connections.

---

## Board & Card Management

### Creating Cards
- Double-click on empty board space creates a new card at that position.
- New cards get default size (200×150px equivalent), default color, and empty content with cursor focused for immediate typing.
- Toolbar also has an "Add Card" button that places a card at the center of the current viewport.

### Editing Cards
- Single click on a card selects it (shows selection border).
- Double-click on a card enters edit mode (content becomes editable).
- Clicking outside or pressing Escape exits edit mode and saves.
- Content is plain text with basic markdown rendering (bold, italic, bullet lists).

### Deleting Cards
- Select a card and press Delete/Backspace.
- Or right-click → Delete.
- Confirmation dialog for cards with content (skip for empty cards).

### Board Management
- Sidebar or top-level navigation lists all boards.
- User can create, rename, and delete boards.
- Deleting a board requires confirmation and cascades to all cards and connections.
- Last-used board loads on app start.

---

## API Endpoints

### Boards
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/boards | List all boards |
| POST | /api/boards | Create a board |
| GET | /api/boards/:id | Get board with all cards and connections |
| PATCH | /api/boards/:id | Rename a board |
| DELETE | /api/boards/:id | Delete board (cascades) |

### Cards
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/boards/:id/cards | Create a card |
| PATCH | /api/cards/:id | Update card (position, size, content, color) |
| DELETE | /api/cards/:id | Delete card (cascades connections) |
| PATCH | /api/cards/batch | Batch update positions (for future multi-select drag) |

### Connections
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/boards/:id/connections | Create a connection |
| PATCH | /api/connections/:id | Update connection (color) |
| DELETE | /api/connections/:id | Delete a connection |

All endpoints return JSON. Errors use standard HTTP codes with `{ "detail": "..." }` bodies.

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  [Board Name ▼]     [+ Add Card] [🔗 Connect] [⚙]  │  ← Toolbar
├──────┬──────────────────────────────────────────┤
│      │                                          │
│  B   │          Board Canvas                    │
│  o   │                                          │
│  a   │    ┌──────────┐    ┌──────────┐          │
│  r   │    │  Card A   │    │  Card B   │         │
│  d   │    │           │────│           │         │  ← Connection
│  s   │    │           │    │           │         │
│      │    └──────────┘    └──────────┘          │
│  L   │                                          │
│  i   │              ┌──────────┐                │
│  s   │              │  Card C   │                │
│  t   │              │        ◢  │ ← Resize      │
│      │              └──────────┘                │
├──────┴──────────────────────────────────────────┤
│  Zoom: [−] ━━━●━━━ [+]        Cards: 3          │  ← Status bar
└─────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Double-click empty space | Create card at cursor |
| Delete / Backspace | Delete selected card |
| Escape | Deselect / exit edit mode / exit connect mode |
| G | Toggle snap-to-grid |
| Shift+drag | Temporarily enable snap during drag |
| C | Toggle connect mode |
| Ctrl+Z | Undo last action |
| Ctrl+Shift+Z | Redo |
| Ctrl+A | Select all cards |
| +/− or scroll | Zoom in/out |
| Space+drag | Pan board |

---

## Non-Functional Requirements

- **Performance**: Smooth 60fps drag/resize with up to 200 cards and 100 connections on screen.
- **Persistence**: All state survives refresh. Debounce writes — no more than 1 API call per interaction (drag-end, resize-end, blur).
- **Responsiveness**: Usable on desktop (primary target) and tablet. Not a mobile-first app, but should not break on smaller screens.
- **Accessibility**: Cards are focusable and navigable via Tab. Keyboard shortcuts for all core actions. Sufficient color contrast for card text on all preset backgrounds.
- **Undo/Redo**: Local undo stack for the current session (position moves, content edits, deletes, connection changes). Does not need to persist across sessions.

---

## Out of Scope (v1)

These are explicitly excluded from the initial build:

- Multi-user / collaboration / sharing
- Image, file, or link cards (text only for v1)
- Import/export (JSON, PDF, image export)
- Board templates or card templates
- Search / filter across cards
- Mobile-native app
- Offline mode / service worker
- Real-time sync (single user, single tab assumed)

Any of these can be revisited for v2 after the core experience is solid.

---

## Milestones

| # | Milestone | What's included |
|---|-----------|----------------|
| 1 | **Canvas & Cards** | Board canvas with pan/zoom. Create, drag, edit, delete text cards. Backend CRUD. |
| 2 | **Resize & Color** | Resize handles. Color picker with presets. Persist both. |
| 3 | **Connections** | Connect mode. SVG connection rendering. CRUD for connections. |
| 4 | **Polish** | Undo/redo. Keyboard shortcuts. Board management sidebar. Performance tuning. |
