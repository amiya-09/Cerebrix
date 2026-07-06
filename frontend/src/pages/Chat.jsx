import { useState } from "react";
import { sendMessage } from "../api/client";
import ConversationSidebar from "../components/ConversationSidebar";
import ConversationTranscript from "../components/ConversationTranscript";
import TelegramBanner from "../components/TelegramBanner";

function Chat() {
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUserText, setPendingUserText] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleNewChat() {
    setConversationId(null);
    setPendingUserText(null);
    setSendError(null);
  }

  function handleSelectConversation(id) {
    setConversationId(id);
    setPendingUserText(null);
    setSendError(null);
  }

  async function handleSend() {
    if (!input.trim()) return;
    const textSent = input;
    setPendingUserText(textSent);
    setInput("");
    setSendError(null);
    setLoading(true);

    try {
      const response = await sendMessage(textSent, conversationId);
      setConversationId(response.conversation_id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSendError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setPendingUserText(null);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div>
      <TelegramBanner />
      <div className="flex gap-6 h-[75vh] max-w-5xl mx-auto">
        <div className="w-1/3 flex flex-col border rounded-md bg-white overflow-hidden">
          <button
            onClick={handleNewChat}
            className="m-2 bg-blue-600 text-white text-sm py-2 rounded-md"
          >
            + New Chat
          </button>
          <div className="flex-1 overflow-y-auto">
            <ConversationSidebar
              selectedId={conversationId}
              onSelect={handleSelectConversation}
              refreshKey={refreshKey}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col border rounded-md bg-white p-4">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {conversationId ? (
              <ConversationTranscript conversationId={conversationId} refreshKey={refreshKey} />
            ) : (
              <p className="text-gray-400 text-sm">Start a new conversation below.</p>
            )}
            {pendingUserText && (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md opacity-70">
                  {pendingUserText}
                </div>
              </div>
            )}
            {loading && <div className="text-sm text-gray-400 italic">Thinking...</div>}
            {sendError && (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-300 px-4 py-2 rounded-lg max-w-md text-red-700 text-sm">
                  {sendError}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
