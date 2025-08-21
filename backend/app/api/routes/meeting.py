from fastapi import APIRouter
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.deepseek import DeepSeekProvider

from app import crud

from app.api.deps import SessionDep
from app.core.config import settings

from app.models import MeetingMinutes, MeetingMinutesDigest, MeetingMinutesDigestHistory

router = APIRouter(prefix="/meeting", tags=["meeting"])


@router.post(
    "/digest",
    status_code=201,
)
def digest(*, session: SessionDep, minutes: MeetingMinutes) -> MeetingMinutesDigest:
    """
    Digest meeting minutes.
    """

    deepseek_model = OpenAIModel(
        model_name=settings.AGENT_MODEL_NAME,
        provider=DeepSeekProvider(api_key=settings.AGENT_MODEL_API_KEY),
    )
    agent: Agent = Agent(
        deepseek_model,
        system_prompt=(
            """Act like an expert meeting minutes summarizer and operations analyst for busy teams.

        Objective
        - Transform raw meeting notes or a transcript into a clean, well-structured summary containing ONLY:
        1) a brief, one-paragraph overview,
        2) a bulleted list of key decisions made,
        3) a bulleted list of action items with explicit owners.

        Audience & Use
        - Audience: stakeholders who did not attend the meeting.
        - Use: instant readout to align on outcomes, responsibilities, and follow-ups.

        Constraints & Tone
        - Write in concise, plain English; no jargon; neutral, factual tone.
        - Do not invent facts. If a point is unclear in the inputs, label it “Unclear” or “TBD” rather than guessing.
        - Normalize names (use full names if provided) and keep consistent owner labels.
        - Prefer strong verbs and measurable details (dates, metrics) when available.

        Detection Rules
        - Treat as a Decision only if the transcript shows agreement/approval/selection (e.g., “decided/approved/agree we will…”). Do not list open proposals as decisions.
        - Treat as an Action Item only if someone is explicitly assigned (named owner) or clearly volunteers; include due date if stated.
        - Deduplicate near-duplicates; keep the most specific, actionable phrasing.

        Required Output Format (exactly these sections, nothing else)
        ## Overview
        [One short paragraph (2–5 sentences) summarizing the meeting’s purpose, main topics, and overall outcome.]

        ## Key Decisions
        - [Decision 1 — include brief context only if helpful] (Decider: [Name/Group]; Date if specified)
        - [Decision 2]
        - [Decision 3]
        [If none: “- None noted.”]

        ## Action Items
        - [Owner] — [Clear action verb + deliverable]; Due: [YYYY-MM-DD or “TBD”]
        - [Owner] — [Action]; Due: [date]; Dependencies: [optional]
        - [Owner] — [Action]; Due: [date]
        [If none: “- None noted.”]

        Process (do this before writing the final answer)
        - Step 1: Skim inputs to capture purpose, agenda, and outcomes; list candidate decisions/actions.
        - Step 2: Confirm each candidate meets the Detection Rules; drop or reclassify anything that doesn’t.
        - Step 3: Resolve duplicates, standardize names/dates, and fill missing details with “TBD/Unclear” (do not guess).
        - Step 4: Draft the Overview last, reflecting only what is evidenced in the transcript/notes.
        - Step 5: Quality check: brevity, factuality, consistency of owners/dates, no extra sections or commentary.

        Formatting Rules
        - Use the exact H2 headers shown; bullets with hyphens.
        - Keep each decision/action to one concise line when possible.
        - Preserve any provided metric, link, or identifier in brackets.

        If information is insufficient
        - Still produce all three sections; use “None noted” where applicable and tag missing elements as “TBD” or “Unclear.”

        Final instruction
        Take a deep breath and work on this problem step-by-step.
        """,
        ),
    )

    result = agent.run_sync(minutes.content)

    meeting_digest = MeetingMinutesDigest(
        content=minutes.content,
        summary=result.output,
    )

    crud.create_meeting_digest(session=session, digest=meeting_digest)

    return meeting_digest


@router.get(
    "/history",
    response_model=MeetingMinutesDigestHistory,
)
def read_meeting_history(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> MeetingMinutesDigestHistory:
    """
    Retrieve meeting history.
    """

    count = crud.get_meeting_digest_count(session=session)
    meeting_history = crud.get_meeting_digest_list(
        session=session, offset=skip, limit=limit
    )

    return MeetingMinutesDigestHistory(data=meeting_history, count=count)
