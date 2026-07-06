from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import knowledge, chat, queue, dashboard, opportunities, kb_builder, telegram_webhook, conversations
from vector.chroma_client import knowledge_base_collection

app = FastAPI(title="Cerebrix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://cerebrix.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def warm_up_embeddings():
    try:
        knowledge_base_collection.query(query_texts=["warmup"], n_results=1)
        print("Embedding model warmed up successfully")
    except Exception as e:
        print(f"Embedding warmup failed (non-fatal): {e}")

    try:
        from vector.ingest import rebuild_index_from_supabase
        result = rebuild_index_from_supabase()
        print(f"KB rebuild check: {result}")
    except Exception as e:
        print(f"KB rebuild failed (non-fatal): {e}")


app.include_router(knowledge.router)
app.include_router(chat.router)
app.include_router(queue.router)
app.include_router(dashboard.router)
app.include_router(opportunities.router)
app.include_router(kb_builder.router)
app.include_router(telegram_webhook.router)
app.include_router(conversations.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
