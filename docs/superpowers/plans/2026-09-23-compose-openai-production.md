# Local Production Compose and OpenAI Model Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a health-checked local production stack (Next.js, FastAPI, ChromaDB), use `gpt-6-luna` by default, document configuration, and verify API and repository ingestion end to end.

**Architecture:** Docker Compose runs three isolated services with a named Chroma volume and dependency health gates. The browser uses same-origin `/api` requests, which Next.js proxies to the backend service; the OpenAI secret stays in the backend environment. Model defaults are aligned across UI and API, with optional `OPENAI_MODEL` override.

**Tech Stack:** Docker Compose, Node.js 22 / Next.js standalone output, Python / FastAPI / Chroma HTTP client, OpenAI SDK and LangChain OpenAI integration.

**Spec:** User request in this conversation; no separate design spec supplied.

## Global Constraints

- Default chat model is `gpt-6-luna`; `OPENAI_MODEL` may override the backend default.
- `OPENAI_API_KEY` is server-side only and must not be printed, bundled into browser assets, or committed.
- Compose must persist Chroma data in a named volume and wait for healthy dependencies.
- Smoke checks must use public open-source GitHub repositories and verify persisted non-empty collections.
- Preserve pre-existing `.gitignore` edits and do not commit, push, or remove repository data.

---

### Task 1: Add the containerized production stack

**Files:**
- Create: `compose.yaml`
- Create: `backend/Dockerfile`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: `next.config.mjs`
- Modify: `backend/app/db/chroma.py`
- Modify: `backend/app/main.py`
- Modify: `.env.example`

**Interfaces:**
- Backend reads `CHROMA_HOST` and `CHROMA_PORT`; without them, retains local persistent Chroma behavior.
- Frontend build consumes `API_INTERNAL_URL=http://backend:8000`; browser calls same-origin `/api/v1/...`.
- Compose services are named `frontend`, `backend`, and `chroma`, with persistent volume `chroma_data`.

- [x] Build frontend as Next standalone output and proxy `/api/:path*` to `API_INTERNAL_URL` when configured.
- [x] Build backend image from `backend/requirements.txt`, run Uvicorn, and add a root health check.
- [x] Configure Chroma server, matching Python HTTP client, named persistence, and startup readiness checks.
- [x] Add environment template entries and ignore build artifacts without touching existing ignore rules.
- [x] Validate Compose interpolation and image build configuration.

### Task 2: Align chat models and error-safe API configuration

**Files:**
- Modify: `backend/app/api/v1/endpoints/chat.py`
- Modify: `backend/app/services/rag/llm.py`
- Modify: `app/chat/page.tsx`
- Modify: `app/components/MessageActions.tsx`
- Modify: `.env.example`

**Interfaces:**
- Backend model selection uses request model when supplied, otherwise `OPENAI_MODEL`, otherwise `gpt-6-luna`.
- Frontend initial selection and both selectors default to `gpt-6-luna`.
- `NEXT_PUBLIC_API_URL` remains optional; unset means same-origin API proxy.

- [x] Set matching `gpt-6-luna` defaults across backend and UI while preserving existing explicit model choices.
- [x] Keep the API key exclusively in server-side environment and add `OPENAI_MODEL=gpt-6-luna` to the template.
- [x] Check every frontend API path resolves through the configured same-origin proxy in Compose.

### Task 3: Document local production usage and operational boundaries

**Files:**
- Modify: `README.md`
- Modify: `docs/deployment.md`
- Modify: `.env.example`

- [x] Document `cp .env.example .env`, setting the key, `docker compose up --build`, local URLs, logs, and non-destructive shutdown.
- [x] Describe named-volume persistence, model override, backend/API architecture, and separate Vercel deployment configuration accurately.
- [x] Retain README screenshots and verify all local documentation links and commands.

### Task 4: Verify build, API contract, and real ingestion

**Files:**
- Test: Compose runtime and public repository ingestion; no permanent test fixture required.

- [x] Run frontend typecheck/lint/build and backend import/route checks.
- [x] Start Compose, wait for healthy services, and exercise frontend/API health and OpenAPI routes.
- [x] Ingest three public repositories (`psf/requests`, `pallets/flask`, `fastapi/fastapi`) through `/api/v1/ingest`.
- [x] Poll each job to completion, verify each Chroma collection has stored records and valid source metadata, and exercise a GPT-6 Luna chat request.
- [x] Run `git diff --check` and report environment and dependency audit findings distinctly from passed checks.
