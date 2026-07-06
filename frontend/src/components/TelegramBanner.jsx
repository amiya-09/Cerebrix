function TelegramBanner() {
  return (
    <a
      href="https://t.me/Cer_amiya_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3 mb-4 hover:bg-blue-100 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-blue-800">
          This assistant is also available on Telegram
        </p>
        <p className="text-xs text-blue-600">
          Same AI, same knowledge base — try @Cer_amiya_bot
        </p>
      </div>
      <span className="text-blue-600 text-sm font-semibold">Open →</span>
    </a>
  );
}

export default TelegramBanner;
