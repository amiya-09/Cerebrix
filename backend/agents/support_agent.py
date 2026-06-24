import json
from groq import Groq
from config import GROQ_API_KEY
from vector.chroma_client import knowledge_base_collection

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a customer support assistant. Answer the user's question
using ONLY the context provided below. Do not use outside knowledge.

Calibrate your confidence score honestly based on these bands:
- 85-100: the context directly and completely answers the question
- 50-84: the context is related but incomplete, or requires some inference
- 0-49: the context doesn't really address the question, or you're mostly guessing

Do not inflate your confidence just to seem helpful. If the context doesn't answer
the question, say so plainly and score it low.

Respond with ONLY valid JSON, no markdown formatting, no code fences, in this exact shape:
{"answer": "your answer here", "confidence": 85, "sources": ["relevant excerpt"]}
"""


def resolve(query: str) -> dict:
    results = knowledge_base_collection.query(
        query_texts=[query],
        n_results=3
    )
    context_chunks = results["documents"][0] if results["documents"] else []
    context_text = "\n\n".join(context_chunks) if context_chunks else "No relevant context found."

    user_prompt = f"Context:\n{context_text}\n\nQuestion: {query}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
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
        parsed = {"answer": raw_output, "confidence": 0, "sources": []}

    return {
        "answer": parsed.get("answer", ""),
        "confidence": parsed.get("confidence", 0),
        "sources": parsed.get("sources", [])
    }
