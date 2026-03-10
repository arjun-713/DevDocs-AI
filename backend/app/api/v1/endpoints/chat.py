from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os

from app.services.rag.retriever import RAGRetriever
from app.services.rag.llm import LLMService
from app.db.chroma import get_repo_collection_name

router = APIRouter()

class ChatRequest(BaseModel):
    repo_url: str
    query: str
    model: Optional[str] = "gemini-2.5-flash"

class SourceMetadata(BaseModel):
    source: str
    url: str

@router.post("/chat")
async def chat_with_repo(request: ChatRequest):
    """
    Retrieves context and streams an answer from Gemini.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key not configured")

    collection_name = get_repo_collection_name(request.repo_url)
    
    try:
        # 1. Retrieve relevant chunks
        retriever = RAGRetriever(api_key=api_key)
        context_docs = retriever.get_relevant_documents(collection_name, request.query)
    except Exception as retrieval_error:
        error_msg = str(retrieval_error)
        if "does not exist" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404, 
                detail=f"Repository has not been ingested yet. Please call POST /api/v1/ingest first with repo_url: {request.repo_url}"
            )
        raise HTTPException(status_code=500, detail=error_msg)

    try:

        # 2. Setup LLM and metadata
        llm_service = LLMService(api_key=api_key, model_name=request.model)
        
        # Create a list of sources for the frontend to display as "Source Cards"
        sources = [
            {"source": doc.metadata.get("source"), "url": doc.metadata.get("url")}
            for doc in context_docs
        ]
        unique_sources = list({v['source']: v for v in sources}.values())

        async def generate():
            # Send the sources metadata as the first chunk in a special format
            yield f"METADATA:{json.dumps(unique_sources)}\n\n"
            
            # Stream the actual answer
            async for chunk in llm_service.stream_answer(request.query, context_docs):
                yield chunk

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
