import { useState, useEffect } from "react";
import { getDashboardSummary } from "../api/client";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await getDashboardSummary();
        setSummary(data);
        setError(null);
      } catch (err) {
        setError("Couldn't reach the backend.");
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!summary) return <p className="text-gray-400">Loading dashboard...</p>;

  const cards = [
    { label: "Total Conversations", value: summary.total_conversations },
    { label: "Resolved", value: summary.resolved },
    { label: "Escalated", value: summary.escalated },
    { label: "Pending in Queue", value: summary.pending_in_queue },
    {
      label: "Average Confidence",
      value:
        summary.average_confidence !== null
          ? `${summary.average_confidence}%`
          : "—",
    },
  ];

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Auto-refreshing every 5 seconds</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border rounded-md bg-white p-4">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
