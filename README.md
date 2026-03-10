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
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # FastAPI route handlers
│   │   ├── db/                 # ChromaDB client
│   │   ├── services/rag/       # RAG pipeline (crawler, processor, retriever, LLM)
│   │   └── main.py             # FastAPI app entry point
│   └── data/                   # ChromaDB persistent storage
├── frontend/
│   ├── app/
│   │   ├── components/         # React components
│   │   ├── chat/               # Chat page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   └── public/                 # Static assets (favicons, logos)
├── docs/                       # Full documentation
├── start.sh                    # Start both servers
├── DEPLOYMENT.md               # Deployment guide
└── .env                        # Environment variables
```

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/arjun-713/DevDocs-AI.git
cd "DevDocs AI"
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Backend Setup

```bash
# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create data directory for ChromaDB
mkdir -p backend/data
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

cd ..
```

---

## Running Locally

### Run Both Together

The easiest way — uses the included `start.sh` script:

```bash
chmod +x start.sh
./start.sh
```

This starts:
- **Backend** at `http://localhost:8000`
- **Frontend** at `http://localhost:3000`

Press `Ctrl+C` to stop both servers.

### Run Separately

**Backend:**

```bash
source .venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**

```bash
cd frontend
npm run dev
```

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

## Deployment

See [**DEPLOYMENT.md**](./DEPLOYMENT.md) for step-by-step instructions to deploy on free-tier services (Vercel + Railway/Render).

---

<p align="center">
  <sub>Built with ❤️ using Next.js, FastAPI, LangChain, ChromaDB, and Gemini</sub>
</p>
