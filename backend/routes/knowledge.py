from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
import io

from vector.ingest import ingest_document
from db.supabase_client import supabase
from vector.chroma_client import knowledge_base_collection

router = APIRouter()


def extract_text(file: UploadFile, raw_bytes: bytes) -> str:
    if file.filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        return raw_bytes.decode("utf-8")


@router.post("/api/knowledge/upload")
async def upload_document(file: UploadFile = File(...)):
    raw_bytes = await file.read()

    try:
        text = extract_text(file, raw_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file. Use .txt or .pdf")

    if not text.strip():
        raise HTTPException(status_code=400, detail="File appears to be empty")

    existing = (
        supabase.table("kb_articles")
        .select("id, title")
        .eq("title", file.filename)
        .eq("content", text)
        .execute()
        .data
    )
    if existing:
        return {
            "title": file.filename,
            "chunks_created": 0,
            "note": "Identical document already exists — skipped duplicate upload"
        }

    result = ingest_document(text, title=file.filename)
    return result


@router.get("/api/knowledge/articles")
async def list_articles():
    response = supabase.table("kb_articles").select("id, title, source, created_at").execute()
    return response.data


@router.delete("/api/knowledge/articles/{article_id}")
async def delete_article(article_id: str):
    article = supabase.table("kb_articles").select("title").eq("id", article_id).execute().data
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    title = article[0]["title"]

    # Delete from Supabase FIRST — this is the source of truth. Once this row
    # is gone, rebuild_index_from_supabase() can never restore it on a future
    # server restart, even if Chroma deletion below has any issue.
    supabase.table("kb_articles").delete().eq("id", article_id).execute()

    # Now remove the actual searchable vectors so it stops being found
    # immediately, not just after the next restart.
    matching_chunks = knowledge_base_collection.get(where={"title": title})
    if matching_chunks["ids"]:
        knowledge_base_collection.delete(ids=matching_chunks["ids"])

    return {
        "deleted": True,
        "title": title,
        "chunks_removed": len(matching_chunks["ids"]) if matching_chunks["ids"] else 0,
    }
