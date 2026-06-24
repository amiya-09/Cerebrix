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


def ingest_document(text: str, title: str) -> dict:
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
        "source": "uploaded"
    }).execute()

    return {"title": title, "chunks_created": len(chunks)}
