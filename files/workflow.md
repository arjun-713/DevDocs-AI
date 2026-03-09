# DevDocs AI — Workflow Guide

---

## Part 1 — User Experience Workflow

This is the complete journey from a user's perspective — what they see, what they do, and what they expect at each step.

### Step 1 — Land on the Homepage
The user arrives at a clean landing page with a single prominent input field: *"Paste a GitHub repo URL"*. A few example repo cards sit below it (React, FastAPI, Tailwind, Vite) as one-click shortcuts. A clear CTA button: **Analyze Repo**.

- No signup, no login — zero friction
- Example cards act as demo shortcuts so users can try it immediately

### Step 2 — Submit a Repo URL
User pastes a URL like `https://github.com/vitejs/vite` and hits Analyze. A live ingestion progress panel appears showing what's happening behind the scenes:

```
✓ Fetching file tree...
✓ Found 43 documentation files
⏳ Chunking and embedding... 12/43 files
✓ Ready! Ask anything about Vite.
```

This progress UI is important — it builds trust and makes the app feel production-grade, not like a toy.

### Step 3 — Chat Interface Opens
Once ingestion completes, the page transitions to a split-layout chat interface. Left panel is the conversation. Right panel (or collapsible drawer on mobile) shows **Source Citations**.

- User types: *"How do I configure aliases in Vite?"*
- Response streams in token by token — feels like ChatGPT, not a loading spinner
- Below the response, 2–3 source snippets appear with file names and relevant excerpts

### Step 4 — Explore Sources
Each source citation is clickable. Clicking shows a card with the full retrieved chunk and a direct link to the file on GitHub. This is the killer feature — users can verify answers, not just trust them.

### Step 5 — Switch or Add a Repo
A repo switcher in the top nav lets the user load a second repo or switch between previously loaded ones. Each repo has its own isolated ChromaDB collection so context never bleeds between them.

---

> **User mental model:** Think of it like having a senior contributor for any open-source project available 24/7. You ask in plain English and get answers with receipts.

---

## Part 2 — Build Order

The principle: **get the RAG pipeline working before you touch the UI.** A working backend with a bad frontend is fixable in hours. A beautiful frontend with a broken backend is a dead demo.

---

### Day 1 — Backend First

#### Block 1 (1–1.5 hrs) — Project Setup
1. Create project structure: `/frontend` and `/backend` folders
2. Init FastAPI: `pip install fastapi uvicorn langchain chromadb google-generativeai requests`
3. Set up `.env` with `GEMINI_API_KEY` and `GITHUB_TOKEN`
4. Create `main.py` with a basic `GET /` health check — confirm it runs

#### Block 2 (1–1.5 hrs) — GitHub Crawler
1. Build `crawler.py` — call GitHub Trees API to get all file paths in one request
2. Filter to only `.md`, `.mdx`, `.rst`, `.txt` files
3. Fetch file contents in parallel via `raw.githubusercontent.com`
4. Test it: point at a small repo and print the doc count

#### Block 3 (1.5–2 hrs) — RAG Pipeline
1. Build `ingest.py` — chunk docs with `RecursiveCharacterTextSplitter` (chunk_size=1000, overlap=200)
2. Embed chunks using Gemini `text-embedding-004` via LangChain's `GoogleGenerativeAIEmbeddings`
3. Store in ChromaDB with collection name = repo slug (e.g. `vitejs__vite`)
4. Wire up `POST /ingest` endpoint that accepts `{repo_url}` and runs the full pipeline
5. Test in Postman — confirm chunks are stored in Chroma

#### Block 4 (1 hr) — Chat Endpoint
1. Build `chat.py` — retrieve top-5 relevant chunks from Chroma for a given query
2. Construct a prompt: system context + retrieved chunks + user question
3. Stream response from `gemini-1.5-flash` via SSE
4. Return source metadata (file name + snippet) alongside the streamed answer
5. Test with `curl` — **Day 1 done if this works**

> **Day 1 checkpoint:** You should be able to ingest a GitHub repo and get an answer via curl. The frontend does not exist yet and that is fine.

---

### Day 2 — Frontend + Polish

#### Block 5 (1.5 hrs) — Next.js Setup + Repo Input
- `npx create-next-app frontend` with Tailwind + shadcn/ui
- Build the homepage with URL input and example repo cards
- Wire the Analyze button to call `POST /ingest` on your backend
- Show a basic loading state while ingestion runs

#### Block 6 (1.5 hrs) — Chat UI
- Build the chat page with message list, input box, and send button
- Use `EventSource` or `fetch` with `ReadableStream` to handle SSE from `/chat`
- Render streaming tokens — append to last message as they arrive
- Add a source citations panel below each AI response

#### Block 7 (1 hr) — Ingestion Progress + Repo Switcher
- Upgrade the loading state to a live step-by-step status panel
- Add a repo switcher in the nav listing previously loaded repos
- Store loaded repos in `localStorage` for persistence across sessions

#### Block 8 (30–45 mins) — Deploy
- Push backend to Railway or Render — add `GEMINI_API_KEY` env var
- Push frontend to Vercel — set `NEXT_PUBLIC_API_URL` to your backend URL
- Test the full flow on prod once

---

> **Scope rule:** If you run out of time, cut the repo switcher. The core loop — ingest → chat → citations — is what makes this impressive. Everything else is polish.
