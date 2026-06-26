from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import knowledge, chat, queue, dashboard

app = FastAPI(title="Cerebrix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge.router)
app.include_router(chat.router)
app.include_router(queue.router)
app.include_router(dashboard.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
