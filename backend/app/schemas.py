from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Confidence = Literal["high", "medium", "low"]
Priority = Literal["high", "medium", "low"]
Language = Literal["he", "en", "mixed"]


class Participant(BaseModel):
    name: str
    role: str | None
    confidence: Confidence


class Decision(BaseModel):
    decision: str
    context: str


class ActionItem(BaseModel):
    task: str
    owner: str | None
    deadline: str | None
    priority: Priority | None


class MeetingAnalysis(BaseModel):
    language: Language
    title: str
    summary: str
    participants: list[Participant]
    decisions: list[Decision]
    action_items: list[ActionItem]
    open_questions: list[str]


class ProcessResult(BaseModel):
    transcript: str
    analysis: MeetingAnalysis
    duration_seconds: float | None
