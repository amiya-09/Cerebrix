import { useState, useEffect } from "react";
import { getConversationDetail } from "../api/client";

function ConversationTranscript({ conversationId, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    getConversationDetail(conversationId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [conversationId, refreshKey]);

  if (loading || !data) return <p className="text-gray-400 text-sm">Loading conversation...</p>;

  const { conversation, messages } = data;
  const lastMessage = messages[messages.length - 1];
  const awaitingHuman =
    conversation.status === "escalated" && lastMessage && lastMessage.role === "user";

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => (
        <Bubble key={i} message={msg} />
      ))}
      {awaitingHuman && (
        <div className="flex justify-start">
          <div className="bg-yellow-50 border border-yellow-300 px-4 py-2 rounded-lg max-w-md">
            <p className="text-yellow-800 text-sm">
              This question was sent to a human for review. Check back soon for a reply.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md">
          {message.content}
        </div>
      </div>
    );
  }
  const isHumanReviewed = message.metadata?.source === "human_reviewed";
  return (
    <div className="flex justify-start">
      <div className="bg-white border px-4 py-2 rounded-lg max-w-md">
        <p>{message.content}</p>
        {message.metadata?.confidence !== undefined && (
          <p className="text-xs text-gray-400 mt-1">Confidence: {message.metadata.confidence}%</p>
        )}
        {isHumanReviewed && (
          <p className="text-xs text-blue-500 mt-1">Answered by a human reviewer</p>
        )}
      </div>
    </div>
  );
}

export default ConversationTranscript;
