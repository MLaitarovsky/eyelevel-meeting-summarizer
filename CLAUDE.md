# CLAUDE.md

## Project

Meeting transcription and summarization system. User uploads an audio file (mp3/wav), gets back a transcript, summary, participants, decisions, and action items. Optional Word export.

Built as a take-home assignment for Eye Level AI. Scope is intentionally tight (~5 hours).

## Tech stack

- **Backend:** Python 3.11+, FastAPI, Pydantic v2, OpenAI SDK (Whisper), Anthropic SDK (Claude Sonnet 4.6), python-docx
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS
- **No database, no queue, no auth.** Single-process, stateless.

## Architecture decisions (do not relitigate)

- Synchronous request/response is fine for MVP. If we add streaming, use SSE not WebSockets.
- LLM output MUST be structured JSON validated by Pydantic. Never parse free-form prose from Claude.
- The system prompt lives in `backend/app/prompts.py` as a constant. Do not inline prompt text elsewhere.
- Whisper has a 25MB upload limit. Validate on the backend; surface a clear error to the frontend.
- Hebrew and English are both first-class. The model decides the response language based on the transcript.

## Code style

- Python: type hints everywhere, Pydantic models for any structured data, ruff defaults.
- TS: strict mode on, no `any`, prefer function components with hooks.
- No premature abstraction. If a function is used once, inline it.
- Comments explain _why_, not _what_. The code shows what.

## What NOT to add

- Authentication / users / sessions
- A database (Postgres, SQLite, anything)
- Background job queues (Celery, BullMQ)
- File history / multi-file management
- Theming, dark mode, i18n framework
- Tests beyond one smoke test on the analysis pipeline

## Running locally

- Backend: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev` (proxies /api to :8000)
- Env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` in `backend/.env`

## When in doubt

Ask before adding a dependency. Ask before adding a new file. Default to minimal.
