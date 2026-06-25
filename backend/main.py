from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import knowledge, chat

app = FastAPI(title="Cerebrix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
