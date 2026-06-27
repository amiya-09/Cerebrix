from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.supabase_client import supabase

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str


@router.get("/api/opportunities")
async def list_opportunities():
    response = (
        supabase.table("opportunities")
        .select("*")
        .order("detected_at", desc=True)
        .execute()
    )
    return response.data


@router.put("/api/opportunities/{opportunity_id}")
async def update_opportunity(opportunity_id: str, payload: StatusUpdate):
    if payload.status not in ["new", "reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    response = (
        supabase.table("opportunities")
        .update({"status": payload.status})
        .eq("id", opportunity_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return response.data[0]
