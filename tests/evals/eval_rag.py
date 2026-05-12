"""
Eval-specific RAG pipeline using Ollama embeddings.

Completely independent from the production pipeline — no Google API needed.
Uses nomic-embed-text via Ollama for embeddings and ChromaDB for storage.
"""

import os
import requests
import logging
from typing import List

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
EVAL_DATA_DIR = os.path.join(os.path.dirname(__file__), "eval_data")
EMBED_MODEL = "nomic-embed-text"


def ollama_embed(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts using Ollama's nomic-embed-text model."""
    embeddings = []
    for text in texts:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/embed",
            json={"model": EMBED_MODEL, "input": text},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        # Handle both response formats
        if "embeddings" in data:
            embeddings.append(data["embeddings"][0])
        elif "embedding" in data:
            embeddings.append(data["embedding"])
        else:
            raise ValueError(f"Unexpected Ollama embed response: {list(data.keys())}")
    return embeddings


def get_eval_chroma_client():
    """Get a ChromaDB client for the eval data directory."""
    os.makedirs(EVAL_DATA_DIR, exist_ok=True)
    return chromadb.PersistentClient(path=EVAL_DATA_DIR)


def get_collection_name(repo_url: str) -> str:
    """Generate a collection name from a repo URL."""
    parts = repo_url.rstrip("/").split("/")
    owner, repo = parts[-2], parts[-1]
    name = f"eval_{owner}_{repo}".replace("-", "_").replace(".", "_")
    # ChromaDB names must be 3-63 chars
    return name[:63]


class EvalProcessor:
    """Chunks and embeds documents using Ollama (local, no API keys)."""

    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=150,
            length_function=len,
        )

    def process_docs(self, repo_docs) -> List[Document]:
        """Split docs into chunks."""
        MAX_FILE_SIZE = 50_000
        all_chunks = []

        for doc in repo_docs:
            if not doc.content:
                continue
            content = doc.content[:MAX_FILE_SIZE] if len(doc.content) > MAX_FILE_SIZE else doc.content
            chunks = self.text_splitter.split_text(content)

            for i, chunk_text in enumerate(chunks):
                all_chunks.append(Document(
                    page_content=chunk_text,
                    metadata={"source": doc.path, "url": doc.url, "chunk_index": i},
                ))
        return all_chunks

    def index_documents(self, collection_name: str, documents: List[Document]):
        """Embed and store documents in ChromaDB using Ollama embeddings."""
        client = get_eval_chroma_client()
        collection = client.get_or_create_collection(name=collection_name)

        batch_size = 20
        total_indexed = 0

        for start in range(0, len(documents), batch_size):
            batch = documents[start : start + batch_size]
            texts = [doc.page_content for doc in batch]
            metadatas = [doc.metadata for doc in batch]
            ids = [f"{doc.metadata['source']}_chunk_{start + i}" for i, doc in enumerate(batch)]

            embeddings = ollama_embed(texts)
            collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids,
            )
            total_indexed += len(ids)
            logger.info(f"  Indexed {total_indexed}/{len(documents)} chunks")

        return total_indexed


class EvalRetriever:
    """Retrieves relevant docs from eval ChromaDB using Ollama embeddings."""

    def get_relevant_documents(self, collection_name: str, query: str, k: int = 5) -> List[Document]:
        client = get_eval_chroma_client()
        collection = client.get_collection(name=collection_name)

        query_embedding = ollama_embed([query])[0]

        fetch_count = min(k * 3, collection.count())
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=fetch_count,
        )

        # Deduplicate overlapping chunks
        selected: List[Document] = []
        if results["documents"]:
            for i in range(len(results["documents"][0])):
                doc = Document(
                    page_content=results["documents"][0][i],
                    metadata=results["metadatas"][0][i],
                )
                is_dup = False
                for existing in selected:
                    overlap = self._text_overlap(doc.page_content, existing.page_content)
                    if overlap > 0.6:
                        is_dup = True
                        break
                if not is_dup:
                    selected.append(doc)
                if len(selected) >= k:
                    break
        return selected

    @staticmethod
    def _text_overlap(a: str, b: str) -> float:
        shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
        if not shorter:
            return 0.0
        shorter_words = set(shorter.lower().split())
        longer_words = set(longer.lower().split())
        if not shorter_words:
            return 0.0
        return len(shorter_words & longer_words) / len(shorter_words)
