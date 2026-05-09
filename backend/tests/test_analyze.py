from __future__ import annotations

import asyncio

import pytest

from app.config import ANTHROPIC_API_KEY


@pytest.mark.skipif(not ANTHROPIC_API_KEY, reason="ANTHROPIC_API_KEY not set")
def test_analyze_extracts_decision_and_action_item() -> None:
    from app.analyze import analyze

    transcript = "John: Let's ship Friday. Jane: Agreed, I'll handle deployment."
    result = asyncio.run(analyze(transcript))

    assert len(result.decisions) >= 1, f"expected at least one decision, got {result.decisions}"
    assert len(result.action_items) >= 1, f"expected at least one action item, got {result.action_items}"
