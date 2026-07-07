import { useState, useEffect, useRef } from "react";
import { listArticles, uploadDocument, deleteArticle } from "../api/client";

const SOURCE_STYLES = {
  uploaded: "bg-blue-50 text-blue-700",
  "auto-generated": "bg-indigo-50 text-indigo-700",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FileTypeBadge({ title }) {
  const m = title?.match(/\.(pdf|txt)$/i);
  if (!m) return null;
  const ext = m[1].toUpperCase();
  const style = ext === "PDF" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500";
  return (
    <span className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded ${style}`}>
      {ext}
    </span>
  );
}

function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);

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
    setUploadSuccess(false);
    try {
      await uploadDocument(file);
      await loadArticles();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError("Upload failed. Make sure it's a .txt or .pdf file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id, title) {
    const confirmed = window.confirm(
      `Delete "${title}"? This removes it from the knowledge base permanently — future questions about it will no longer be answered automatically.`
    );
    if (!confirmed) return;
    await deleteArticle(id);
    await loadArticles();
  }

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border rounded-md bg-white p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Upload a document</p>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 cursor-pointer"
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <svg
            className="mx-auto mb-2 text-blue-400"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v10m-3-3l3-3 3 3"
            />
          </svg>
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading and processing...</p>
          ) : (
            <>
              <p className="text-sm font-medium text-blue-700">Click to upload</p>
              <p className="text-xs text-gray-400 mt-1">.txt or .pdf</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        {uploadSuccess && (
          <p className="text-sm text-green-600 mt-3">Uploaded successfully</p>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="border rounded-md bg-white">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-semibold">
            Uploaded Articles ({articles.length})
          </h3>
          {articles.length > 3 && (
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          )}
        </div>
        {loading ? (
          <p className="p-4 text-gray-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">
            {search ? "No articles match your search." : "Nothing uploaded yet."}
          </p>
        ) : (
          filtered.map((article) => (
            <div
              key={article.id}
              className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{article.title}</p>
                  <FileTypeBadge title={article.title} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      SOURCE_STYLES[article.source] || "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {article.source}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(article.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(article.id, article.title)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline shrink-0 self-center"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
