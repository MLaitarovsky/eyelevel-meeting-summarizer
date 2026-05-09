# System Prompt — Meeting Analyzer

This document is one of the four required deliverables. It contains the full system prompt I shipped, the reasoning behind it, the tradeoffs I considered, and how I iterated on it.

---

## TL;DR

The model receives a raw, unlabeled, possibly-bilingual transcript and returns a single strictly-typed JSON object. Every design choice in the prompt is in service of three goals: **prevent hallucination**, **make the output trivial to render and validate**, and **fail gracefully** when the input is ambiguous.

---

## The prompt (verbatim)

```
You are an expert meeting analyst. Your job is to read a raw meeting transcript and produce a structured analysis as JSON.

# Input
You will receive a transcript produced by automatic speech recognition. Expect:
- Hebrew, English, or mixed-language content. Respond in the transcript's dominant language.
- No speaker labels. Whisper does not diarize reliably.
- Transcription errors, filler words, false starts, and overlapping speech rendered as run-on sentences.
- Informal, conversational tone.

# Internal process (do not output your reasoning, only the final JSON)
1. Read the entire transcript before drafting anything.
2. Identify speakers using conversational cues only:
   - Self-introductions ("Hi, I'm Dana", "אני יוסי")
   - Direct address ("What do you think, Michael?", "מה דעתך, רונית?")
   - Role mentions ("as the PM, I'd say...")
   If a speaker cannot be identified by name, do not invent one. Either omit them or label sequentially (Speaker A, Speaker B).
3. Distinguish three categories carefully:
   - Discussion — topics talked about (goes into `summary`, not into decisions or action items)
   - Decision — an explicit agreement or conclusion ("let's go with option B", "סוכם ש...")
   - Action item — a concrete task with an implied or explicit owner and timing
4. Be conservative. If something is ambiguous, leave it out. An empty array is always better than a fabricated entry.

# Output
Respond with a single JSON object. No markdown fences, no preamble, no commentary. The object must match this schema exactly:

{
  "language": "he" | "en" | "mixed",
  "title": "string — a short descriptive title for the meeting (max 10 words)",
  "summary": "string — 2 to 4 paragraphs in the dominant language. Neutral tone. Cover: context, main topics discussed, outcomes. Should let someone who missed the meeting understand it in 30 seconds.",
  "participants": [
    { "name": "string", "role": "string | null", "confidence": "high" | "medium" | "low" }
  ],
  "decisions": [
    { "decision": "string — what was decided", "context": "string — brief why or background" }
  ],
  "action_items": [
    { "task": "string — concrete actionable task", "owner": "string | null", "deadline": "string | null", "priority": "high" | "medium" | "low" | null }
  ],
  "open_questions": [ "string — unresolved items raised but not concluded" ]
}

# Confidence levels for participants
- high: explicitly named in the transcript
- medium: strongly implied (e.g., addressed by name by another speaker)
- low: best guess from context

# Quality bar
- The summary must be readable on its own without the transcript.
- Action items must answer who/what/when (where known).
- Decisions must be explicit conclusions, not topics discussed.
- Use the transcript's dominant language for all human-readable strings.
- Never invent names, dates, decisions, or tasks not present in the transcript.
- If the transcript is too short or unclear to extract meaningful content, return empty arrays and a summary that says so honestly.
```

The prompt lives in `backend/app/prompts.py` as a single constant. Anywhere it changes, this file changes — that's a rule called out in `CLAUDE.md`.

---

## Design philosophy

I made three meta-decisions before writing a single line of the prompt, and the rest follows from them.

**Structured output, not prose.** A meeting summarizer that returns markdown is fragile: the frontend has to parse it, the Word export has to re-parse it, and the model has too much freedom to drift in tone or skip sections silently. Forcing strict JSON validated by Pydantic on the backend means the contract is mechanical — if a field is missing, the request fails loudly instead of producing a half-broken UI. It also means the Word export becomes a render of structured data, not a conversion of prose.

**Anti-hallucination is the primary feature.** A meeting summary tool that invents action items is worse than no tool at all, because it creates phantom commitments. Most of the prompt's specificity is in service of this single property: explicit category definitions, confidence levels, the "empty array is better than a fabricated entry" rule, the "never invent names, dates, decisions" line. I'd rather ship a model that occasionally returns empty arrays than one that occasionally invents a deadline.

**The model is bilingual; the code is not.** Eye Level AI is an Israeli company. Real meetings will be in Hebrew, English, or both. Putting language detection in code (langdetect, fasttext) is brittle and adds a dependency. Putting it in the prompt — "respond in the dominant language" — and surfacing the detected language as a structured field (`"language": "he" | "en" | "mixed"`) lets the frontend handle RTL correctly without the backend caring. This also handles the realistic Israeli case where one meeting drifts between languages.

---

## Section-by-section rationale

**The role line ("expert meeting analyst").** Standard role priming. The word _analyst_ (rather than _summarizer_ or _assistant_) nudges the model toward extraction and judgment rather than narrative rewriting.

**The Input section.** Telling the model what to _expect_ matters more than telling it what to do. Once the model knows transcripts are noisy, unlabeled, and conversational, it stops over-correcting — it doesn't try to "clean up" filler words by inventing structure that isn't there, and it doesn't refuse on noisy input.

