from __future__ import annotations

from openai import AsyncOpenAI

from app.config import MAX_UPLOAD_BYTES, OPENAI_API_KEY

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".mp3", ".wav", ".m4a", ".mp4", ".webm"})


def _extension(filename: str) -> str:
    return ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""


async def transcribe(audio_bytes: bytes, filename: str) -> tuple[str, float | None]:
    """Transcribe an audio blob with Whisper. Returns (text, duration_seconds)."""
    size = len(audio_bytes)
    if size > MAX_UPLOAD_BYTES:
        mb = size / (1024 * 1024)
        raise ValueError(
            f"Audio file is {mb:.1f} MB; Whisper's limit is 25 MB. Trim or compress and try again."
        )

    ext = _extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(e.lstrip(".") for e in ALLOWED_EXTENSIONS))
        raise ValueError(f"Unsupported audio format {ext or '(none)'}. Use one of: {allowed}.")

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    # verbose_json gives us the duration field; default JSON does not.
    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=(filename, audio_bytes),
        response_format="verbose_json",
    )

    text = response.text
    duration = getattr(response, "duration", None)
    return text, duration
