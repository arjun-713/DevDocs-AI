# DevDocs AI — Tech Stack & Rationale

---

## Frontend

### Next.js 14 (App Router)
You already know React, so Next.js is a zero-friction upgrade. The App Router gives you server components and built-in streaming support — critical for typewriter-style AI responses without extra setup.

- Streaming SSE support built-in — responses feel live, not like a loading spinner
- File-based routing means your `/chat` and `/ingest` pages are done in minutes
- Vercel deployment is one command — perfect for a 2-day timeline
- Looks strong on a resume because it signals full-stack thinking, not just React

### Tailwind CSS
You know this already. No context switching, no CSS file juggling. Build a polished chat UI fast without writing a single custom class.

### shadcn/ui
Pre-built accessible components (Input, Button, ScrollArea, Badge) that look good out of the box. Drop them in, style with Tailwind, ship fast. The chat input, message bubbles, and source citation cards all map directly to shadcn components.

---

## Backend

### FastAPI (Python)
Python is the natural home for AI/ML work. LangChain, ChromaDB, and HuggingFace all have first-class Python support. FastAPI is fast to write, handles async streaming cleanly for SSE, and auto-generates API docs at `/docs`.

- Async endpoints mean `/chat` stream and `/ingest` don't block each other
- Auto-generated `/docs` page impresses in live demos
- Directly maps to the Jenkins GSoC backend — same architecture, different domain

### LangChain
The standard RAG orchestration library. Has built-in text splitters, embedding wrappers, vector store integrations, and retrieval chains. You spend time on app logic, not on wiring components manually.

- `RecursiveCharacterTextSplitter` handles markdown files perfectly
- `RetrievalQA` chain wires retriever + LLM in ~5 lines
- Heavily referenced in GSoC proposals — shows you know the industry standard

### ChromaDB
In-memory vector store that requires zero infrastructure. Runs inside your FastAPI process, no Docker, no separate service. Right call for a 2-day build. Swap for Pinecone or Weaviate later if needed.

- `pip install chromadb` — done
- Persists to disk automatically with a single config line
- Supports multiple collections — one per repo, exactly what you need

---

## AI & Embeddings

### Google Gemini API
> **Why Gemini?** You already have the API key from CryptoGuard. Zero new account setup.

- `gemini-1.5-flash` — fast chat model, 1M token context window, great for large doc sets
- `text-embedding-004` — free tier, 768-dim vectors, works natively with ChromaDB
- You already used the streaming API in CryptoGuard so the pattern is familiar

### GitHub REST API
Used to crawl the repo and fetch `.md`, `.mdx`, `.rst`, and `README` files. No auth needed for public repos (60 req/hr unauthenticated, 5000/hr with a token). The Trees API lets you list all files in one call — efficient and clean.

---

## Deployment

| Layer | Service | Why |
|---|---|---|
| Frontend | Vercel | Free, one-command deploy from GitHub |
| Backend | Railway or Render | Free tier, Docker or direct Python deploy |
| Vector DB | ChromaDB (in-process) | No separate infra needed, ships with backend |

---

> **Resume line:** Built and deployed a full-stack RAG chatbot using Next.js, FastAPI, LangChain, ChromaDB, and Gemini — ingests any public GitHub repo and answers questions with cited sources.
