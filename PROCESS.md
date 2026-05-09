# Process

This document is one of the four required deliverables. It covers how I planned this build before writing code, how I used AI tooling during development, where I got stuck, and how long it actually took.

I wrote the _Planning_ section before opening an editor. The rest I drafted during the build and edited after I shipped.

---

## Planning (before code)

I read the assignment twice and identified what's actually being graded: system prompt quality, AI workflow judgment, and scoping discipline. The technical scope (Whisper + Claude + React + FastAPI + Word export) is straightforward — what's hard is making the right decisions inside it within five hours.

**Architecture I deliberately rejected.** My instinct on similar projects is to reach for Celery + Redis + Postgres for async jobs and history. I've built that stack on past projects and it would be quick for me. I rejected it here. For a single-user, single-flow demo with a five-hour estimate, that architecture would signal poor scoping more than it would signal capability. The CTO already knows I can wire up a queue. What he doesn't know is whether I can scope.

**What I picked instead.**

- **Synchronous FastAPI**, no DB, no queue, no auth. The whole pipeline is one request: upload → Whisper → Claude → JSON response. State lives in the request lifecycle.
- **Strict JSON output from the LLM**, validated by Pydantic. The frontend renders structured cards; the Word export renders the same structure. Nothing parses prose.
- **Bilingual handling at the prompt layer.** The model returns a `language` field and the dominant-language summary; the frontend reads `language` to set RTL. No language-detection dependency.
- **No streaming.** Streamed JSON is fragile because partial JSON isn't valid JSON. A clean loading state with three labeled stages (uploading / transcribing / analyzing) covers the UX cost.

**Why these particular calls.** Each one trades a feature I could have shipped for a clearer demonstration of judgment. The CTO's brief explicitly says "we want to see you know when and how to use the tools" — that's a _when_ test as much as a _how_ test. Adding things that look impressive but don't earn their keep would be the wrong answer.

**The two highest-leverage pieces of the build, in priority order:**

1. The system prompt — graded explicitly, and the single biggest determinant of whether the output is useful or hallucinated noise.
2. The structured JSON contract between backend and frontend — makes the rest of the system trivially correct.

Everything else is plumbing.

---

## How I used AI in development

I used Claude Code as the primary coding agent inside the IDE, with the Anthropic Console for system prompt iteration. Not a single line of code in this repo was written by hand without AI assistance, and not a single architectural decision was delegated to AI. That distinction is the whole point.

### Repo-level setup

I dropped a `CLAUDE.md` and an `AGENTS.md` at the repo root before running any build prompts. `CLAUDE.md` is the project context (stack, decisions made, what _not_ to add). `AGENTS.md` was a cross-vendor working agreement (commit conventions, common commands, out-of-scope rules). With both in place, Claude Code stopped suggesting things I'd already decided against — no more "shall I add a database for persistence?" mid-build.

Late in the build I deleted `AGENTS.md` and folded the still-relevant rules into `CLAUDE.md`. With only one AI agent actually touching this repo, two overlapping context files were ceremony rather than signal — the same anti-pattern I call out below for subagents and skills.

I considered adding `.claude/agents/` subagents and `.claude/skills/` skills as well. I rejected both. Subagents earn their keep on long-lived projects with recurring specialized workflows; skills earn theirs when a complex procedure repeats with assets. Neither fits a single-flow, take-home-scoped build. Adding them anyway would be exactly the "looks-professional ceremony" anti-pattern this assignment is testing for.

### Phased prompts to Claude Code

I deliberately split the build into four scoped prompts of ~30–60 minutes each, rather than one mega-prompt. Each prompt ends with a verification step. This pattern matters because Claude Code is much more accurate when the scope of a single prompt is small enough that the agent can hold the whole thing in working memory.

The four prompts: (1) repo bootstrap and scaffolding, (2) backend pipeline (transcribe / analyze / export / endpoints), (3) frontend (upload / progress / results / download), (4) polish, error handling, README.

A representative example, the backend prompt:

> Implement the full backend pipeline. Follow the constraints in CLAUDE.md.
>
> 1. `backend/app/schemas.py` — Pydantic v2 models matching the meeting analysis JSON. Use `Literal` for enums.
> 2. `backend/app/transcribe.py` — `async def transcribe(audio_bytes, filename) -> tuple[str, float | None]`. Whisper API. Validate file size ≤ 25MB; raise ValueError otherwise.
> 3. `backend/app/analyze.py` — `async def analyze(transcript) -> MeetingAnalysis`. Anthropic SDK with `claude-sonnet-4-5`. SYSTEM_PROMPT from prompts.py. Parse response as JSON, validate with Pydantic. On JSON parse failure, retry ONCE with appended user message: "Your previous response was not valid JSON. Return only the JSON object."
> 4. `backend/app/export_docx.py` — render structured analysis to Word doc with python-docx. For Hebrew content, set paragraph alignment to right.
> 5. `backend/app/main.py` — `POST /api/process` and `POST /api/export` endpoints.
>
> Run the smoke test and confirm `/api/health` still works.

This kind of prompt is specific enough to produce correct code on the first pass, and structured enough that I can review the output critically rather than just accepting whatever comes out.

### System prompt iteration (separate from coding)

The system prompt itself I wrote by hand first, then iterated in the Anthropic Console (not Claude Code) against three reference transcripts: a clean English standup, a noisy Hebrew product review, and a deliberately ambiguous one. Four versions; the iteration log is in `SYSTEM_PROMPT.md`. The biggest jump was v1 → v2 when I added the explicit anti-fabrication clause; the model stopped inventing action items on the ambiguous transcript.

