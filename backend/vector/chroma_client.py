import os
import chromadb
from chromadb.utils import embedding_functions

_CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chroma_data")
chroma_client = chromadb.PersistentClient(path=_CHROMA_PATH)

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

knowledge_base_collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=embedding_function
)
