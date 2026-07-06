from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from db.supabase_client import supabase

router = APIRouter()


@router.get("/api/conversations")
async def list_conversations(status: Optional[str] = Query(None)):
    query = supabase.table("conversations").select(
        "id, channel, status, sentiment, health_score, resolution_confidence, created_at, updated_at"
    ).order("updated_at", desc=True)

    if status:
        query = query.eq("status", status)

    conversations = query.execute().data

    for convo in conversations:
        first_msg = (
            supabase.table("messages")
            .select("content")
            .eq("conversation_id", convo["id"])
            .eq("role", "user")
            .order("created_at")
            .limit(1)
            .execute()
            .data
        )
        preview = first_msg[0]["content"] if first_msg else ""
        convo["preview"] = preview[:80]

    return conversations


@router.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    convo = (
        supabase.table("conversations")
        .select("id, channel, status, sentiment, health_score, resolution_confidence, created_at")
        .eq("id", conversation_id)
        .execute()
        .data
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        supabase.table("messages")
        .select("role, content, metadata, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
        .data
    )

    return {"conversation": convo[0], "messages": messages}
