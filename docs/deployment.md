# Deployment

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

Set `OPENAI_API_KEY` in the backend environment. Generate a public HTTPS domain and use it as the frontend’s `NEXT_PUBLIC_API_URL`.

## Production checks

```bash
curl https://YOUR_BACKEND_DOMAIN/
```

The response should report the API as online. Then open the Vercel URL, submit a public GitHub repository, and confirm ingestion and chat complete successfully.

## Storage limitation

ChromaDB stores data on the backend filesystem. Free-tier instances may use ephemeral storage, so indexed repositories can be lost after a restart. Use a persistent volume or a hosted vector database before treating the service as production-grade.
