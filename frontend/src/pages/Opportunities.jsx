import { useState, useEffect } from "react";
import { listOpportunities, updateOpportunityStatus } from "../api/client";

const TYPE_LABELS = {
  upsell: "Upsell",
  expansion: "Expansion",
  "cross-sell": "Cross-sell",
};

const STATUS_STYLES = {
  new: "bg-green-100 text-green-700",
  reviewed: "bg-blue-100 text-blue-700",
  dismissed: "bg-gray-100 text-gray-500",
};

function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOpportunities() {
    setLoading(true);
    const data = await listOpportunities();
    setOpportunities(data);
    setLoading(false);
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function handleUpdate(id, status) {
    setUpdatingId(id);
    await updateOpportunityStatus(id, status);
    await loadOpportunities();
    setUpdatingId(null);
  }

  if (loading) return <p className="text-gray-400">Loading opportunities...</p>;

  const newCount = opportunities.filter((o) => o.status === "new").length;

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm text-gray-500 mb-4">
        {newCount} new signal{newCount !== 1 ? "s" : ""} detected from support conversations
      </p>

      {opportunities.length === 0 ? (
        <p className="text-gray-400 text-sm">No opportunities detected yet.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div key={opp.id} className="border rounded-md bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-purple-100 text-purple-700">
                  {TYPE_LABELS[opp.type] || opp.type}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${STATUS_STYLES[opp.status]}`}>
                  {opp.status}
                </span>
              </div>

              <p className="text-sm text-gray-700 italic mb-1">"{opp.signal_text}"</p>
              <p className="text-xs text-gray-400 mb-3">
                {opp.value_estimate} · confidence {opp.confidence}%
              </p>

              {opp.status === "new" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(opp.id, "reviewed")}
                    disabled={updatingId === opp.id}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdate(opp.id, "dismissed")}
                    disabled={updatingId === opp.id}
                    className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Opportunities;
