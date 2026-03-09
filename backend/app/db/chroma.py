import chromadb
import os

# Define the persistent directory for ChromaDB
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def get_chroma_client():
    """
    Returns a persistent ChromaDB client.
    """
    return chromadb.PersistentClient(path=DB_PATH)

def get_repo_collection_name(repo_url: str) -> str:
    """
    Generates a safe collection name from a GitHub URL.
    Example: https://github.com/fastapi/fastapi -> fastapi__fastapi
    """
    # Simple normalization: remove protocol and replace / with __
    name = repo_url.replace("https://", "").replace("http://", "").replace("github.com/", "")
    name = name.split("?")[0].split("#")[0] # Remove query/fragment
    name = name.replace("/", "__").replace(".", "_").replace("-", "_")
    return name[:63] # Chroma limit
