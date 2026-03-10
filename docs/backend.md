# Backend Reference

This document provides a detailed overview of every key file in the `/backend` directory, their purpose, key functions, and implementation notes.

## Table of Contents

- [app/main.py](#appmainpy)
- [app/api/v1/endpoints/ingest.py](#appapiv1endpointsingestpy)
- [app/api/v1/endpoints/chat.py](#appapiv1endpointschatpy)
- [app/services/rag/ingestion/crawler.py](#appservicesragingestioncrawlerpy)
- [app/services/rag/processor.py](#appservicesragprocessorpy)
- [app/services/rag/retriever.py](#appservicesragretrieverpy)
- [app/services/rag/llm.py](#appservicesragllmpy)
- [.env.example](#envexample)

---

## `app/main.py`
**Purpose**: The primary entry point for the FastAPI application.
- **Key Functions**:
  - Initializes FastAPI, loads `.env` files, configures CORS middleware.
  - Mounts routers (`ingest_router` and `chat_router`).
  - Provides a basic health check endpoint `/`.
- **Implementation Note**: Runs on uvicorn (`http://0.0.0.0:8000`). Make sure you start the backend from the root if you use `.env` files here.

## `app/api/v1/endpoints/ingest.py`
**Purpose**: Defines the API routes for starting and monitoring the repository ingestion process.
- **Key Functions**:
  - `ingest_repository(...)`: Accepts `POST /api/v1/ingest`. Validates the URL, checks if a Chroma collection already exists, and triggers the background task to proceed. Returns a status payload immediately.
  - `perform_ingestion(...)`: The background worker that connects the GitHub crawler, processing, and indexing logic. Updates an in-memory dictionary with the progress (`0-100%`).
  - `get_ingestion_status(...)`: Accepts `GET /api/v1/ingest/status/{collection_name}` allowing the frontend to poll for progress.
- **Implementation Note**: Progress state is held in an in-memory dictionary. If the FastAPI server restarts during ingestion, the status is lost.

## `app/api/v1/endpoints/chat.py`
**Purpose**: Defines the API route for interacting with the indexed repository.
- **Key Functions**:
  - `chat_with_repo(...)`: Accepts `POST /api/v1/chat`. Coordinates the query parsing, vector retrieval, and LLM streaming generator.
  - Generates a Server-Sent Events (SSE) stream returning chunks of text back to the React UI as the Gemini model thinks.
- **Implementation Note**: Prepends `METADATA:[JSON]\n\n` containing source citations before the first chunk of the LLM response is streamed, giving the UI real-time citations.

## `app/services/rag/ingestion/crawler.py`
**Purpose**: Asynchronously fetches repository documentation directly from GitHub.
- **Key Functions**:
  - `GitHubCrawler.crawl(...)`: Main entry point. Uses `get_repo_tree` to list every file in the repo. Filters to documentation via `is_doc_file`.
  - `fetch_file_content(...)`: Uses `httpx.AsyncClient` to fetch raw markdown contents with a semaphore (concurrency control) to avoid rate limits.
- **Implementation Note**: Caps maximum fetched documents via `MAX_FILES = 200` to prevent incredibly large SDKs from timing out the background crawler.

## `app/services/rag/processor.py`
**Purpose**: Handles text chunking and vector embedding generation.
- **Key Functions**:
  - `process_docs(...)`: Utilizes LangChain's `RecursiveCharacterTextSplitter` (1500 chars, 150 overlap) to chunk documentation. Caps extremely large files at 50KB to preserve memory.
  - `index_documents(...)`: Batches document chunks (50 at a time) and embeds them using Gemini's embedding API. Inserts them into ChromaDB.
- **Implementation Note**: Contains critical exponential backoff and retry logic catching `RESOURCE_EXHAUSTED` (429 HTTP) errors to gracefully handle free-tier Google API rate limits.

## `app/services/rag/retriever.py`
**Purpose**: Searches ChromaDB for relevant vector embeddings matching a user's prompt.
- **Key Functions**:
  - `RAGRetriever.get_context(...)`: Executes a similarity vector search (`k=5`). Deduplicates matching URLs from the metadata to ensure unique source citations.
- **Implementation Note**: Depends on `get_chroma_client()` to get a database reference.

## `app/services/rag/llm.py`
**Purpose**: Initializes and interacts with the Google Gemini LLM API via LangChain.
- **Key Functions**:
  - `LLMService(model_name=...)`: Instantiates `ChatGoogleGenerativeAI`. Accepts a configurable `model_name` from the UI.
  - `generate_response(...)`: Builds the system prompt using retrieved documentation context from the retriever, instructing the LLM to only use the provided context. Returns an asynchronous generator.
- **Implementation Note**: Uses a timeout of 120s and `max_retries=2` to ensure large context queries do not fail mid-stream.

## `.env.example`
**Purpose**: Template for required environment variables.
- **Key Functions**: Contains placeholders for `GOOGLE_API_KEY` (required) and `GITHUB_TOKEN` (optional).
- **Implementation Note**: Copy this file to `.env` before running the backend.
