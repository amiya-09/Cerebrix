import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/client";
import TelegramBanner from "../components/TelegramBanner";

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
    { label: "Total Conversations", value: summary.total_conversations, link: "/conversations" },
    { label: "Resolved", value: summary.resolved, link: "/conversations?status=resolved" },
    { label: "Escalated", value: summary.escalated, link: "/conversations?status=escalated" },
    { label: "Pending in Queue", value: summary.pending_in_queue, link: "/queue" },
    {
      label: "Average Confidence",
      value: summary.average_confidence !== null ? `${summary.average_confidence}%` : "—",
    },
    {
      label: "Avg Health Score",
      value: summary.average_health_score !== null ? summary.average_health_score : "—",
      alert: summary.average_health_score !== null && summary.average_health_score < 50,
    },
    {
      label: "Frustrated Today",
      value: summary.frustrated_today,
      alert: summary.frustrated_today > 0,
    },
  ];

  return (
    <div>
      <TelegramBanner />
      <p className="text-xs text-gray-400 mb-4">Auto-refreshing every 5 seconds</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const content = (
            <div className="border rounded-md bg-white p-4 hover:shadow-md transition-shadow">
              <p className={`text-2xl font-bold ${card.alert ? "text-red-600" : ""}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
          return card.link ? (
            <Link key={card.label} to={card.link}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {summary.channel_breakdown && (
        <div className="mt-6 border rounded-md bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">CONVERSATIONS BY CHANNEL</p>
          <div className="space-y-2">
            {Object.entries(summary.channel_breakdown).map(([channel, count]) => {
              const total = Object.values(summary.channel_breakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={channel}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="uppercase font-medium">{channel}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
