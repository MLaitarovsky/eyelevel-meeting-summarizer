from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")

# Whisper rejects uploads above 25 MB. Validate on the backend before sending.
MAX_UPLOAD_BYTES: int = 25 * 1024 * 1024

# Defensive guard: refuse audio over 2 hours even if it slipped past the size limit
# (e.g., very low-bitrate mp3). Whisper reports duration in its verbose_json response.
MAX_DURATION_SECONDS: int = 120 * 60

ALLOWED_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)