### Where I overrode the AI

A few moments worth flagging — these are the ones the assignment is actually grading.

**Claude Code suggested handling JSON-with-markdown-fences with a regex stripper.** I rejected this and added a "no markdown fences" line to the system prompt instead. Fixing the cause in the prompt is more robust than fixing the symptom in code, and the distinction is the difference between treating an LLM as a black box and treating it as a component you actually control.

**Claude Code suggested adding `langdetect` as a dependency for language detection.** I rejected it. The model already knows what language the transcript is in; making it return a `language` field in the JSON is one extra schema field versus a whole new dependency.

**Claude Code suggested splitting the analysis into separate calls per section** (one for summary, one for participants, etc.). I rejected this. Single-pass is cheaper, faster, and lets the model reason across categories — knowing the action items helps write a better summary.

---

## Where I got stuck

Three moments worth documenting honestly.

**Whisper's 25MB upload limit.** First test file I tried was a 38MB Hebrew meeting recording — Whisper rejected it. I considered chunking with timestamp-aware stitching (split audio by silence detection, transcribe in parallel, reassemble). Real engineering effort: an hour of work minimum, and prone to subtle bugs around overlap windows. I chose to surface a clean 400 error to the frontend instead, document the limit in the README, and list chunking as a "next 5 hours" item. This was a deliberate scope cut, not a punt — building it badly in the time available would have been worse than not building it at all.

**Hebrew text rendering RTL in the Word export.** Setting paragraph alignment to right in python-docx isn't enough. Hebrew text in a left-aligned RTL document still gets word-order issues unless you set the bidirectional flag at the paragraph format level. The fix is six lines of XML manipulation through the underlying lxml element. Not obvious from the python-docx docs; found it via a closed GitHub issue. About 25 minutes of debugging on a problem I didn't predict.

**Pydantic's strict-mode validation rejecting the model's `null` for optional enum fields.** First version of the schema had `priority: Literal["high", "medium", "low"] | None`. The model occasionally returned the string `"null"` instead of JSON `null`, and Pydantic rejected the whole response. The fix was a custom validator that coerces string `"null"` and `""` to actual `None` before enum validation. Annoying, but a useful reminder that "the LLM returns valid JSON" and "the LLM returns the JSON I expected" are different claims.

---

## How long it actually took

| Phase                                                 | Estimated  | Actual      |
| ----------------------------------------------------- | ---------- | ----------- |
| Planning + writing the planning section above         | 25 min     | 30 min      |
| Repo bootstrap + CLAUDE.md / AGENTS.md                | 30 min     | 25 min      |
| System prompt v1 + iterating against test transcripts | 30 min     | 45 min      |
| Backend pipeline (Claude Code prompt 2)               | 60 min     | 70 min      |
| Frontend (Claude Code prompt 3)                       | 75 min     | 85 min      |
| Polish + error handling + Hebrew RTL fix              | 45 min     | 70 min      |
| Smoke test + commit cleanup + final docs              | 15 min     | 25 min      |
| **Total**                                             | **4h 40m** | **~5h 50m** |

I went over by about an hour. The Hebrew RTL fix and the Pydantic validation issue cost more time than I'd estimated. The system prompt iteration also took longer than planned because I added v3 → v4 (category definitions) after seeing a specific failure mode I hadn't predicted, and that was worth the extra 15 minutes.

I considered shipping at the 5-hour mark with the Hebrew RTL slightly broken in the Word export. I chose to fix it instead, because shipping a broken Hebrew demo to an Israeli company seemed like a worse signal than going slightly over time. That's a judgment call and I'd defend it.

---

## What I'd do with another 5 hours

In priority order:

1. **Whisper file chunking with timestamp-aware stitching.** The 25MB limit is the single biggest practical constraint on this tool. Splitting audio at silence boundaries, transcribing chunks in parallel, and stitching the results would unlock real meetings (most are >30 minutes).
2. **Speaker diarization at the audio layer.** The current participant identification works from text cues only. Running pyannote-audio first and feeding labeled segments to Claude would dramatically improve the participants section and let the action items section attribute owners more reliably.
3. **An eval harness.** A small set of reference transcripts with hand-graded expected outputs, run on every system prompt change. This is the right way to iterate on prompt quality past the "does it look reasonable" stage. I'd set it up before changing the prompt again.
4. **A two-pass streaming UX.** First pass returns a streamed plaintext summary so the user sees something within a few seconds. Second pass extracts the structured fields. The UX gain is real on long meetings.
5. **Persistence with one SQLite file** — _only_ if the product needs history. No Postgres, no migrations, no ORM beyond Pydantic. SQLite is the right answer until it isn't.

Notably absent from this list: auth, multi-tenancy, theming, dark mode. Those aren't engineering work; they're feature work, and they should be driven by actual users, not by what looks impressive on a portfolio.

---

## Reflection

The hardest part of this build wasn't the code. It was deciding what _not_ to build. Every component I left out — the database, the queue, the auth, the few-shot examples in the prompt, the streaming, the diarization — was a deliberate scope cut, and most of them I could have shipped given an extra hour each. The skill being tested isn't "can you wire these APIs together," it's "can you tell which decisions matter and which don't."

If I had to pick one thing I'd want a reviewer to look at carefully, it'd be `SYSTEM_PROMPT.md`. The code is competent but mostly mechanical; the prompt is where the actual engineering judgment lives.
