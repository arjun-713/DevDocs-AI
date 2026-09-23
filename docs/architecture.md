# System Architecture

This document provides a high-level overview of the DevDocs AI system, illustrating how data flows from the user's initial repository input to the final AI-generated response.

## Table of Contents

- [High-Level Flow](#high-level-flow)
- [System Components](#system-components)
  - [Frontend (Next.js)](#frontend-nextjs)
  - [Backend (FastAPI)](#backend-fastapi)
  - [RAG Engine (LangChain + ChromaDB)](#rag-engine-langchain--chromadb)
  - [LLM Service (OpenAI)](#llm-service-openai)

## High-Level Flow

The following Mermaid diagram outlines the end-to-end data flow:

```mermaid
flowchart TD
    %% User Action
    User([User inputs GitHub URL]) --> UI

    %% Frontend Layer
    subgraph Frontend [Frontend - Next.js]
        UI([Landing Page / Chat UI])
        State([React State / LocalStorage])
        UI <--> State
    end

    %% Backend Layer
    subgraph Backend [Backend - FastAPI]
        API_Ingest([POST /api/v1/ingest])
        API_Chat([POST /api/v1/chat])
        Status([GET /api/v1/ingest/status])
    end

    %% RAG Pipeline
    subgraph Pipeline [RAG Pipeline - LangChain & ChromaDB]
        Crawler([GitHubCrawler])
        Processor([RAGProcessor\nChunking & OpenAI Embedding])
        Retriever([RAGRetriever\nVector Search])
        Chroma[(ChromaDB)]
    end

    %% External APIs
    GitHub((GitHub API))
    OpenAIEmbed((text-embedding-3-small))
    OpenAI((OpenAI chat))

    %% Connections - Ingestion Flow
    UI -- "Start Ingestion" --> API_Ingest
    UI -- "Poll Progress" --> Status
    API_Ingest --> Crawler
    Crawler -- "Fetch Repo Tree & Files" --> GitHub
    Crawler --> Processor
    Processor -- "1536-d vectors" --> OpenAIEmbed
    Processor -- "Store Docs & Vectors" --> Chroma

    %% Connections - Chat Flow
    UI -- "Send Query" --> API_Chat
    API_Chat --> Retriever
    Retriever -- "Semantic Search" --> Chroma
    Chroma -- "Return Context Source" --> Retriever
    Retriever -- "Query embedding" --> OpenAIEmbed
    Retriever -- "Context + Prompt" --> OpenAI
    OpenAI -- "Stream Response" --> API_Chat
    API_Chat -- "SSE Stream" --> UI
```

## System Components

### Frontend (Next.js)

The user interface is built using Next.js (App Router), React, and Tailwind CSS.
- **Responsibility**: Provides a sleek, interactive chat surface and landing page. Manages states like the active repository, chat history, and the selected OpenAI model.
- **Key Features**: Smooth CSS animations, full markdown rendering (`ChatMarkdown`), message actions (copy, like, dislike, regenerate).

### Backend (FastAPI)

The API layer is built with FastAPI, providing asynchronous endpoints for both ingestion and chatting.
- **Responsibility**: Handles HTTP requests from the frontend, orchestrates the background ingestion tasks, and manages streaming responses for the chat.
- **Endpoints**:
  - `/api/v1/ingest`: Triggers the background ingestion worker.
  - `/api/v1/ingest/status/{collection}`: Fast lookup for ingestion progress reporting.
  - `/api/v1/chat`: Handles user queries, runs the retriever, formats the prompt, and returns Server-Sent Events (SSE).

### RAG Engine (LangChain + ChromaDB)

The core logic that powers the Retrieval-Augmented Generation.
- **GitHubCrawler**: Asynchronously fetches repository file trees using the GitHub API, filters for documentation files (`.md`, `.rst`, etc.), and downloads raw contents using a semaphore to avoid rate limits.
- **RAGProcessor**: Splits the raw text into manageable chunks (`RecursiveCharacterTextSplitter`) and generates vector embeddings.
- **RAGRetriever**: Searches ChromaDB for the chunks most semantically similar to the user's query.
- **ChromaDB**: A vector database that holds embeddings and source metadata; Compose runs it as a persistent HTTP service, while local development can use an in-process persistent client.

### LLM Service (OpenAI)

The backend uses OpenAI `text-embedding-3-small` for document and query vectors (1536 dimensions). A persistent SQLite token ledger reserves usage atomically and caps embedding API usage at $0.50 across ingestion and query embeddings. OpenAI also streams answers from the configured chat model (`gpt-6-luna` by default); that generation spend is separate from the embedding cap. `OPENAI_API_KEY` remains server-side.
