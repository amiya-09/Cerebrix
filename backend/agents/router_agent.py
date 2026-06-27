import json
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a message classifier for a customer support system.
Classify the user's message into exactly one category:

- "support": a question seeking help, information, or troubleshooting
- "sales_inquiry": mentions of pricing, upgrading, new features, budget, growth,
  or interest in buying more
- "complaint": frustration, anger, something broken, considering canceling/leaving
- "feedback": general comments, suggestions, or praise with no urgent need

Respond with ONLY valid JSON, no markdown, no code fences, in this exact shape:
{"category": "support", "reasoning": "short one-sentence reason"}
"""


def classify(message: str) -> dict:
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
        parsed = {"category": "support", "reasoning": "fallback: parse error"}

    return {
        "category": parsed.get("category", "support"),
        "reasoning": parsed.get("reasoning", "")
    }
