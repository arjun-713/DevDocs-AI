import chromadb
import os

# Define the persistent directory for ChromaDB
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
EMBEDDING_COLLECTION_SUFFIX = "__openai_text_3_small"

def get_chroma_client():
    """
    Returns a server-backed Chroma client in Compose or a local persistent client.
    """
    chroma_host = os.getenv("CHROMA_HOST")
    if chroma_host:
        return chromadb.HttpClient(
            host=chroma_host,
            port=int(os.getenv("CHROMA_PORT", "8000")),
        )
    return chromadb.PersistentClient(path=DB_PATH)

def get_repo_collection_name(repo_url: str) -> str:
    """
    Generates a safe collection name from a GitHub URL.
    Collection names are versioned to keep current 1536-d vectors separate
    from earlier local 384-d BGE vectors and legacy collections.
    """
    # Simple normalization: remove protocol and replace / with __
    name = repo_url.replace("https://", "").replace("http://", "").replace("github.com/", "")
    name = name.split("?")[0].split("#")[0] # Remove query/fragment
    name = name.replace("/", "__").replace(".", "_").replace("-", "_")
    max_base_length = 63 - len(EMBEDDING_COLLECTION_SUFFIX)
    return f"{name[:max_base_length]}{EMBEDDING_COLLECTION_SUFFIX}"
