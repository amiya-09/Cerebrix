const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${API_URL}/api/knowledge/upload`, {
    method: "POST",
    body: formData,
  }).then((res) => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  });
}

export function listArticles() {
  return request("/api/knowledge/articles");
}

export function sendMessage(message, conversationId = null) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
}

export function listQueue() {
  return request("/api/queue");
}

export function approveQueueItem(id) {
  return request(`/api/queue/${id}/approve`, { method: "POST" });
}

export function editQueueItem(id, finalResponse) {
  return request(`/api/queue/${id}/edit`, {
    method: "POST",
    body: JSON.stringify({ final_response: finalResponse }),
  });
}

export function getDashboardSummary() {
  return request("/api/dashboard/summary");
}

export function listOpportunities() {
  return request("/api/opportunities");
}

export function updateOpportunityStatus(id, status) {
  return request(`/api/opportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
