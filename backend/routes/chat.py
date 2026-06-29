from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from core.pipeline import process_message

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("/api/chat")
async def chat(payload: ChatRequest):
    return process_message(payload.message, payload.conversation_id, channel="web")
