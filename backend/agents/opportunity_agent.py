import json
from groq import Groq
from config import GROQ_API_KEY
from db.supabase_client import supabase

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are an opportunity detection agent for a B2B sales team.
A message has already been classified as a sales inquiry. Your job is to determine
if it contains a genuine upsell or expansion signal.

Look for: mentions of growth, hitting plan limits, wanting features not in their
current plan, team size increasing, budget availability.

Respond with ONLY valid JSON, no markdown, no code fences:
{"is_opportunity": true, "type": "upsell", "value_estimate": "potential upsell - feature gap", "confidence": 75}

If there's genuinely no clear signal, set "is_opportunity": false and confidence low.
"type" must be one of: "upsell", "expansion", "cross-sell"
"""


def scan(message: str, conversation_id: str) -> dict:
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.2
    )

    raw_output = response.choices[0].message.content.strip()
    if raw_output.startswith("```"):
        raw_output = raw_output.strip("`")
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()

    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        parsed = {"is_opportunity": False, "confidence": 0}

    if parsed.get("is_opportunity"):
        supabase.table("opportunities").insert({
            "conversation_id": conversation_id,
            "type": parsed.get("type", "upsell"),
            "signal_text": message,
            "value_estimate": parsed.get("value_estimate", ""),
            "confidence": parsed.get("confidence", 0),
            "status": "new"
        }).execute()

    return parsed
