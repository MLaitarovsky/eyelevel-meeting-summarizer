# Meeting Summarizer

Upload an audio recording of a meeting (mp3 / wav / m4a / mp4 / webm). The app transcribes it with OpenAI Whisper, sends the transcript to Anthropic's Claude for structured analysis, and renders a summary, participants, decisions, action items, and open questions on screen — with an optional Word export. Hebrew, English, and mixed-language meetings are first-class.

> Take-home for Eye Level AI. Scope is intentionally tight (~5 hours). See `CLAUDE.md` for the architectural decisions and `PROCESS.md` for the build narrative.

## Run it locally

### Prerequisites

- Python **3.11+**
- Node **20+**
- [`uv`](https://docs.astral.sh/uv/) — Python package + venv manager
- An **OpenAI API key** (Whisper)
- An **Anthropic API key** (Claude Sonnet 4.6)

### Setup

```bash
git clone https://github.com/MLaitarovsky/eyelevel-meeting-summarizer.git
cd eyelevel-meeting-summarizer

# Backend env
cp backend/.env.example backend/.env
# then edit backend/.env and paste in your two API keys
```

### Run (two shells)

```bash
# Shell 1 — backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Shell 2 — frontend
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Drop an audio file. Wait ~10–40s. Read the cards. Click **Download as Word** to export.

## Architecture

```
  +------+  audio file   +-----------+   multipart   +-----------+
  | User | ------------> | Frontend  | ------------> |  Backend  |
  |      | <------------ | Vite/React| <------------ | FastAPI   |
  +------+  .docx file   +-----------+   JSON        +-----+-----+
                                                           |
                                          transcript (text)|
                                                           v
                                                  +-----------------+
                                                  | OpenAI Whisper  |  (audio -> text)
                                                  +-----------------+
                                                           |
                                                  transcript (text)
                                                           |
                                                           v
                                                  +-----------------+
                                                  | Anthropic Claude|  (text -> JSON)
                                                  +-----------------+
```

The whole pipeline is one synchronous request. State lives in the request lifecycle — there is no database, no queue, no auth, no file history. The frontend renders the structured JSON; the Word export renders the same structure. Nothing parses prose. See `CLAUDE.md` for why.

## Tech stack

**Backend** — Python 3.11, FastAPI, Pydantic v2, OpenAI SDK (Whisper `whisper-1`), Anthropic SDK (`claude-sonnet-4-6`), python-docx, uv.

**Frontend** — React 18, TypeScript (strict), Vite, Tailwind CSS v3.

## Limits and known constraints

- **25 MB upload limit** — Whisper's hard cap. Validated client-side (with a friendly error) and server-side.
- **120-minute duration limit** — defensive guard for very low-bitrate audio that slips under the size limit.
- **No diarization** — Whisper doesn't reliably label speakers, so the prompt extracts speakers from conversational cues only and reports per-participant confidence.
- **Single-user, single-session** — uploads aren't persisted. Refresh the page and the result is gone.

## Deliverables

- `CLAUDE.md` — project context, tech decisions, scope guardrails
- `PROCESS.md` — how this was built: planning, AI usage, where I got stuck, time spent
- `SYSTEM_PROMPT.md` — the analyst prompt with full rationale (kept in sync with `backend/app/prompts.py`)

## License

[MIT](./LICENSE).
