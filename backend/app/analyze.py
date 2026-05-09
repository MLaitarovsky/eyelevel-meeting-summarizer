from __future__ import annotations

import json

from anthropic import AsyncAnthropic
from pydantic import ValidationError

from app.config import ANTHROPIC_API_KEY
from app.prompts import SYSTEM_PROMPT
from app.schemas import MeetingAnalysis

# Sonnet 4.6 is the current generally-available Sonnet alias (per CLAUDE.md).
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 4096
RETRY_NUDGE = "Your previous response was not valid JSON. Return only the JSON object."


class AnalysisFormatError(Exception):
    """Claude returned a response that couldn't be parsed/validated, even after one retry."""


def _first_text(response) -> str:
    for block in response.content:
        if getattr(block, "type", None) == "text" and getattr(block, "text", None):
            return block.text
    raise AnalysisFormatError("Model response had no text content.")


async def analyze(transcript: str) -> MeetingAnalysis:
    """Send the transcript to Claude and parse the structured analysis."""
    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    messages: list[dict[str, str]] = [{"role": "user", "content": transcript}]

    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    text = _first_text(response)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # One retry: feed the bad output back and ask for clean JSON.
        messages.append({"role": "assistant", "content": text})
        messages.append({"role": "user", "content": RETRY_NUDGE})
        retry = await client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        retry_text = _first_text(retry)
        try:
            data = json.loads(retry_text)
        except json.JSONDecodeError as exc:
            raise AnalysisFormatError("Model returned non-JSON output twice in a row.") from exc

    try:
        return MeetingAnalysis.model_validate(data)
    except ValidationError as exc:
        raise AnalysisFormatError(f"Model output didn't match the expected schema: {exc}") from exc
