# Deployment Guide

This document outlines how to deploy the full DevDocs AI platform (Frontend + Backend) using entirely **free-tier** services.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [1. Backend Deployment (Railway or Render)](#1-backend-deployment-railway-or-render)
  - [Option A: Railway (Recommended)](#option-a-railway-recommended)
  - [Option B: Render (Alternative)](#option-b-render-alternative)
- [2. Frontend Deployment (Vercel)](#2-frontend-deployment-vercel)
  - [Adding a Custom Domain](#adding-a-custom-domain)
- [Environment Variables Reference](#environment-variables-reference)
- [Important Limitations](#important-limitations)

---

## Architecture Overview

- **Frontend:** Next.js application deployed on [Vercel](https://vercel.com).
- **Backend:** FastAPI Python server deployed on [Railway](https://railway.app) or [Render](https://render.com).
- **Database (ChromaDB):** Runs *in-process* with the backend. No separate database deployment is required.

---

## 1. Backend Deployment (Railway or Render)

The backend handles the vector indexing, storage (ChromaDB), and LLM API calls. 

### Option A: Railway (Recommended)

Railway is generally faster and offers easier Dockerless deployments via Nixpacks.

1. Create an account on [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `DevDocs-AI` repository.
4. **Important**: Wait for the initial build to fail (it needs configuration).
5. Go to the project settings, and under **Build**, set the `Root Directory` to `/backend`.
6. Go to the **Variables** tab and add:
   - `GOOGLE_API_KEY`: Your Gemini API Key
   - `PORT`: `8000` (Optional but recommended)
7. Go to the **Settings** tab → **Networking** → Click **Generate Domain**. This will give you a public URL (e.g., `devdocs-production.up.railway.app`).
8. Trigger a redeploy. 

> *Note for Railway Free Tier:* Railway free tier projects go to sleep if inactive. The first request after a period of inactivity may take an extra 10-15 seconds to wake up.

### Option B: Render (Alternative)

1. Create an account on [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the `DevDocs-AI` repo.
4. Fill out the form:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Click **Advanced**, then **Add Environment Variable**:
   - `GOOGLE_API_KEY`: Your Gemini API Key
6. Select the **Free** instance type and click **Create Web Service**.
7. Copy the generated `.onrender.com` URL.

> *Note for Render Free Tier:* Render free tier instances spin down after 15 minutes of inactivity. The "Cold Start" can take up to 50 seconds.

---

## 2. Frontend Deployment (Vercel)

Vercel is the optimal host for Next.js applications, offering a generous free tier.

1. Sign up for [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New** → **Project**.
3. Import your `DevDocs-AI` repository.
4. In the **Configure Project** step:
   - **Root Directory**: Click "Edit" and change it to `frontend`
   - **Framework Preset**: Next.js (should be auto-detected)
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: **The URL of your deployed backend** (e.g., `https://devdocs-production.up.railway.app`). *Do not include a trailing slash.*
6. Click **Deploy**.

Vercel will automatically redeploy your application every time you push to the `main` branch.

### Adding a Custom Domain

1. In your Vercel project dashboard, go to **Settings** → **Domains**.
2. Enter the custom domain you own (e.g., `devdocs.yourdomain.com`).
3. Vercel will provide DNS records (usually a `CNAME` or `A` record).
4. Add these records to your domain registrar (GoDaddy, Namecheap, Route53, etc.).
5. Vercel will automatically provision a free SSL certificate once the DNS propagates.

---

## Environment Variables Reference

| Variable Name | Service | Required | Where to get it |
|---|---|---|---|
| `GOOGLE_API_KEY` | Backend | ✅ Yes | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_API_URL`| Frontend | ✅ Yes | Copied from your Railway/Render deployment |

---

## Important Limitations

- **ChromaDB Ephemeral Storage**: Free-tier PaaS environments (like Railway and Render free tiers) have **ephemeral file systems**. This means every time the server restarts or wakes up from sleep, the local ChromaDB `data/` folder is wiped. 
- **The Result**: Indexed repositories will be lost after a server restart, forcing users to re-index them.
- **The Fix (For Production)**: If you plan to scale this, you must either:
  1. Upgrade to a paid tier on Railway with a persistent volume attached to `/backend/data`.
  2. Swap ChromaDB for a hosted vector database like Pinecone or Qdrant in `processor.py` and `retriever.py`.
