from fastapi import APIRouter
from agents.kb_builder_agent import build_articles

router = APIRouter()


@router.post("/api/knowledge/build")
async def trigger_kb_build():
    return build_articles()
