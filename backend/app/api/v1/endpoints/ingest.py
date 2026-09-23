from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import logging
import os
import time

from app.services.rag.ingestion.crawler import GitHubCrawler
from app.services.rag.processor import RAGProcessor
from app.services.rag.embedding_budget import get_embedding_budget_usage
from app.db.chroma import get_chroma_client, get_repo_collection_name

router = APIRouter()


@router.get("/embedding-budget")
async def get_embedding_budget():
    """Return cumulative embedding spend estimates and remaining token budget."""
    return get_embedding_budget_usage()

# In-memory status store (In production, use Redis or a DB)
ingestion_status: Dict[str, dict] = {}

class IngestRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    force: Optional[bool] = False

class IngestResponse(BaseModel):
    status: str
    repo_url: str
    collection_name: Optional[str] = None
    message: str



async def perform_ingestion(repo_url: str, branch: str, collection_name: str):
    """
    Background worker for ingestion logic.
    """
    try:
        ingestion_started = time.perf_counter()
        ingestion_status[collection_name] = {"status": "processing", "progress": 0}
        
        # 1. Crawl
        ingestion_status[collection_name]["progress"] = 5
        crawl_started = time.perf_counter()
        async with GitHubCrawler() as crawler:
            crawler_result = await crawler.crawl(repo_url, branch)
        crawl_seconds = time.perf_counter() - crawl_started
        
        if crawler_result.files_found == 0:
            ingestion_status[collection_name] = {"status": "failed", "error": "No documentation files found"}
            return

        ingestion_status[collection_name]["progress"] = 40

        # 2. Process and Chunk
        chunk_started = time.perf_counter()
        processor = RAGProcessor()
        chunks = processor.process_docs(crawler_result.files)
        chunk_seconds = time.perf_counter() - chunk_started

        ingestion_status[collection_name]["progress"] = 50

        # 3. Index in Chroma with progress callback
        def update_progress(pct):
            ingestion_status[collection_name]["progress"] = pct

        client = get_chroma_client()
        index_started = time.perf_counter()
        await processor.index_documents(client, collection_name, chunks, progress_callback=update_progress)
        index_seconds = time.perf_counter() - index_started

        ingestion_status[collection_name] = {
            "status": "completed", 
            "progress": 100,
            "files_processed": crawler_result.files_found,
            "chunks_created": len(chunks),
            "timings_seconds": {
                "crawl": round(crawl_seconds, 2),
                "chunking": round(chunk_seconds, 2),
                "embedding_and_storage": round(index_seconds, 2),
                "total": round(time.perf_counter() - ingestion_started, 2),
            },
        }

    except Exception as e:
        logging.error(f"Ingestion failed for {repo_url}: {e}")
        ingestion_status[collection_name] = {"status": "failed", "error": str(e)}

@router.post("/ingest", response_model=IngestResponse)
async def ingest_repository(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Triggers repository ingestion. Handles backgrounding and existing collection checks.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is required for repository embeddings")

    collection_name = get_repo_collection_name(request.repo_url)
    
    # If force re-ingest, delete the old collection first
    client = get_chroma_client()
    if request.force:
        try:
            client.delete_collection(name=collection_name)
            logging.info(f"Force re-ingest: deleted old collection {collection_name}")
        except Exception:
            pass  # Collection didn't exist
    else:
        # Check if already indexed
        try:
            existing_collection = client.get_collection(name=collection_name)
            if existing_collection.count() > 0:
                return IngestResponse(
                    status="completed",
                    repo_url=request.repo_url,
                    collection_name=collection_name,
                    message="Repository is already indexed and ready for chat."
                )
        except Exception:
            pass # Collection doesn't exist, proceed

    # Check if already in progress
    if collection_name in ingestion_status and ingestion_status[collection_name]["status"] == "processing":
        return IngestResponse(
            status="processing",
            repo_url=request.repo_url,
            collection_name=collection_name,
            message="Ingestion is already in progress."
        )

    # Start background task
    background_tasks.add_task(perform_ingestion, request.repo_url, request.branch, collection_name)

    return IngestResponse(
        status="accepted",
        repo_url=request.repo_url,
        collection_name=collection_name,
        message="Ingestion started in the background."
    )

@router.get("/ingest/status/{collection_name}")
async def get_ingestion_status(collection_name: str):
    """
    Endpoint for frontend to poll ingestion progress.
    """
    if collection_name not in ingestion_status:
        # Check if it exists in Chroma but not in our memory (e.g. server restarted)
        client = get_chroma_client()
        try:
            col = client.get_collection(name=collection_name)
            if col.count() > 0:
                return {"status": "completed", "progress": 100}
        except Exception:
            pass
        return {"status": "not_found"}
    
    return ingestion_status[collection_name]
