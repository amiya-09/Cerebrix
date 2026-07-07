from fastapi import APIRouter, Request, BackgroundTasks
from telegram import Update, Bot

from config import TELEGRAM_BOT_TOKEN
from core.pipeline import process_message, get_or_create_conversation

router = APIRouter()
bot = Bot(token=TELEGRAM_BOT_TOKEN) if TELEGRAM_BOT_TOKEN else None


async def handle_telegram_message(chat_id: str, user_text: str):
    conversation_id = get_or_create_conversation(chat_id, channel="telegram")
    result = process_message(user_text, conversation_id, channel="telegram")

    if result["status"] == "answered":
        reply = result["answer"]
    else:
        reply = (
            "Thanks for reaching out. I've passed this along to a member of "
            "our team, and you'll hear back soon."
        )

    await bot.send_message(chat_id=int(chat_id), text=reply)


@router.post("/api/telegram/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    if not bot:
        return {"ok": False, "error": "Bot not configured"}

    data = await request.json()
    update = Update.de_json(data, bot)

    if not update.message or not update.message.text:
        return {"ok": True}

    chat_id = str(update.effective_chat.id)
    user_text = update.message.text

    if user_text.startswith("/"):
        if user_text == "/start":
            background_tasks.add_task(
                bot.send_message,
                chat_id=int(chat_id),
                text="Hi! I'm Cerebrix Support. Ask me anything."
            )
        return {"ok": True}

    # Return immediately — Telegram gets its 200 OK right away, so it won't
    # retry. The actual (slower) AI pipeline runs after this response is sent.
    background_tasks.add_task(handle_telegram_message, chat_id, user_text)
    return {"ok": True}
