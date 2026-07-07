import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ConversationSidebar from "../components/ConversationSidebar";
import ConversationTranscript from "../components/ConversationTranscript";

function Conversations() {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  function handleFilterClick(status) {
    navigate(status ? `/conversations?status=${status}` : "/conversations");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <p className="text-sm text-gray-500 mb-4">
        {statusFilter ? `Showing "${statusFilter}" conversations` : "All conversations"}
      </p>
      <div className="flex gap-2 mb-4">
        {[
          { label: "All", value: null },
          { label: "Resolved", value: "resolved" },
          { label: "Escalated", value: "escalated" },
        ].map((filter) => (
          <button
            key={filter.label}
            onClick={() => handleFilterClick(filter.value)}
            className={`text-sm px-3 py-1.5 rounded-md ${
              statusFilter === filter.value
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="flex gap-6 h-[70vh]">
        <div className="w-1/3 border rounded-md bg-white overflow-y-auto">
          <ConversationSidebar
            selectedId={selectedId}
            onSelect={setSelectedId}
            refreshKey={0}
            statusFilter={statusFilter}
          />
        </div>
        <div className="flex-1 border rounded-md bg-white p-4 overflow-y-auto">
          {selectedId ? (
            <ConversationTranscript conversationId={selectedId} refreshKey={0} />
          ) : (
            <p className="text-gray-400 text-sm">Select a conversation to view its transcript.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Conversations;
