# Frontend Reference

This document provides a detailed overview of every key component and page in the Next.js React frontend.

## Table of Contents

- [Pages](#pages)
  - [app/page.tsx (Landing Page)](#apppagetsx)
  - [app/chat/page.tsx (Chat Interface)](#appchatpagetsx)
- [Components](#components)
  - [ChatMarkdown.tsx](#chatmarkdowntsx)
  - [MessageActions.tsx](#messageactionstsx)
  - [Logo.tsx](#logotsx)
  - [FeaturesSection.tsx](#featuressectiontsx)
  - [HowItWorksSection.tsx](#howitworkssectiontsx)
  - [GitHubReposSection.tsx](#githubrepossectiontsx)
  - [Footer.tsx](#footertsx)

---

## Pages

### `app/page.tsx`
**Purpose**: The main landing page for DevDocs AI.
- **Key State**:
  - `inputValue`: Tracks the user's typed GitHub URL.
  - `mounted` / `isExpanded` / `messages` / `isTyping`: Manages animated CSS mock UI states.
- **Implementation Note**: When the user enters a URL, the `<form>` validates the string (`https://github.com/` injection if missing) and redirects via Next.js router `router.push("/chat?repo=...")`. The `Try it free` button focuses the input via `ref.current.focus()` and runs a CSS ring pulse frame (`input-pulse`).

### `app/chat/page.tsx`
**Purpose**: The main AI chat workspace containing the chat history, input bar, sidebar, and loading state.
- **Key State**:
  - `messages`: React state holding all sent/received user & AI messages (and parsed source citations).
  - `repoUrl` / `status` / `progress`: Controls the ingestion UI layer during loading sequences.
  - `selectedModel`: Passed directly back to the endpoint (e.g., `gemini-2.5-flash`).
- **Endpoint Called**:
  - Polling `GET /api/v1/ingest/status/...` during the initial page load to update the progress bar.
  - Calling `POST /api/v1/chat` to retrieve the SSE response stream for incoming questions.
- **Features**: Features local slash Commands (`/new`, `/help`, `/clear`) with a dropdown `commandHint` menu. Local Storage automatically caches past queries repositories to populate the sidebar tree.

---

## Components

Located in `frontend/app/components/`.

### `ChatMarkdown.tsx`
**Purpose**: Fully interactive Markdown renderer built iteratively.
- **Props**: `{ text: string }`
- **Features**: Instead of using heavy markdown libraries, parses common markdown strings for inline styling (`bold`, `italics`, `code`). Splits logic to correctly format blockquotes, headers (`h1-h4`), external hyperlinks, horizontal rules, and syntax-highlighted code blocks (`<CodeBlock />`). Includes a "Copy" text function for any rendered snippets.

### `MessageActions.tsx`
**Purpose**: The action toolbar appended underneath every backend-generated AI response message.
- **Props**: `{ content, onRegenerate, onLike, onDislike }`
- **Features**: Floating buttons to copy raw response strings (`content`), toggle positive/negative feedback context visually, and regenerate the message using the currently selected model. It also includes a dropdown permitting users to regenerate the specific answer utilizing a totally different model string (e.g. comparing Flash to Pro).

### `Logo.tsx`
**Purpose**: Master vector implementation of the DevDocs AI brand identity. Constrains colors and SVG curves.
- **Exports**: The `Logo` wordmark component used across identical navbars and `LogoIcon` (just the rounded icon frame, used as AI chat message avatars).

### `FeaturesSection.tsx`
**Purpose**: Marketing block describing key platform advantages. Contains static imagery representing `Cited Sources`, `Streamed Responses`, `Multi-Repo Support`, & `Any Public Repo`.

### `HowItWorksSection.tsx`
**Purpose**: Landing page visual explainer.
- **Interaction**: Features an `IntersectionObserver` triggered scroll-spy effect. As the user scrolls, floating text cards dynamically update the adjacent code terminal animation demonstrating chunking & indexing.

### `GitHubReposSection.tsx`
**Purpose**: Suggestion block on the landing page generating a random mix of repository pills (e.g., `vercel/next.js`, `facebook/react`) for users to instantly test without browsing GitHub.

### `Footer.tsx`
**Purpose**: Reusable footer component mapped across core layout bases.
- **Interaction**: Contains links (e.g., `#readme`) to static repositories and features a pure-CSS self-running animated vector demonstration (Pipeline mock) portraying GitHub fetching to Vector queries without using video assets.
