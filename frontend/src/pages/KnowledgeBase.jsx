import { useState, useEffect } from "react";
import { listArticles, uploadDocument } from "../api/client";

function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function loadArticles() {
    setLoading(true);
    const data = await listArticles();
    setArticles(data);
    setLoading(false);
  }

  useEffect(() => {
    loadArticles();
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      await loadArticles();
    } catch (err) {
      setError("Upload failed. Make sure it's a .txt or .pdf file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border rounded-md bg-white p-4 mb-6">
        <label className="block text-sm font-medium mb-2">
          Upload a document (.txt or .pdf)
        </label>
        <input
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && (
          <p className="text-sm text-gray-400 mt-2">Uploading and processing...</p>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="border rounded-md bg-white">
        <h3 className="text-sm font-semibold p-3 border-b">
          Uploaded Articles ({articles.length})
        </h3>
        {loading ? (
          <p className="p-4 text-gray-400 text-sm">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">Nothing uploaded yet.</p>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="p-3 border-b text-sm">
              <p className="font-medium">{article.title}</p>
              <p className="text-xs text-gray-400">
                {article.source} ·{" "}
                {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
