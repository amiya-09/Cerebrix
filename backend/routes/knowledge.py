from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
import io

from vector.ingest import ingest_document
from db.supabase_client import supabase

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
