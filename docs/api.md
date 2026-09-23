# API Reference

This document outlines the REST API endpoints provided by the FastAPI backend. The API runs locally on `http://127.0.0.1:8000`; in Docker Compose, Next.js proxies `/api/*` to the backend service. The proxied OpenAPI docs are at `http://localhost:3000/api/docs`.

## Table of Contents

- [Endpoints Overview](#endpoints-overview)
- [Health Check `GET /`](#health-check-get-)
- [Trigger Ingestion `POST /api/v1/ingest`](#trigger-ingestion-post-apiv1ingest)
- [Check Ingestion Status `GET /api/v1/ingest/status/{collection}`](#check-ingestion-status-get-apiv1ingeststatuscollection)
- [Embedding Budget `GET /api/v1/embedding-budget`](#embedding-budget-get-apiv1embedding-budget)
- [Chat with Repository `POST /api/v1/chat`](#chat-with-repository-post-apiv1chat)

---

## Endpoints Overview

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Health check endpoint indicating if the FastAPI framework is online. |
| `POST` | `/api/v1/ingest` | Kick off the asynchronous process to crawl and embed a GitHub codebase. |
| `GET`  | `/api/v1/ingest/status/{col}` | Poll for dynamic ingestion progress from 0-100%. |
| `GET`  | `/api/v1/embedding-budget` | Check the cumulative embedding-token allowance and estimated spend. |
| `POST` | `/api/v1/chat` | Send a query string to the retrieval system utilizing Server-Sent Events (SSE). |

---

## Health Check `GET /`

Check whether the FastAPI server is running correctly.

**Example Request:**
```bash
curl -X GET http://localhost:8000/
```

**Example Response:**
```json
{
  "status": "online",
  "message": "Welcome to the DevDocs AI API",
  "documentation": "/docs"
}
```

---

## Trigger Ingestion `POST /api/v1/ingest`

Initiates the GitHub crawler and LangChain indexing process for a provided repository. If a valid `force=true` parameter is passed, the old ChromaDB collection is wiped before restarting. Returns `accepted` if a background process was spawned, or `completed` if the repository was previously fully indexed.

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/fastapi/fastapi",
    "branch": "main",
    "force": false
  }'
```

**Example Response:**
```json
{
  "status": "accepted",
  "repo_url": "https://github.com/fastapi/fastapi",
  "collection_name": "fastapi__fastapi__openai_text_3_small",
  "message": "Ingestion started in the background."
}
```

---

## Check Ingestion Status `GET /api/v1/ingest/status/{collection}`

Poll this endpoint while `status === processing` to receive real-time UI loading bar updates during crawls, chunking, and embedding. The frontend calls this every 2 seconds.

**Example Request:**
```bash
curl -X GET http://localhost:8000/api/v1/ingest/status/fastapi__fastapi__openai_text_3_small
```

**Example Response (`processing`):**
```json
{
  "status": "processing",
  "progress": 50
}
```

**Example Response (`completed`):**
```json
{
  "status": "completed",
  "progress": 100,
  "files_processed": 55,
  "chunks_created": 310
}
```

---

## Embedding Budget `GET /api/v1/embedding-budget`

Returns accounting for the shared $0.50 lifetime cap on OpenAI embedding usage. The cap includes repository indexing and retrieval-query embeddings, but not chat-generation tokens.

```json
{
  "used_tokens": 0,
  "remaining_tokens": 25000000,
  "budget_usd": 0.5,
  "estimated_used_usd": 0.0,
  "uncertain_requests": 0
}
```

---

## Chat with Repository `POST /api/v1/chat`

Executes the RAG pipeline to generate answers. The endpoint streams OpenAI response chunks and source metadata.

**Example Request:**
```bash
curl -N -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/fastapi/fastapi",
    "query": "How do I define a generic path parameter?",
    "model": "gpt-6-luna"
  }'
```

**Example Response (Stream):**
*(The response is streamed via Server-Sent Events over HTTP 1.1 `Transfer-Encoding: chunked`)*

```text
METADATA:[{"source": "docs/en/docs/tutorial/path-params.md", "url": "https://github.com/fastapi/fastapi/blob/main/docs/en/docs/tutorial/path-params.md"}]

To define a generic path parameter in FastAPI...
```

**Error States:**
- `400 Bad Request`: If the target repository has not been ingested yet.
- `500 Server Error`: OpenAI API errors, timeouts, or invalid API keys.
