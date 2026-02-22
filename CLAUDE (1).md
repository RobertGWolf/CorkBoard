# Project: [Your Project Name]

[One-line description of what this project does and who it's for.]

## Tech Stack

- **Backend**: Python 3.11+ / [FastAPI | Flask | Django]
- **Frontend**: JavaScript/TypeScript / [React | Vue | Node.js]
- **Database**: [PostgreSQL | SQLite | etc.]
- **Package management**: pip (with pyproject.toml) for Python, npm/pnpm for JS

## Project Structure

```
├── src/                  # Python backend
│   ├── api/              # API routes/endpoints
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── utils/            # Shared utilities
├── frontend/             # JavaScript frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Frontend utilities
│   └── package.json
├── tests/
│   ├── python/           # pytest tests
│   └── js/               # Jest/Vitest tests
├── pyproject.toml
└── CLAUDE.md
```

## Commands

```bash
# Python
pip install -e ".[dev]"         # Install with dev dependencies
pytest tests/python/            # Run Python tests
pytest tests/python/ -x -k "test_name"  # Run single test
python -m myapp                 # Run the application

# JavaScript
cd frontend && npm install      # Install JS deps
npm run dev                     # Dev server
npm run test                    # Run JS tests
npm run build                   # Production build
npm run lint                    # Lint JS code
```

## Workflow

- Create a feature branch before making changes
- After code changes: run the relevant test suite, typecheck, and lint
- Prefer running single tests over the full suite during development
- Commit with conventional commit messages: `feat:`, `fix:`, `refactor:`, `docs:`

## Architecture Notes

- [Describe key architectural decisions here, e.g.:]
- Python backend serves a REST API; frontend is a separate SPA
- Auth is handled via [JWT tokens / sessions / etc.] — see `agent_docs/auth.md` for details
- [Describe inter-service communication, shared types, etc.]

## Important Rules

- NEVER commit `.env` files or secrets
- NEVER modify `migrations/` files by hand — use the migration tool
- Python code must pass `mypy --strict` before committing
- [Add your project-specific hard rules here]

## Gotchas

- [Document non-obvious things that cause bugs, e.g.:]
- The `/api/webhook` endpoint has custom retry logic — don't refactor without reading `agent_docs/webhooks.md`
- Frontend API client is auto-generated from OpenAPI spec — edit the spec, not the client
- [Add your own project-specific gotchas]

## Reference Docs

For detailed context on specific topics, read the relevant file before starting work:

- `agent_docs/architecture.md` — System design and data flow
- `agent_docs/testing.md` — Testing conventions and fixtures
- `agent_docs/deployment.md` — CI/CD and deployment process
