# Retrieval-Augmented Generation (RAG) Pipeline

This document explains the specifics of the DevDocs AI RAG pipeline design, the reasoning behind chunk constraints, our choice of embedding model, and the retrieval architecture fetching documents prior to LLM generation. 

## Table of Contents

- [Data Collection (Crawling)](#data-collection-crawling)
- [Chunking Strategy](#chunking-strategy)
- [Vector Embeddings](#vector-embeddings)
- [Retrieval Strategy](#retrieval-strategy)
- [Prompt Construction & Citations](#prompt-construction--citations)

---

## Data Collection (Crawling)

The pipeline initiates a non-blocking background queue fetching asynchronous URLs via the `GitHubCrawler`. To reduce noise and prevent injecting framework boilerplate, the crawler:
- Looks strictly for `.md`, `.rst`, and `.txt` documentation formats.
- Preemptively blacklists directories heavily polluting queries (`node_modules`, `tests`, `fixtures`, `.vscode`, `vendor`, `__pycache__`).
- Safely downloads up to 200 documents in parallel using an `asyncio.Semaphore(25)` allowing requests.

## Chunking Strategy

To accurately segment massive files (like `/docs/routing.md`), we utilize **LangChain's `RecursiveCharacterTextSplitter`**. 

**Chunk Specifications (`processor.py`)**:
- `chunk_size = 1500 chars`
- `chunk_overlap = 150 chars`

**Why?**
The 1500-character size provides large-enough sentences representing complete programmatic concepts (like a complete `import` block joined to an explanation) while fitting efficiently inside vector similarity search boundaries. The 10% overlap (150 chars) ensures context bridging across chunk boundaries — so no method signature is cut in half while spanning two distinct context vectors.

## Vector Embeddings

Repository ingestion and retrieval use OpenAI `text-embedding-3-small` (1536 dimensions). The OpenAI API currently charges $0.02 per million input tokens. DevDocs AI enforces a persistent $0.50 lifetime cap for embedding calls (25 million tokens at that price), using local `cl100k_base` token counts, a small reservation margin, an atomic SQLite ledger, and provider-reported usage settlement.
- Each bounded request batch is reserved against the cap before being sent, so simultaneous repository ingestions and chat-query embeddings share one allowance.
- At most two embedding requests run at once. Transient HTTP 429 rate limits receive bounded backoff retries; quota exhaustion is surfaced without retries.
- When a request succeeds, the ledger replaces the reservation with the API-reported prompt-token usage. If the result is ambiguous because a request fails or its response is lost, the reservation remains held conservatively.
- The existing crawler remains concurrent, embedding requests are batched, and Chroma writes overlap embedding work with bounded concurrency.
- Collections use an embedding-model-specific suffix. Previous local BGE and legacy collections are preserved and not mixed with the current OpenAI vectors.

## Retrieval Strategy

When a user chats over an imported repository, their query (e.g. `How does App Router work?`) is embedded with `text-embedding-3-small` before Chroma search; query tokens count against the same embedding cap.

- **Similarity Engine:** Using `cosine` distance similarity logic natively in Chroma, we locate the `Top 5 (k=5)` closest textual document embeddings.
- **Top-k (`retriever.py`):** The retriever selects the five nearest chunks and provides them as cited context to the configured answer-generation model.

## Prompt Construction & Citations

Finally, the DevDocs AI backend crafts a constrained system prompt injected with the retrieved context blocks ensuring zero off-script responses.

**Citation Extraction**:
Throughout chunking, the absolute URL map tracing to the raw GitHub URL source is saved directly inside ChromaDB's local metadata arrays. The generator prepends a structured `METADATA: [...] \n\n` object detailing exactly which file segments were retrieved. The Next.js frontend catches this un-rendered metadata frame and beautifully renders accurate `<Page>` pin hyper-links matching exact chat answers.
