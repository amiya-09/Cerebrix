import { useState, useEffect } from "react";
import { listQueue, approveQueueItem, editQueueItem } from "../api/client";

function Queue() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadQueue() {
    setLoading(true);
    const data = await listQueue();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  const selectedItem = items.find((item) => item.id === selectedId);

  function handleSelect(item) {
    setSelectedId(item.id);
    setDraftText(item.ai_draft);
  }

  async function handleApprove() {
    setSubmitting(true);
    await approveQueueItem(selectedId);
    setSelectedId(null);
    await loadQueue();
    setSubmitting(false);
  }

  async function handleSendEdited() {
    setSubmitting(true);
    await editQueueItem(selectedId, draftText);
    setSelectedId(null);
    await loadQueue();
    setSubmitting(false);
  }

  if (loading) return <p className="text-gray-400">Loading queue...</p>;

  return (
    <div className="flex gap-6 h-[70vh]">
      <div className="w-1/3 border rounded-md bg-white overflow-y-auto">
        {items.length === 0 && (
          <p className="p-4 text-gray-400 text-sm">No pending items. Nice.</p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item)}
            className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
              item.id === selectedId ? "bg-blue-50" : ""
            }`}
          >
            <p className="text-sm truncate">{item.ai_draft}</p>
            <p className="text-xs text-gray-400 mt-1">
              Confidence: {item.confidence}%
            </p>
          </button>
        ))}
      </div>

      <div className="flex-1 border rounded-md bg-white p-4">
        {!selectedItem ? (
          <p className="text-gray-400 text-sm">
            Select an item from the list to review it.
          </p>
        ) : (
          <div className="flex flex-col h-full">
            <p className="text-sm text-gray-500 mb-2">
              AI confidence: {selectedItem.confidence}% — below the auto-send threshold
            </p>
            <textarea
              className="flex-1 border rounded-md p-3 text-sm"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                Approve as-is
              </button>
              <button
                onClick={handleSendEdited}
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                Send edited response
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Queue;
