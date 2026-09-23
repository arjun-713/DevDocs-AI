# Deployment

## Local production stack

The repository includes a production-mode Docker Compose stack containing the Next.js frontend, FastAPI backend, and ChromaDB server. It is independent of the Vercel deployment path.

```bash
cp .env.example .env
# Set OPENAI_API_KEY and optionally OPENAI_MODEL in .env
docker compose up --build
```

The frontend is available at `http://localhost:3000`. Compose uses health checks to gate startup, proxies `/api/*` internally to FastAPI, and stores Chroma data plus the cumulative $0.50 OpenAI embedding-budget ledger in persistent `chroma_data` and `embedding_budget_data` volumes. Stop with `docker compose down`; avoid `docker compose down --volumes` if you want to retain indexed data and the spend cap across restarts. `OPENAI_MODEL` defaults to `gpt-6-luna`. Repository indexing and retrieval use OpenAI `text-embedding-3-small`; `/api/v1/embedding-budget` reports the remaining embedding allowance. The embedding cap does not include chat-generation usage or other apps using the same OpenAI account.

## Vercel and separate backend

DevDocs AI is a two-service application: the Next.js frontend is deployed to Vercel, while the FastAPI and ChromaDB backend runs on a Python host such as Railway or Render.

## Vercel frontend

1. Import the repository into Vercel.
2. Keep the **Root Directory** set to `.` (the repository root). There is no `frontend/` directory.
3. Use the detected Next.js framework and the default Node.js build image.
4. Add `NEXT_PUBLIC_API_URL` with the public backend URL, without a trailing slash.
5. Deploy from `main`.

The checked-in `vercel.json` makes the framework, install command, and build command explicit. The build uses the Webpack compiler for a predictable Vercel build.

## FastAPI backend

Configure the service root directory as `backend/`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the backend environment. Generate a public HTTPS domain and use it as the frontend’s `NEXT_PUBLIC_API_URL`.

## Production checks

```bash
curl https://YOUR_BACKEND_DOMAIN/
```

The response should report the API as online. Then open the Vercel URL, submit a public GitHub repository, and confirm ingestion and chat complete successfully.

## Storage limitation

ChromaDB stores data on the backend filesystem. Free-tier instances may use ephemeral storage, so indexed repositories can be lost after a restart. Use a persistent volume or a hosted vector database before treating the service as production-grade.
