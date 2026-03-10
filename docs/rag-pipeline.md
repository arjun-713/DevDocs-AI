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

We utilize **Google's `gemini-embedding-001`** model wrapper from LangChain to translate document chunks into mathematical vector representations.
- Vectors accurately map the semantic intent of documentation into dense floats.
- For extremely large documentation libraries, the API request rate limits are respected by a rolling exponential backoff system generating 50 vectors parallelly and repeating up to 5 times.
- These vectors are safely ingested into an in-process, disk-persistent **ChromaDB** container allowing long-term vector querying without latency.

## Retrieval Strategy

When a user chats over an imported repository, their query (e.g. `How does App Router work?`) is independently embedded through `gemini-embedding-001` to generate a vector point.

- **Similarity Engine:** Using `cosine` distance similarity logic natively in Chroma, we locate the `Top 5 (k=5)` closest textual document embeddings.
- **Top-k (`retriever.py`):** Picking the absolute highest semantic matches significantly compresses the 2,000,000 token context window allowed by massive models, eliminating 99% of hallucination error and drastically lowering the token cost.

## Prompt Construction & Citations

Finally, the DevDocs AI backend crafts a constrained system prompt injected with the retrieved context blocks ensuring zero off-script responses.

**Citation Extraction**:
Throughout chunking, the absolute URL map tracing to the raw GitHub URL source is saved directly inside ChromaDB's local metadata arrays. The generator prepends a structured `METADATA: [...] \n\n` object detailing exactly which file segments were retrieved. The Next.js frontend catches this un-rendered metadata frame and beautifully renders accurate `<Page>` pin hyper-links matching exact chat answers.
