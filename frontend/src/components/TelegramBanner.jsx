import { useState, useEffect } from "react";

const STORAGE_KEY = "cerebrix_telegram_banner";

function TelegramBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== "dismissed") {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setDismissed(true);
  }

  return (
    <div className="relative flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3 mb-4">
      <a
        href="https://t.me/Cer_amiya_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity"
      >
        <div>
          <p className="text-sm font-medium text-blue-800">This assistant is also available on Telegram</p>
          <p className="text-xs text-blue-600">Same AI, same knowledge base — try @Cer_amiya_bot</p>
        </div>
        <span className="text-blue-600 text-sm font-semibold">Open →</span>
      </a>
      <button
        onClick={dismiss}
        className="ml-4 text-blue-400 hover:text-blue-700 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default TelegramBanner;
