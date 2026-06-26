from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/api/dashboard/summary")
async def dashboard_summary():
    conversations = supabase.table("conversations").select("status, resolution_confidence").execute().data
    pending_queue = supabase.table("review_queue").select("id").eq("status", "pending").execute().data

    total = len(conversations)
    resolved = len([c for c in conversations if c["status"] == "resolved"])
    escalated = len([c for c in conversations if c["status"] == "escalated"])

    confidences = [c["resolution_confidence"] for c in conversations if c["resolution_confidence"] is not None]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else None

    return {
        "total_conversations": total,
        "resolved": resolved,
        "escalated": escalated,
        "pending_in_queue": len(pending_queue),
        "average_confidence": avg_confidence
    }
