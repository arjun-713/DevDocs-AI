from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.services.rag.ingestion.crawler import GitHubCrawler
from app.services.rag.processor import RAGProcessor
from app.db.chroma import get_chroma_client, get_repo_collection_name
import os

router = APIRouter()

class IngestRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"

class IngestResponse(BaseModel):
    status: str
    repo_url: str
    collection_name: str
    files_processed: int
    chunks_created: int

@router.post("/ingest", response_model=IngestResponse)
async def ingest_repository(request: IngestRequest):
    """
    Ingests a GitHub repository documentation into ChromaDB.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key (GOOGLE_API_KEY or GEMINI_API_KEY) is not configured")

    try:
        # 1. Crawl the repo
        async with GitHubCrawler() as crawler:
            crawler_result = await crawler.crawl(request.repo_url, request.branch)
        
        if crawler_result.files_found == 0:
            raise HTTPException(status_code=400, detail="No documentation files found in repository")

        # 2. Process and Chunk
        processor = RAGProcessor(api_key=api_key)
        chunks = processor.process_docs(crawler_result.files)

        # 3. Index in Chroma
        client = get_chroma_client()
        collection_name = get_repo_collection_name(request.repo_url)
        
        chunks_indexed = await processor.index_documents(client, collection_name, chunks)

        return IngestResponse(
            status="success",
            repo_url=request.repo_url,
            collection_name=collection_name,
            files_processed=crawler_result.files_found,
            chunks_created=chunks_indexed
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
