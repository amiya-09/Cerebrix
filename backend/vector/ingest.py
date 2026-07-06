import uuid
from vector.chroma_client import knowledge_base_collection
from db.supabase_client import supabase


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def ingest_document(text: str, title: str, source: str = "uploaded") -> dict:
    chunks = chunk_text(text)

    doc_id = str(uuid.uuid4())
    chunk_ids = [f"{doc_id}-chunk-{i}" for i in range(len(chunks))]
    metadatas = [{"title": title, "chunk_index": i} for i in range(len(chunks))]

    knowledge_base_collection.add(
        documents=chunks,
        ids=chunk_ids,
        metadatas=metadatas
    )

    supabase.table("kb_articles").insert({
        "title": title,
        "content": text,
        "source": source
    }).execute()

    return {"title": title, "chunks_created": len(chunks)}


def rebuild_index_from_supabase():
    """Called once at server startup. ChromaDB's disk is not guaranteed to
    persist across restarts on free hosting tiers — Supabase's kb_articles
    table is the permanent source of truth. This re-embeds everything that's
    ever been uploaded, so search always reflects the full history regardless
    of what happened to local disk."""
    articles = supabase.table("kb_articles").select("title, content, source").execute().data
    existing_count = knowledge_base_collection.count()

    if existing_count > 0:
        return {"rebuilt": False, "reason": "Chroma already has data", "count": existing_count}

    for article in articles:
        chunks = chunk_text(article["content"])
        doc_id = str(uuid.uuid4())
        chunk_ids = [f"{doc_id}-chunk-{i}" for i in range(len(chunks))]
        metadatas = [{"title": article["title"], "chunk_index": i} for i in range(len(chunks))]
        knowledge_base_collection.add(documents=chunks, ids=chunk_ids, metadatas=metadatas)

    return {"rebuilt": True, "articles_processed": len(articles)}
