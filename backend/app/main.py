from __future__ import annotations

import logging
import re
import time
import urllib.parse
from io import BytesIO

import anthropic
import openai
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.analyze import AnalysisFormatError, analyze
from app.config import ALLOWED_ORIGINS, MAX_DURATION_SECONDS
from app.export_docx import to_docx
from app.schemas import ProcessResult
from app.transcribe import transcribe

# uvicorn.error already has a configured stderr handler, so we get formatted output
# without setting up our own logging config. (Despite the name, it carries INFO too.)
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Meeting Summarizer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/process", response_model=ProcessResult)
async def process(file: UploadFile = File(...)) -> ProcessResult:
    filename = file.filename or "audio.mp3"
    start = time.perf_counter()
    audio = await file.read()

    try:
        transcript, duration = await transcribe(audio, filename)
    except ValueError as exc:
        # File-level validation (size, extension) — user can fix and retry.
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except openai.APIError as exc:
        logger.exception("OpenAI/Whisper API failure")
        raise HTTPException(status_code=502, detail="Transcription service unavailable.") from exc

    if duration is not None and duration > MAX_DURATION_SECONDS:
        minutes = duration / 60
        limit = MAX_DURATION_SECONDS // 60
        raise HTTPException(
            status_code=400,
            detail=f"Audio is {minutes:.0f} minutes long; the limit is {limit} minutes.",
        )

    try:
        analysis = await analyze(transcript)
    except anthropic.APIError as exc:
        logger.exception("Anthropic API failure")
        raise HTTPException(status_code=502, detail="Analysis service unavailable.") from exc
    except AnalysisFormatError as exc:
        logger.warning("analyze format error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to structure the analysis.") from exc

    elapsed = time.perf_counter() - start
    logger.info("processed %s in %.1fs", filename, elapsed)

    return ProcessResult(transcript=transcript, analysis=analysis, duration_seconds=duration)


@app.post("/api/export")
def export(result: ProcessResult) -> StreamingResponse:
    docx_bytes = to_docx(result.analysis, result.transcript)

    # filename: ASCII-safe fallback for older clients, RFC 5987 UTF-8 form for the real one.
    ascii_stem = re.sub(r"[^A-Za-z0-9_-]+", "_", result.analysis.title).strip("_")[:60] or "meeting"
    utf8_stem = result.analysis.title.replace(" ", "_") or "meeting"
    encoded = urllib.parse.quote(f"{utf8_stem}.docx")
    disposition = f'attachment; filename="{ascii_stem}.docx"; filename*=UTF-8\'\'{encoded}'

    return StreamingResponse(
        BytesIO(docx_bytes),
        media_type=DOCX_MEDIA_TYPE,
        headers={"Content-Disposition": disposition},
    )
