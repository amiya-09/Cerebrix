import json
from groq import Groq
from config import GROQ_API_KEY
from db.supabase_client import supabase

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a sentiment analysis agent for customer support conversations.
Analyze the emotional tone of the user's message.

Respond with ONLY valid JSON, no markdown, no code fences:
{"sentiment": "frustrated", "intensity": 70, "health_delta": -15}

- "sentiment" must be one of: "frustrated", "neutral", "positive"
- "intensity": 0-100, how strongly that emotion is expressed (0 = barely perceptible,
  100 = extreme)
- "health_delta": an integer between -30 and +10 representing how this single message
  should move the conversation's overall health score. Strong frustration: -20 to -30.
  Mild frustration: -5 to -15. Neutral: 0. Positive: +5 to +10.
"""

FRUSTRATION_ESCALATION_THRESHOLD = 70


def analyze(message: str, conversation_id: str) -> dict:
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.1
    )

    raw_output = response.choices[0].message.content.strip()
    if raw_output.startswith("```"):
        raw_output = raw_output.strip("`")
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()

    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        parsed = {"sentiment": "neutral", "intensity": 0, "health_delta": 0}

    sentiment = parsed.get("sentiment", "neutral")
    intensity = parsed.get("intensity", 0)
    health_delta = parsed.get("health_delta", 0)

    convo = (
        supabase.table("conversations")
        .select("health_score")
        .eq("id", conversation_id)
        .execute()
    )
    current_score = convo.data[0]["health_score"] if convo.data else 75
    new_score = max(0, min(100, current_score + health_delta))

    supabase.table("conversations").update({
        "sentiment": sentiment,
        "health_score": new_score
    }).eq("id", conversation_id).execute()

    force_escalate = (
        sentiment == "frustrated" and intensity >= FRUSTRATION_ESCALATION_THRESHOLD
    )

    return {
        "sentiment": sentiment,
        "intensity": intensity,
        "health_delta": health_delta,
        "new_health_score": new_score,
        "force_escalate": force_escalate
    }
