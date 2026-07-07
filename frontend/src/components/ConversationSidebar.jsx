import { useState, useEffect } from "react";
import { listConversations } from "../api/client";

const STATUS_COLORS = {
  resolved: "bg-green-100 text-green-700",
  escalated: "bg-yellow-100 text-yellow-700",
  open: "bg-gray-100 text-gray-500",
};

function ConversationSidebar({ selectedId, onSelect, refreshKey, statusFilter = null }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listConversations(statusFilter).then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, [refreshKey, statusFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      listConversations(statusFilter).then(setConversations);
    }, 8000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  if (loading) return <p className="p-4 text-gray-400 text-sm">Loading sessions...</p>;
  if (conversations.length === 0)
    return <p className="p-4 text-gray-400 text-sm">No conversations yet.</p>;

  return (
    <div>
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
            c.id === selectedId ? "bg-blue-50" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase">{c.channel}</span>
            <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLORS[c.status] || STATUS_COLORS.open}`}>
              {c.status}
            </span>
          </div>
          <p className="text-sm truncate">{c.preview || "(no message)"}</p>
        </button>
      ))}
    </div>
  );
}

export default ConversationSidebar;
