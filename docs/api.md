# API Reference

This document outlines the REST API endpoints provided by the FastAPI backend of the DevDocs AI platform. The API runs locally on `http://127.0.0.1:8000`. Next.js automatically proxies requests from `domain.com/api/...` to the backend.

## Table of Contents

- [Endpoints Overview](#endpoints-overview)
- [Health Check `GET /`](#health-check-get-)
- [Trigger Ingestion `POST /api/v1/ingest`](#trigger-ingestion-post-apiv1ingest)
- [Check Ingestion Status `GET /api/v1/ingest/status/{collection}`](#check-ingestion-status-get-apiv1ingeststatuscollection)
- [Chat with Repository `POST /api/v1/chat`](#chat-with-repository-post-apiv1chat)

---

## Endpoints Overview

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Health check endpoint indicating if the FastAPI framework is online. |
| `POST` | `/api/v1/ingest` | Kick off the asynchronous process to crawl and embed a GitHub codebase. |
| `GET`  | `/api/v1/ingest/status/{col}` | Poll for dynamic ingestion progress from 0-100%. |
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
  "collection_name": "fastapi__fastapi",
  "message": "Ingestion started in the background."
}
```

---

## Check Ingestion Status `GET /api/v1/ingest/status/{collection}`

Poll this endpoint while `status === processing` to receive real-time UI loading bar updates during crawls, chunking, and embedding. The frontend calls this every 2 seconds.

**Example Request:**
```bash
curl -X GET http://localhost:8000/api/v1/ingest/status/fastapi__fastapi
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

## Chat with Repository `POST /api/v1/chat`

Executes the RAG pipeline to generate answers. The endpoint yields a chunked stream simulating typewriting text as the Gemini model predicts tokens. Includes metadata.

**Example Request:**
```bash
curl -N -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/fastapi/fastapi",
    "query": "How do I define a generic path parameter?",
    "model": "gemini-2.5-flash"
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
- `500 Server Error`: Gemini API timeouts or invalid API keys.
