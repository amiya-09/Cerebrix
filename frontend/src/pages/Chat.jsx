import { useState } from "react";
import { sendMessage } from "../api/client";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(input, conversationId);
      setConversationId(response.conversation_id);

      if (response.status === "answered") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.answer,
            confidence: response.confidence,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "pending", confidence: response.confidence },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="text-sm text-gray-400 italic">Thinking...</div>
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
  );
}

function MessageBubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="flex justify-start">
        <div className="bg-white border px-4 py-2 rounded-lg max-w-md">
          <p>{message.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            Confidence: {message.confidence}%
          </p>
        </div>
      </div>
    );
  }

  if (message.role === "pending") {
    return (
      <div className="flex justify-start">
        <div className="bg-yellow-50 border border-yellow-300 px-4 py-2 rounded-lg max-w-md">
          <p className="text-yellow-800 text-sm">
            This question has been sent to a human for review. You'll get a
            response soon.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            AI confidence was too low to answer automatically ({message.confidence}%)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-red-50 border border-red-300 px-4 py-2 rounded-lg max-w-md text-red-700 text-sm">
        {message.content}
      </div>
    </div>
  );
}

export default Chat;
