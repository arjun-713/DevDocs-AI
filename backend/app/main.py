from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from project root regardless of where uvicorn is started
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="DevDocs AI API",
    description="API for the DevDocs AI RAG chatbot",
    version="0.1.0"
)

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.endpoints.ingest import router as ingest_router
from app.api.v1.endpoints.chat import router as chat_router

app.include_router(ingest_router, prefix="/api/v1", tags=["ingestion"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])

@app.get("/")
async def root():
    """
    Health check endpoint to verify the API is running.
    """
    return {
        "status": "online",
        "message": "Welcome to the DevDocs AI API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
