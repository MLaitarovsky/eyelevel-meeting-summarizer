# Meeting Summarizer

Upload an audio recording of a meeting (mp3/wav). Get back a transcript, a summary, participants, decisions, and action items. Optional Word export.

> Take-home for Eye Level AI. See `CLAUDE.md` for scope and `AGENTS.md` for the working agreement.

## Quick start

```bash
# 1. Backend
cd backend
cp .env.example .env   # fill in OPENAI_API_KEY and ANTHROPIC_API_KEY
uv sync
uv run uvicorn app.main:app --reload --port 8000

# 2. Frontend (new shell)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Environment

| Variable            | Where        | Purpose                              |
|---------------------|--------------|--------------------------------------|
| `OPENAI_API_KEY`    | `backend/.env` | Whisper transcription                |
| `ANTHROPIC_API_KEY` | `backend/.env` | Claude analysis                      |

## Layout

```
backend/   FastAPI app — transcription, analysis, Word export
frontend/  Vite + React + Tailwind UI
```

## Docs

- `CLAUDE.md` — scope, tech decisions, what NOT to add
- `AGENTS.md` — working agreement for AI agents
- `PROCESS.md` — how this was built
- `SYSTEM_PROMPT.md` — the analyst prompt, kept in sync with `backend/app/prompts.py`
