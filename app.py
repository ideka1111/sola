import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Literal, Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain.messages import HumanMessage
from pydantic import BaseModel, Field

from services.rate_limit import UpstashRateLimiter


load_dotenv(override=True)

GRAPH_VARIANT = os.getenv("GRAPH_VARIANT", "general").strip().lower()
if GRAPH_VARIANT == "apotheken":
    from apotheken_graph import apotheken_graph as active_graph
else:
    from general_graph import general_graph as active_graph


app = FastAPI(title="Sola Backend")
rate_limiter = UpstashRateLimiter()
GLOBAL_HOURLY_LIMIT = int(
    os.getenv("RATE_LIMIT_GLOBAL_HOURLY", os.getenv("RATE_LIMIT_GLOBAL_DAILY", "5000"))
)
ANON_SESSION_HOURLY_LIMIT = int(
    os.getenv("RATE_LIMIT_ANON_SESSION_HOURLY", os.getenv("RATE_LIMIT_ANON_SESSION_DAILY", "10"))
)


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str


class FeedbackRequest(BaseModel):
    vote: Literal["helpful", "not_helpful"]
    comment: str = Field(default="", max_length=2000)
    message_id: Optional[str] = None
    question: str = Field(default="", max_length=4000)
    answer: str = Field(default="", max_length=12000)
    page: str = Field(default="web", max_length=120)
    timestamp: Optional[str] = None


class FeedbackResponse(BaseModel):
    ok: bool
    synced_to_google_sheets: bool
    detail: str


