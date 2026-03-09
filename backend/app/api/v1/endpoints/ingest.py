from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import logging
import os

from app.services.rag.ingestion.crawler import GitHubCrawler
from app.services.rag.processor import RAGProcessor
from app.db.chroma import get_chroma_client, get_repo_collection_name

router = APIRouter()

# In-memory status store (In production, use Redis or a DB)
ingestion_status: Dict[str, dict] = {}

class IngestRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"

class IngestResponse(BaseModel):
    status: str
    repo_url: str
    collection_name: Optional[str] = None
    message: str



async def perform_ingestion(repo_url: str, branch: str, collection_name: str, api_key: str):
    """
    Background worker for ingestion logic.
    """
    try:
        ingestion_status[collection_name] = {"status": "processing", "progress": 0}
        
        # 1. Crawl
        async with GitHubCrawler() as crawler:
            crawler_result = await crawler.crawl(repo_url, branch)
        
        if crawler_result.files_found == 0:
            ingestion_status[collection_name] = {"status": "failed", "error": "No documentation files found"}
            return

        ingestion_status[collection_name]["progress"] = 50

        # 2. Process and Chunk
        processor = RAGProcessor(api_key=api_key)
        chunks = processor.process_docs(crawler_result.files)

        # 3. Index in Chroma
        client = get_chroma_client()
        await processor.index_documents(client, collection_name, chunks)

        ingestion_status[collection_name] = {
            "status": "completed", 
            "progress": 100,
            "files_processed": crawler_result.files_found,
            "chunks_created": len(chunks)
        }

    except Exception as e:
        logging.error(f"Ingestion failed for {repo_url}: {e}")
        ingestion_status[collection_name] = {"status": "failed", "error": str(e)}

@router.post("/ingest", response_model=IngestResponse)
async def ingest_repository(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Triggers repository ingestion. Handles backgrounding and existing collection checks.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key not configured")

    collection_name = get_repo_collection_name(request.repo_url)
    
    # Check if already indexed
    client = get_chroma_client()
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
    background_tasks.add_task(perform_ingestion, request.repo_url, request.branch, collection_name, api_key)

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
