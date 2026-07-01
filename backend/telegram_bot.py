import logging
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

from config import TELEGRAM_BOT_TOKEN
from core.pipeline import process_message, get_or_create_conversation

logging.basicConfig(level=logging.INFO)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    user_text = update.message.text

    conversation_id = get_or_create_conversation(chat_id, channel="telegram")
    result = process_message(user_text, conversation_id, channel="telegram")

    if result["status"] == "answered":
        reply = result["answer"]
    else:
        reply = (
            "Thanks for reaching out. I've passed this along to a member of "
            "our team, and you'll hear back soon."
        )

    await update.message.reply_text(reply)


def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("Telegram bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()
