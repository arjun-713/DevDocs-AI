"""
Repo ingestion script for RAG evaluation.

Crawls and indexes 6 public GitHub repos using the existing
RAG pipeline. Skips repos that are already cached in ChromaDB.
"""

import asyncio
import os
import sys
import logging

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from app.services.rag.ingestion.crawler import GitHubCrawler
from app.services.rag.processor import RAGProcessor
from app.db.chroma import get_chroma_client, get_repo_collection_name

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Target repositories ──
EVAL_REPOS = [
    "https://github.com/tiangolo/fastapi",
    "https://github.com/pallets/flask",
    "https://github.com/langchain-ai/langchain",
    "https://github.com/supabase/supabase",
    "https://github.com/pydantic/pydantic",
    "https://github.com/huggingface/transformers",
]


async def ingest_repo(repo_url: str, api_key: str) -> None:
    """Ingest a single repo, skipping if already cached."""
    collection_name = get_repo_collection_name(repo_url)
    client = get_chroma_client()

    # Check if already ingested
    try:
        existing = client.get_collection(name=collection_name)
        count = existing.count()
        if count > 0:
            logger.info(f"✅ CACHED  {repo_url} ({count} chunks)")
            return
    except Exception:
        pass  # Collection doesn't exist yet

    logger.info(f"📥 INGESTING  {repo_url} ...")

    # 1. Crawl
    async with GitHubCrawler() as crawler:
        result = await crawler.crawl(repo_url)

    if result.files_found == 0:
        logger.warning(f"⚠️  No docs found for {repo_url}")
        return

    logger.info(f"   Found {result.files_found} doc files")

    # 2. Process & chunk
    processor = RAGProcessor(api_key=api_key)
    chunks = processor.process_docs(result.files)
    logger.info(f"   Created {len(chunks)} chunks")

    # 3. Embed & store
    await processor.index_documents(client, collection_name, chunks)
    logger.info(f"✅ DONE    {repo_url} → {len(chunks)} chunks indexed")


async def main():
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("❌ GOOGLE_API_KEY not set. Cannot embed documents.")
        sys.exit(1)

    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "data")
    os.makedirs(data_dir, exist_ok=True)

    logger.info(f"Ingesting {len(EVAL_REPOS)} repos for evaluation...")

    for repo_url in EVAL_REPOS:
        try:
            await ingest_repo(repo_url, api_key)
        except Exception as e:
            logger.error(f"❌ Failed to ingest {repo_url}: {e}")
            # Continue with remaining repos
            continue

    logger.info("🏁 Ingestion complete!")


if __name__ == "__main__":
    asyncio.run(main())
