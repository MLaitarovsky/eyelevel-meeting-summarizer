# AGENTS.md

## Working agreement for AI agents on this repo

This file complements `CLAUDE.md`. Read both.

### Before making changes

1. Confirm the change fits the scope in `CLAUDE.md` § "What NOT to add".
2. If touching the system prompt in `backend/app/prompts.py`, also update `SYSTEM_PROMPT.md` so the deliverable stays in sync.
3. If adding a new env var, update `.env.example` and the README.

### Commit conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- One logical change per commit.

### Test before declaring done

- Backend changes: hit `/api/health` and one real `/api/process` with a fixture file.
- Frontend changes: load the page, do a real upload, verify download works.

### Common commands

```bash
# Backend
cd backend && uv run uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Backend test
cd backend && uv run pytest -q
```

### Out of scope (do not touch unless asked)

- CI/CD pipelines
- Dockerization
- Production deployment configs (we ship a local-run README)
