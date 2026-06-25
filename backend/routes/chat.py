from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from agents.support_agent import resolve
from db.supabase_client import supabase

router = APIRouter()

CONFIDENCE_THRESHOLD = 75  # balanced default — tune this after seeing real usage


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("/api/chat")
async def chat(payload: ChatRequest):
    if payload.conversation_id:
        conversation_id = payload.conversation_id
    else:
        new_convo = supabase.table("conversations").insert({"channel": "web"}).execute()
        conversation_id = new_convo.data[0]["id"]

    supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": payload.message
    }).execute()

    result = resolve(payload.message)

    if result["confidence"] >= CONFIDENCE_THRESHOLD:
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": result["answer"],
            "metadata": {"confidence": result["confidence"], "sources": result["sources"]}
        }).execute()

        supabase.table("conversations").update({
            "status": "resolved",
            "resolution_confidence": result["confidence"]
        }).eq("id", conversation_id).execute()

        return {
            "conversation_id": conversation_id,
            "status": "answered",
            "answer": result["answer"],
            "confidence": result["confidence"]
        }
    else:
        supabase.table("review_queue").insert({
            "conversation_id": conversation_id,
            "ai_draft": result["answer"],
            "confidence": result["confidence"],
            "status": "pending"
        }).execute()

        supabase.table("conversations").update({
            "status": "escalated",
            "resolution_confidence": result["confidence"]
        }).eq("id", conversation_id).execute()

        return {
            "conversation_id": conversation_id,
            "status": "pending_review",
            "confidence": result["confidence"]
        }
