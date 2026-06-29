import json
from groq import Groq
from config import GROQ_API_KEY
from db.supabase_client import supabase
from vector.chroma_client import knowledge_base_collection
from vector.ingest import ingest_document

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a knowledge base curator reviewing a resolved support
conversation, along with the most similar existing knowledge base content found
via search.

Decide two things:
1. is_useful: would this Q&A make a good, general-purpose, reusable KB article?
   Reject conversations that are just praise/feedback, too specific to one person's
   situation, or too trivial to document.
2. is_duplicate: does the existing content already cover this well enough that a
   new article would be redundant?

If useful and not a duplicate, write a clean article: a clear title and well-written
body, generalized for any future reader — not phrased as a reply to one specific person.

Respond with ONLY valid JSON, no markdown, no code fences:
{"is_useful": true, "is_duplicate": false, "title": "Return Policy Timeline", "article": "Customers have 30 days from the date of purchase to return an item..."}
"""


def build_articles() -> dict:
    conversations = (
        supabase.table("conversations")
        .select("id")
        .eq("status", "resolved")
        .eq("kb_processed", False)
        .execute()
        .data
    )

    summary = {"processed": 0, "created": 0, "skipped_duplicate": 0, "skipped_not_useful": 0}

    for convo in conversations:
        convo_id = convo["id"]
        messages = (
            supabase.table("messages")
            .select("role, content")
            .eq("conversation_id", convo_id)
            .order("created_at")
            .execute()
            .data
        )

        user_msgs = [m["content"] for m in messages if m["role"] == "user"]
        assistant_msgs = [m["content"] for m in messages if m["role"] == "assistant"]

        if not user_msgs or not assistant_msgs:
            supabase.table("conversations").update({"kb_processed": True}).eq("id", convo_id).execute()
            summary["processed"] += 1
            continue

        question = user_msgs[0]
        answer = assistant_msgs[-1]

        search_results = knowledge_base_collection.query(query_texts=[question], n_results=2)
        existing_docs = search_results["documents"][0] if search_results["documents"] else []
        existing_context = "\n\n".join(existing_docs) if existing_docs else "No similar content found."

        user_prompt = (
            f"Question: {question}\n\nAnswer given: {answer}\n\n"
            f"Most similar existing KB content:\n{existing_context}"
        )

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
            parsed = {"is_useful": False, "is_duplicate": False}

        if parsed.get("is_useful") and not parsed.get("is_duplicate"):
            ingest_document(parsed["article"], title=parsed["title"], source="auto-generated")
            summary["created"] += 1
        elif parsed.get("is_duplicate"):
            summary["skipped_duplicate"] += 1
        else:
            summary["skipped_not_useful"] += 1

        supabase.table("conversations").update({"kb_processed": True}).eq("id", convo_id).execute()
        summary["processed"] += 1

    return summary
