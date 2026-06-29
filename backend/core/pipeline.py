from agents.support_agent import resolve
from agents.router_agent import classify
from agents.opportunity_agent import scan as scan_opportunity
from agents.sentiment_agent import analyze as analyze_sentiment
from db.supabase_client import supabase

CONFIDENCE_THRESHOLD = 75


def get_or_create_conversation(external_id: str, channel: str) -> str:
    existing = (
        supabase.table("conversations")
        .select("id")
        .eq("external_id", external_id)
        .execute()
        .data
    )
    if existing:
        return existing[0]["id"]

    new_convo = (
        supabase.table("conversations")
        .insert({"channel": channel, "external_id": external_id})
        .execute()
    )
    return new_convo.data[0]["id"]


def process_message(message: str, conversation_id: str = None, channel: str = "web") -> dict:
    if not conversation_id:
        new_convo = supabase.table("conversations").insert({"channel": channel}).execute()
        conversation_id = new_convo.data[0]["id"]

    supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": message
    }).execute()

    classification = classify(message)
    category = classification["category"]

    if category == "sales_inquiry":
        scan_opportunity(message, conversation_id)

    sentiment_result = analyze_sentiment(message, conversation_id)

    result = resolve(message)

    should_escalate = (
        result["confidence"] < CONFIDENCE_THRESHOLD
        or sentiment_result["force_escalate"]
    )

    if not should_escalate:
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
            "confidence": result["confidence"],
            "category": category,
            "sentiment": sentiment_result["sentiment"],
            "health_score": sentiment_result["new_health_score"]
        }
    else:
        supabase.table("review_queue").insert({
            "conversation_id": conversation_id,
            "ai_draft": result["answer"],
            "confidence": result["confidence"],
            "status": "pending",
            "priority": sentiment_result["force_escalate"]
        }).execute()

        supabase.table("conversations").update({
            "status": "escalated",
            "resolution_confidence": result["confidence"]
        }).eq("id", conversation_id).execute()

        return {
            "conversation_id": conversation_id,
            "status": "pending_review",
            "confidence": result["confidence"],
            "category": category,
            "sentiment": sentiment_result["sentiment"],
            "health_score": sentiment_result["new_health_score"],
            "priority": sentiment_result["force_escalate"]
        }
