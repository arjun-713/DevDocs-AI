# DevDocs AI

**Chat with any GitHub repository. Instantly.**

Paste a GitHub URL, get AI-powered answers with cited sources from the actual codebase documentation. No digging through READMEs. No Stack Overflow rabbit holes.

---

## Table of Contents

- [Screenshots](#screenshots)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
- [Running Locally](#running-locally)
  - [Run Both Together](#run-both-together)
  - [Run Separately](#run-separately)
- [Environment Variables Reference](#environment-variables-reference)
- [Documentation](#documentation)
- [Deployment](#deployment)

---

## Screenshots

![Hero / Landing Page](/docs/screenshots/hero.png)


![Chat Interface](/docs/screenshots/chat.png)


## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Frontend runtime |
| **Python** | 3.10+ | Backend runtime |
| **Gemini API Key** | — | LLM and embeddings (get from [Google AI Studio](https://aistudio.google.com/app/apikey)) |

---

## Project Structure

```
DevDocs AI/
├── app/                # Next.js app directory
├── backend/            # FastAPI backend
│   ├── app/            # FastAPI route handlers & logic
│   └── data/           # ChromaDB persistent storage
├── lib/                # Shared frontend utilities
├── public/             # Static assets
├── .venv/              # Python virtual environment
├── package.json        # Unified dev scripts
└── .env                # Shared environment variables
```

---

## Local Setup

### 1. Clone & Environment
```bash
git clone https://github.com/arjun-713/DevDocs-AI.git
cd "DevDocs AI"
cp .env.example .env
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

---

## Running Locally

Simply run:
```bash
npm run dev
```

This starts:
- **Frontend** (Next.js) at `http://localhost:3000`
- **Backend** (FastAPI) at `http://localhost:8000`


---

## Environment Variables Reference

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `GOOGLE_API_KEY` | ✅ Yes | Gemini API key for LLM and embeddings | [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

## Documentation

Full code documentation is available in the [`/docs`](./docs/) folder:

- [**Architecture Overview**](./docs/architecture.md) — System design and data flow
- [**Backend Reference**](./docs/backend.md) — All backend files documented
- [**Frontend Reference**](./docs/frontend.md) — All components documented
- [**API Reference**](./docs/api.md) — Every endpoint with curl examples
- [**RAG Pipeline**](./docs/rag-pipeline.md) — Chunking, embedding, retrieval strategy

---
*Eval pipeline configured to automatically run on pull requests.*
