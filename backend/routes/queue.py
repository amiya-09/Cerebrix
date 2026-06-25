from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

from db.supabase_client import supabase

router = APIRouter()


class EditRequest(BaseModel):
    final_response: str


def _resolve_queue_item(queue_id: str, final_response: str, conversation_id: str):
    supabase.table("review_queue").update({
        "status": "approved",
        "final_response": final_response,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", queue_id).execute()

    supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": final_response,
        "metadata": {"source": "human_reviewed"}
    }).execute()

    supabase.table("conversations").update({
        "status": "resolved"
    }).eq("id", conversation_id).execute()


@router.get("/api/queue")
async def list_queue():
    response = (
        supabase.table("review_queue")
        .select("*")
        .eq("status", "pending")
        .execute()
    )
    return response.data


@router.post("/api/queue/{queue_id}/approve")
async def approve_queue_item(queue_id: str):
    item = supabase.table("review_queue").select("*").eq("id", queue_id).execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="Queue item not found")

    item = item.data[0]
    _resolve_queue_item(queue_id, item["ai_draft"], item["conversation_id"])
    return {"status": "approved", "final_response": item["ai_draft"]}


@router.post("/api/queue/{queue_id}/edit")
async def edit_queue_item(queue_id: str, payload: EditRequest):
    item = supabase.table("review_queue").select("*").eq("id", queue_id).execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="Queue item not found")

    item = item.data[0]
    _resolve_queue_item(queue_id, payload.final_response, item["conversation_id"])
    return {"status": "approved", "final_response": payload.final_response}