def _chunk_to_text(chunk: Any) -> str:
    content = getattr(chunk, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue
            if isinstance(item, dict):
                if item.get("type") == "text" and item.get("text"):
                    parts.append(item["text"])
                    continue
                text_value = item.get("content") or item.get("text")
                if isinstance(text_value, str):
                    parts.append(text_value)
        return "".join(parts)
    return ""


STREAM_META_START = "\n[[SOLA_META:"
STREAM_META_END = "]]"


def _stream_meta(payload: dict[str, Any]) -> str:
    return f"{STREAM_META_START}{json.dumps(payload, ensure_ascii=False)}{STREAM_META_END}"


def _extract_name_from_history(history: list[ChatTurn]) -> Optional[str]:
    pattern = re.compile(r"\bmein name ist\s+([a-zA-ZÄÖÜäöüß\-]+)", re.IGNORECASE)
    for turn in reversed(history):
        if turn.role != "user":
            continue
        match = pattern.search(turn.content)
        if match:
            return match.group(1)
    return None


def _is_name_memory_question(text: str) -> bool:
    t = text.lower()
    return any(
        key in t
        for key in [
            "wie heiße ich",
            "wie heisse ich",
            "weißt du wie ich heiße",
            "weisst du wie ich heisse",
            "kennst du meinen namen",
            "weißt du meinen namen",
            "remember my name",
            "do you remember my name",
        ]
    )


def _short_circuit_answer(req: ChatRequest) -> Optional[str]:
    text = (req.message or "").strip()
    if not text:
        return "Keine Frage erhalten."
    if _is_name_memory_question(text):
        remembered_name = _extract_name_from_history(req.history)
        return (
            f"Du hast mir gesagt, dass du {remembered_name} heißt."
            if remembered_name
            else "Ich habe deinen Namen in diesem Verlauf nicht sicher gespeichert."
        )
    return None


def _build_enriched_input(req: ChatRequest) -> str:
    history_text = "\n".join(
        ("Nutzer: " if turn.role == "user" else "Sola: ") + turn.content.strip()
        for turn in req.history[-12:]
        if (turn.content or "").strip()
    )
    if not history_text:
        return req.message
    return (
        "Antworte PRIMAER auf die aktuelle Nutzernachricht. "
        "Nutze den Verlauf nur als Kontext und wechsle nicht ohne Grund das Thema.\n\n"
        "Beruecksichtige den bisherigen Chatverlauf:\n\n"
        f"{history_text}\n\n"
        f"Aktuelle Nutzernachricht: {req.message}\n\n"
        "Wichtig: Nutze Tools nur, wenn die aktuelle Nachricht oder der Verlauf "
        "konkret nach Suche oder passenden Ergebnissen verlangt."
    )


def _invoke_answer(enriched_input: str) -> str:
    result = active_graph.invoke({"messages": [HumanMessage(content=enriched_input)]})
    answer = ""
    if isinstance(result, dict) and result.get("messages"):
        last_msg = result["messages"][-1]
        answer = getattr(last_msg, "content", "") or str(last_msg)
    if not answer:
        answer = str(result)
    return answer


def _append_feedback_local(payload: dict) -> None:
    local_path = os.getenv("FEEDBACK_LOCAL_PATH", "feedback_events.jsonl")
    with open(local_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def _send_feedback_to_google_sheets(payload: dict) -> tuple[bool, str]:
    webhook_url = os.getenv("GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return False, "GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL is not configured"

    timeout_sec = float(os.getenv("GOOGLE_SHEETS_FEEDBACK_TIMEOUT_SEC", "10"))
    try:
        resp = requests.post(webhook_url, json=payload, timeout=timeout_sec)
        if resp.status_code >= 400:
            return False, f"Google Sheets webhook error: HTTP {resp.status_code}"
        return True, "Feedback synced to Google Sheets"
    except Exception as exc:
        return False, f"Google Sheets webhook request failed: {exc}"


def _enforce_rate_limit(request: Request) -> None:
    session_id = request.headers.get("x-session-id") or "anon"
    allowed, reason, retry_after = rate_limiter.check_limits(
        session_id=session_id,
        global_limit=GLOBAL_HOURLY_LIMIT,
        session_limit=ANON_SESSION_HOURLY_LIMIT,
    )
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {reason}",
            headers={"Retry-After": str(retry_after)},
        )


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    try:
        _enforce_rate_limit(request)
        short = _short_circuit_answer(req)
        if short is not None:
            return ChatResponse(answer=short)
        enriched_input = _build_enriched_input(req)
        return ChatResponse(answer=_invoke_answer(enriched_input))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    try:
        _enforce_rate_limit(request)
        short = _short_circuit_answer(req)
        if short is not None:
            return StreamingResponse(iter([short]), media_type="text/plain; charset=utf-8")

        enriched_input = _build_enriched_input(req)

        async def _gen():
            tool_used = False
            current_status = "Ich bearbeite deine Anfrage..."
            sent_first_text = False
            try:
                yield _stream_meta({"status": current_status})
                async for chunk, metadata in active_graph.astream(
                    {"messages": [HumanMessage(content=enriched_input)]},
                    stream_mode="messages",
                ):
                    langgraph_node = metadata.get("langgraph_node", "")
                    if langgraph_node and "tool" in langgraph_node.lower():
                        tool_used = True
                        tool_name = metadata.get("langgraph_triggers", ["Suche läuft..."])[0]
                        if "apotheken" in tool_name.lower():
                            current_status = "Ich suche passende Notdienst-Apotheken..."
                        elif "spezial" in tool_name.lower() or "sql" in tool_name.lower():
                            current_status = "Ich suche passende Zentren und Kliniken..."
                        else:
                            current_status = "Ich suche passende Informationen..."
                        yield _stream_meta({"status": current_status, "tool_used": True})
                        continue

                    text = _chunk_to_text(chunk)
                    if text:
                        if not sent_first_text:
                            sent_first_text = True
                            yield _stream_meta({"status": "Ich formuliere die Antwort...", "tool_used": tool_used})
                        yield text
                yield _stream_meta({"tool_used": tool_used, "status": ""})
            except Exception as e:
                yield f"\n[Streaming-Fehler] {e}"

        return StreamingResponse(_gen(), media_type="text/plain; charset=utf-8")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback", response_model=FeedbackResponse)
def feedback(req: FeedbackRequest, request: Request):
    try:
        _enforce_rate_limit(request)
        session_id = request.headers.get("x-session-id") or "unknown"
        user_agent = request.headers.get("user-agent", "")

        payload = {
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "user_agent": user_agent,
            "vote": req.vote,
            "comment": req.comment.strip(),
            "message_id": req.message_id or "",
            "question": req.question.strip(),
            "answer": req.answer.strip(),
            "page": req.page,
            "client_timestamp": req.timestamp or "",
        }

        _append_feedback_local(payload)
        synced, detail = _send_feedback_to_google_sheets(payload)
        return FeedbackResponse(
            ok=True,
            synced_to_google_sheets=synced,
            detail=detail if synced else f"{detail}; saved locally",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
