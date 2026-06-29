from fastapi import APIRouter
from datetime import datetime, timezone
from db.supabase_client import supabase

router = APIRouter()


@router.get("/api/dashboard/summary")
async def dashboard_summary():
    conversations = supabase.table("conversations").select(
        "status, resolution_confidence, health_score, sentiment, created_at"
    ).execute().data
    pending_queue = supabase.table("review_queue").select("id").eq("status", "pending").execute().data

    total = len(conversations)
    resolved = len([c for c in conversations if c["status"] == "resolved"])
    escalated = len([c for c in conversations if c["status"] == "escalated"])

    confidences = [c["resolution_confidence"] for c in conversations if c["resolution_confidence"] is not None]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else None

    health_scores = [c["health_score"] for c in conversations if c["health_score"] is not None]
    avg_health_score = round(sum(health_scores) / len(health_scores), 1) if health_scores else None

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    frustrated_today = len([
        c for c in conversations
        if c["sentiment"] == "frustrated" and c["created_at"].startswith(today_str)
    ])

    return {
        "total_conversations": total,
        "resolved": resolved,
        "escalated": escalated,
        "pending_in_queue": len(pending_queue),
        "average_confidence": avg_confidence,
        "average_health_score": avg_health_score,
        "frustrated_today": frustrated_today
    }