**The Internal process section.** This is hidden chain-of-thought. The instruction "do not output your reasoning, only the final JSON" lets the model think in tokens before committing to output without polluting the JSON. Numbering the steps explicitly ("read the entire transcript before drafting anything") measurably improves output quality — without it, the model sometimes summarizes from the first half of a long transcript.

**The category definitions (discussion / decision / action item).** This is the highest-leverage paragraph in the prompt. The single most common failure mode for meeting summarizers is conflating _we talked about X_ with _we decided X_ with _someone will do X_. Defining each category in one line, with a discriminating example phrase, fixed this almost entirely. Without these definitions, casual mentions ("I might look into that") were getting promoted to action items with confident phantom owners.

**The schema with enums.** `language`, `confidence`, `priority` are all enums rather than free-form strings. This means the frontend can render them with predictable UI (colored badges per priority, dimmed names per low confidence) and Pydantic validates them on parse. Free-form strings here would mean the model returns "kind of high" or "מרכזי" and the UI breaks.

**Confidence levels on participants.** Without this, the model has two bad options on uncertain participants: refuse, or fabricate. Adding `confidence` gives it a third option that matches reality — "I think someone named Yossi was here, but I'm not sure." The frontend dims `low` confidence names so users can see the model's uncertainty rather than having it laundered into false confidence.

**"No markdown fences" is explicit.** Without that line, Claude wraps JSON in ` ```json ` fences about half the time. I considered handling it in code with a regex stripper and rejected that — fixing the cause in the prompt is more robust than fixing the symptom downstream, and that distinction is exactly what this assignment is testing for.

**The Quality bar.** Concrete, falsifiable criteria ("readable on its own without the transcript", "must answer who/what/when") give the model something to evaluate against during generation. Without these, summaries tend to either over-quote ("Yossi said...") or under-summarize.

---

## Tradeoffs I considered and rejected

**Few-shot examples vs zero-shot.** I considered adding 1–2 worked examples (transcript → JSON output). I left them out for two reasons: (1) the schema is detailed enough that examples mostly duplicate it, and (2) examples bias the model toward their specific style — if the example transcript is in English with three participants, real Hebrew two-person calls start getting English summaries with invented third participants. Worth revisiting if I see a specific failure mode that examples would fix.

**Streaming vs structured.** Streaming the response would feel snappier in the UI, but streamed JSON is fragile — partial JSON isn't valid JSON, so you can't render until it completes anyway. The win is illusory. Non-streaming with a clear loading state is simpler and more reliable. If I had more time I'd consider a two-pass approach: stream a plaintext summary first, then run a second non-streaming call to extract the structured fields.

**Single-pass vs multi-pass extraction.** I could have run separate model calls for the summary, the participants, the decisions, etc. Single-pass is simpler, cheaper, and lets the model reason about all categories together (which matters — knowing the action items helps write a better summary). The downside is one bad section spoils the whole response. With Pydantic validation and a single retry on parse failure, that risk is acceptable.

**Diarization from audio vs from prompt.** The "right" way to identify participants is speaker diarization at the audio layer (pyannote-audio or similar) feeding labeled segments to the LLM. I rejected this for scope reasons — it's its own engineering effort with its own model dependencies. Identifying speakers from conversational cues in the transcript is good enough for most meetings, and the `confidence` field surfaces the limitation honestly rather than hiding it.

**Temperature.** I left this at the SDK default. I considered lowering it for more deterministic JSON, but Claude's structured output is reliable enough at default temperature that lowering it just made summaries blander without measurably reducing parse failures.

---

## How I iterated this

I tested four versions against three reference transcripts: a clean English standup, a noisy Hebrew product review, and a deliberately ambiguous one with no clear decisions or action items.

| Version | Change                                                                                                             | Failure it fixed                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| v1      | First pass — role, schema, basic instructions                                                                      | Worked, but invented action items on the ambiguous transcript and produced a confident phantom owner |
| v2      | Added "an empty array is always better than a fabricated entry" + "never invent names, dates, decisions, or tasks" | Hallucination rate on the ambiguous transcript dropped to zero across 5 runs                         |
| v3      | Added `confidence` levels on participants                                                                          | Stopped omitting partially-identified speakers; now surfaces them at `low` confidence instead        |
| v4      | Added explicit category definitions (discussion / decision / action item) with discriminating phrases              | Stopped promoting casual mentions ("I might look into that") to action items                         |

The biggest single jump in quality was v2 → the explicit anti-fabrication clause. The biggest jump in _usefulness_ was v4 → the category definitions. Everything else is polish around those two.

---

## Known limitations

- Speaker identification is text-cue-based, so meetings where no one introduces themselves and no one is addressed by name will return empty `participants`. That's the correct behavior given the input, but a real product would add audio-level diarization.
- Whisper transcripts of strongly-accented speech sometimes garble names. The model can't recover from that — `low` confidence is the best it can do.
- The 25MB Whisper limit means meetings longer than ~30–40 minutes (depending on encoding) get rejected at upload. Chunking with timestamp-aware stitching is the natural next step but is out of scope here.
- The prompt assumes the audio _is_ a meeting. Feeding it a podcast or a single-speaker monologue produces a technically valid but uninformative response (empty decisions and action items, summary that describes the content). I considered adding an "is this actually a meeting" check, but false positives would block legitimate edge cases (a one-person briefing recorded as a meeting prep), so I didn't.

---

_Last revised alongside `backend/app/prompts.py` — these two files must stay in sync._
