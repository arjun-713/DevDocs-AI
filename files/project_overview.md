# DevDocs AI — Project Overview

> Chat with any open-source GitHub repository

---

## What is DevDocs AI?

DevDocs AI is a Retrieval-Augmented Generation (RAG) chatbot that lets you paste any public GitHub repository URL and instantly start asking questions about it in plain English. The bot reads the documentation files, breaks them into searchable chunks, embeds them into a vector database, and uses Gemini AI to generate answers grounded in the actual source material — with citations.

No more hunting through READMEs or digging through wikis. You ask, it answers, and it shows its work.

---

## The Problem It Solves

Every developer has been stuck trying to understand an unfamiliar open-source project. You clone a repo, find a massive docs folder, and spend an hour skimming files trying to answer one specific question. Existing tools like GitHub search are keyword-only and surface raw files, not answers.

DevDocs AI turns a repo's documentation into a conversational interface. It's the difference between searching a library and talking to the librarian.

---

## Key Features

- **Repo ingestion** — paste any public GitHub URL and the app automatically discovers, fetches, and indexes all documentation files (`.md`, `.mdx`, `.rst`, `.txt`)
- **Conversational chat** — ask questions in plain English, get coherent answers with full context awareness
- **Cited sources** — every answer includes the exact file names and text snippets the model used
- **Streaming responses** — answers appear token by token for a natural, responsive feel
- **Repo switcher** — load multiple repos and switch between them without re-ingesting
- **Live ingestion progress** — step-by-step status UI so the user always knows what's happening

---

## How It Works

### Ingestion Pipeline
1. GitHub Trees API fetches the full file tree for the target repo in one request
2. Files are filtered to documentation types only — `.md`, `.mdx`, `.rst`, `.txt`
3. Raw content is fetched in parallel via `raw.githubusercontent.com`
4. LangChain's `RecursiveCharacterTextSplitter` breaks content into 1000-character chunks with 200-character overlap to preserve context across boundaries
5. Each chunk is embedded using Gemini `text-embedding-004` (768-dim vectors)
6. Embeddings are stored in a ChromaDB collection keyed by the repo slug

### Retrieval & Generation
1. User question is embedded using the same model
2. Cosine similarity search retrieves the top 5 most relevant chunks from ChromaDB
3. A structured prompt is assembled: system instructions + retrieved context + user question
4. Gemini 1.5 Flash generates the answer with streaming enabled
5. Source metadata (file name + text snippet) is returned alongside the streamed answer

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 14 + Tailwind | UI, routing, SSE streaming |
| UI Components | shadcn/ui | Chat, input, source cards |
| Backend | FastAPI (Python) | API server, async endpoints |
| RAG Framework | LangChain | Chunking, embedding, retrieval |
| Vector Store | ChromaDB | Embedding storage and search |
| LLM + Embeddings | Gemini 1.5 Flash + text-embedding-004 | Generation and vectorization |
| Data Source | GitHub REST API | Repo crawling and file fetching |
| Frontend Deploy | Vercel | CI/CD from GitHub |
| Backend Deploy | Railway / Render | Free tier Python hosting |

---

## GSoC Relevance

This project directly mirrors the architecture of the Jenkins AI Chatbot Plugin (`jenkinsci/resources-ai-chatbot-plugin`). Both solve the same core problem: ingest structured documentation from a codebase and serve natural language answers with citations.

**Key technical overlaps:**
- RAG pipeline design and chunking strategy
- Embedding model selection and tradeoffs
- Vector store management across multiple collections
- Retrieval quality and top-k tuning
- Streamed LLM responses via SSE
- Citation generation tied to source chunks

In your GSoC proposal you can reference this project as evidence that you understand the full pipeline end-to-end — not as a learner, but as someone who has already built and shipped it.

---

## Resume Description

> **DevDocs AI** — Built a full-stack RAG chatbot that ingests any public GitHub repo and answers developer questions with cited sources. Stack: Next.js, FastAPI, LangChain, ChromaDB, Gemini API. Deployed on Vercel + Railway.

---

## Project Name Options

- **DevDocs AI** — clean, professional, SEO-friendly ✓ recommended for resume/proposal
- **RepoChat** — simple and memorable
- **DocSense** — slightly more distinctive
- **AskRepo** — direct, verb-first, great for a demo URL

> Recommendation: use **DevDocs AI** as the project name and **askrepo.vercel.app** as the live demo URL — it reads well and is easy to remember.
