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
  - Generates a streamed response from the configured OpenAI model for the React UI.
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
  - `index_documents(...)`: Batches document chunks, reserves their input-token estimate against the shared cap, creates OpenAI vectors, and overlaps embedding requests with bounded Chroma upserts.
- **Implementation Note**: A persistent SQLite ledger caps embedding endpoint usage at $0.50 (25 million tokens at the current `text-embedding-3-small` rate). It serializes reservations across concurrent ingests and chat-query embedding requests.

## `app/services/rag/retriever.py`
**Purpose**: Searches ChromaDB for relevant vector embeddings matching a user's prompt.
- **Key Functions**:
  - `RAGRetriever.get_relevant_documents(...)`: Embeds the query with `text-embedding-3-small`, executes a similarity vector search (`k=5`), and removes overlapping chunks from the retrieved context.
- **Implementation Note**: Depends on `get_chroma_client()` to get a database reference.

## `app/services/rag/llm.py`
**Purpose**: Initializes and interacts with the OpenAI chat API via LangChain. This is the only runtime feature that needs an OpenAI key.
- **Key Functions**:
  - `LLMService(model_name=...)`: Instantiates `ChatOpenAI`. The UI-selected model is used; the server default is `gpt-6-luna` (`OPENAI_MODEL` can override the fallback).
  - `generate_response(...)`: Builds the system prompt using retrieved documentation context from the retriever, instructing the LLM to only use the provided context. Returns an asynchronous generator.
- **Implementation Note**: Uses a timeout of 120s and `max_retries=2`. GPT-6 Luna requires the API's default temperature value of `1`.

## `.env.example`
**Purpose**: Template for required environment variables.
- **Key Functions**: Uses `OPENAI_API_KEY` for both capped embeddings and answer generation. The key remains server-side.
- **Implementation Note**: Copy this file to `.env` before running the backend.
