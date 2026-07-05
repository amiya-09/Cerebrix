import chromadb
import os
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chroma_client = chromadb.PersistentClient(path=os.path.join(BASE_DIR, "chroma_data"))

embedding_function = DefaultEmbeddingFunction()

knowledge_base_collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=embedding_function
)
