# Predicted Project Folder Structure

This document outlines the proposed folder structure for the **DevDocs AI** project, based on the identified tech stack (Next.js 14, FastAPI, LangChain, ChromaDB) and project requirements.

```text
DevDocs AI/
├── backend/                  # FastAPI Application
│   ├── app/                  # Main application logic
│   │   ├── api/              # API Route handlers
│   │   │   └── v1/           # Versioned API
│   │   │       └── endpoints/# Specific API endpoints (chat, ingest, etc.)
│   │   ├── core/             # Configuration, security, and constants
│   │   ├── db/               # ChromaDB client and collection management
│   │   ├── models/           # Pydantic models for data validation
│   │   ├── schemas/          # Request and response schemas
│   │   ├── services/         # Business logic layer
│   │   │   └── rag/          # Core RAG pipeline implementation
│   │   │       ├── ingestion/# GitHub crawling and document processing
│   │   │       ├── llm/       # Gemini API integration and prompting
│   │   │       └── retrieval/ # Vector search and context assembly
│   │   └── utils/            # Shared utility functions (logging, formatting)
│   ├── data/                 # Local storage for ChromaDB persistence
│   ├── scripts/              # Independent scripts (migrations, data tasks)
│   └── tests/                # Backend unit and integration tests
├── files/                    # Project documentation and planning assets
└── frontend/                 # Next.js 14 Web Application
    ├── public/               # Static assets (images, icons, fonts)
    │   └── assets/           # Application-specific media
    └── src/                  # Source code
        ├── app/              # Next.js App Router (pages and layouts)
        │   ├── api/          # Frontend API routes (proxies or webhooks)
        │   └── (chat)/        # Chat-related route groups
        ├── components/       # React components (shadcn/ui based)
        │   ├── chat/        # Message bubbles, input, status indicators
        │   ├── repo/        # Repo selector, ingestion status cards
        │   └── ui/          # Raw shadcn components (buttons, dialogs)
        ├── hooks/            # Custom React hooks (streaming, form state)
        ├── lib/              # Utility libraries and API client wrappers
        ├── services/         # Client-side business logic
        ├── styles/           # Global styles and Tailwind configuration
        └── types/            # TypeScript interface and type definitions
```

## Folder Rationale

### Backend (FastAPI)
- **`app/services/rag/`**: Isolated RAG logic allows for testing the ingestion and retrieval pipelines independently from the API layer.
- **`app/db/`**: Handles the persistence of ChromaDB to the `data/` directory, ensuring collections are indexed properly.
- **`app/api/v1/`**: Standard versioning ensures future scalability as features grow.

### Frontend (Next.js)
- **`src/app/`**: Leverages Next.js 14 App Router for server-side rendering and efficient streaming of AI responses.
- **`src/components/`**: Organized by domain (`chat`, `repo`) and a generic `ui` folder for primitive components, facilitating reuse and maintenance.
- **`src/lib/`**: Contains the logic for SSE (Server-Sent Events) to handle token-by-token streaming from the FastAPI backend.
