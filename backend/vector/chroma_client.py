import chromadb
from chromadb.utils import embedding_functions

chroma_client = chromadb.PersistentClient(path="./chroma_data")

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

knowledge_base_collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=embedding_function
)
