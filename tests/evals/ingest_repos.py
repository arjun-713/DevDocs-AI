"""
Repo ingestion script for RAG evaluation (fully local).

Uses Ollama embeddings (nomic-embed-text) instead of Google API.
Crawls 1 repo (FastAPI) and stores in a separate eval ChromaDB.
"""

import asyncio
import os
import sys
import logging

# Add backend to path for the crawler (which has no API dependency)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.services.rag.ingestion.crawler import GitHubCrawler
from eval_rag import EvalProcessor, get_eval_chroma_client, get_collection_name

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Single repo for now
EVAL_REPOS = [
    "https://github.com/tiangolo/fastapi",
]


async def ingest_repo(repo_url: str) -> None:
    """Ingest a single repo using local Ollama embeddings."""
    collection_name = get_collection_name(repo_url)
    client = get_eval_chroma_client()

    # Check if already ingested
    try:
        existing = client.get_collection(name=collection_name)
        count = existing.count()
        if count > 0:
            logger.info(f"✅ CACHED  {repo_url} ({count} chunks)")
            return
    except Exception:
        pass

    logger.info(f"📥 INGESTING  {repo_url} ...")

    # 1. Crawl (uses GitHub API — no auth needed for public repos)
    async with GitHubCrawler() as crawler:
        result = await crawler.crawl(repo_url)

    if result.files_found == 0:
        logger.warning(f"⚠️  No docs found for {repo_url}")
        return

    logger.info(f"   Found {result.files_found} doc files")

    # 2. Process & chunk (no API needed)
    processor = EvalProcessor()
    chunks = processor.process_docs(result.files)
    logger.info(f"   Created {len(chunks)} chunks")

    # 3. Embed with Ollama & store in ChromaDB (fully local)
    processor.index_documents(collection_name, chunks)
    logger.info(f"✅ DONE    {repo_url} → {len(chunks)} chunks indexed")


async def main():
    logger.info(f"Ingesting {len(EVAL_REPOS)} repo(s) for evaluation (fully local)...")
    logger.info("Using Ollama nomic-embed-text for embeddings — no API keys needed.")

    for repo_url in EVAL_REPOS:
        try:
            await ingest_repo(repo_url)
        except Exception as e:
            logger.error(f"❌ Failed to ingest {repo_url}: {e}")
            raise  # Fail fast with 1 repo

    logger.info("🏁 Ingestion complete!")


if __name__ == "__main__":
    asyncio.run(main())
