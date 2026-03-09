# DevDocs AI — Frontend Blueprint

> Complete specification for the Landing Page + Chat Interface

---

## Design Direction

**Theme:** Dark-mode first, developer-focused, premium SaaS aesthetic.  
**Inspiration:** The Stakely chat UI — clean dark surfaces, subtle gradients, glowing accents.  
**Font:** `Inter` from Google Fonts (weights: 400, 500, 600, 700).  
**Color Palette:**

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0F` | Page background |
| `--bg-surface` | `#111118` | Cards, sections |
| `--bg-elevated` | `#1A1A24` | Inputs, chat area, navbar |
| `--border` | `#2A2A3A` | Subtle borders |
| `--text-primary` | `#F1F1F3` | Headings, body |
| `--text-secondary` | `#8A8A9A` | Muted text, labels |
| `--accent` | `#7C5CFF` | Buttons, links, glow effects |
| `--accent-glow` | `rgba(124, 92, 255, 0.15)` | Hover states, glows |
| `--gradient-hero` | `linear-gradient(135deg, #7C5CFF, #00D4AA)` | Hero headlines |
| `--success` | `#00D4AA` | Status indicators |

---

## Site Architecture

```
Landing Page (/)
├── Navbar
├── Hero Section
├── What Is It Section
├── How It Works Section
├── CTA Section
└── Footer

Chat Page (/chat)
├── Sidebar (repo selector)
├── Chat Header (model info)
├── Message Area
├── Source Cards
└── Chat Input
```

---

## PHASE 1 — Navbar

**Component:** Sticky top bar, transparent on landing, solid on scroll.  
**shadcn components:** `Button`

### Layout
```
[Logo + "DevDocs AI"]                    [Features] [How It Works] [GitHub] [Try It Free]
```

### Copy
- Logo text: **DevDocs AI**
- Nav links: `Features`, `How It Works`, `GitHub` (external link to repo)
- CTA button: **Try It Free** (links to `/chat`)

### Behavior
- On scroll past hero: background becomes `--bg-elevated` with a bottom border.
- Mobile: hamburger menu.
- CTA button has a glassmorphism effect and a border-glow animation on hover.

---

## PHASE 2 — Hero Section

**Goal:** Immediate clarity on what the product does. Visitor decides in 5 seconds.

### Layout
```
                    [Eyebrow badge]
              [Main Headline — 2 lines]
                  [Subheadline]
        [Input: paste repo URL] [Start Chatting]
```

### Copy

- **Eyebrow badge:** `Powered by Gemini 2.5 Flash`
- **Headline:**  
  `Chat with any GitHub repo.`  
  `Instantly.`
- **Subheadline:**  
  `Paste a public repository URL and start asking questions in plain English. DevDocs AI reads the docs so you don't have to.`
- **Input placeholder:** `Enter repository URL...`
- **CTA button:** `Start Chatting`

### Design Notes
- The headline "Instantly." should use `--gradient-hero` as text color (CSS `background-clip: text`).
- A faint radial glow (`--accent-glow`) behind the hero area.
- The input + button combo is a unified pill-shaped element. The button should have a "shimmer" effect—a subtle light sweep that passes over it every few seconds for a premium feel.

---

## PHASE 3 — What Is It Section

**Goal:** Explain the value proposition in simple terms.

### Layout
```
[Section Title]
[Section Subtitle]

[Card 1]          [Card 2]          [Card 3]
```

### Copy

- **Section Title:** `Stop searching. Start asking.`
- **Section Subtitle:** `DevDocs AI is a RAG-powered chatbot that turns any repository's documentation into a conversational interface with citations.`

**Card 1 — Instant Ingestion**
- Title: `Paste And Go`
- Body: `Drop any public GitHub URL. DevDocs AI automatically discovers and indexes every documentation file in the repository.`

**Card 2 — Cited Answers**
- Title: `Answers With Receipts`
- Body: `Every response includes the exact file name and text snippet the AI used. No hallucinations, just grounded answers from the actual source.`

**Card 3 — Streaming Chat**
- Title: `Real-Time Streaming`
- Body: `Answers appear token by token for a natural, responsive feel. No loading spinners, just fast, live responses powered by Gemini.`

### Design Notes
- Cards should have `--bg-surface` background, a `--border` border, and a subtle hover lift effect.
- shadcn components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`

---

## PHASE 4 — How It Works Section

**Goal:** Show the technical flow in 4 simple steps. Builds confidence.

### Layout
```
[Section Title]

[Step 1] [Step 2] [Step 3] [Step 4]
```

### Copy

- **Section Title:** `From URL to answers in under a minute.`

**Step 1 — Crawl**
- Number: `01`
- Title: `Crawl the Repo`
- Body: `The GitHub Trees API maps every documentation file in a single request.`

**Step 2 — Chunk**
- Number: `02`
- Title: `Chunk And Embed`
- Body: `Docs are split into segments and embedded using Gemini's vector model.`

**Step 3 — Store**
- Number: `03`
- Title: `Index Locally`
- Body: `Vectors are stored in your local ChromaDB instance. No cloud cost, total privacy.`

**Step 4 — Chat**
- Number: `04`
- Title: `Ask Anything`
- Body: `Your question is matched to the most relevant chunks. Gemini generates a cited answer.`

### Design Notes
- Steps displayed asNumbered cards in a horizontal row.
- The step number should be large and faded in the background.
- Active/hover step gets a left border in `--accent`.
- shadcn components: `Card` (minimal variant)

---

## PHASE 5 — CTA Section

**Goal:** Final push to get the user to try the product.

### Layout
```
[Headline]
[Subheadline]
[Try DevDocs AI]
```

### Copy
- **Headline:** `Ready to talk to your next codebase?`
- **Subheadline:** `No sign-up required. Paste a repo URL and start chatting in seconds.`
- **CTA button:** `Get Started Now`

### Design Notes
- Full-width section with a radial purple glow.
- Improved CTA: The button should use a multi-layered glow. A primary border glow plus a soft outer shadow that pulses slowly. When hovered, the glow intensifies.

---

## PHASE 6 — Footer

### Layout
```
[DevDocs AI logo]     [GitHub] [Built for GSoC]
```

### Copy
- `© 2026 DevDocs AI. Powered by Google Gemini.`
- Links: GitHub Repo, About the Project.

### Design Notes
- Minimal, single-row footer.
- `--bg-primary` background, `--text-secondary` text.
- shadcn: just standard HTML.

---

## PHASE 7 — Chat Page (`/chat`)

**Reference Design:** Stakely chat interface.

### Layout
- **Sidebar:** Dark, collapsible, contains the repository list and a "Add New" button.
- **Message Area:** Centered and clean.
- **Empty State:**
  - A centered dark chrome/glass sphere (like the Stakely bot).
  - Text: `Let's get started.`
  - Subtext: `How can I assist you today?`
- **Chat Input:** A floating pill-shaped input bar at the bottom with a subtle glow.

### Sidebar
- **Header:** DevDocs AI logo + collapse button
- **"+ New Repo" button:** Opens a modal/dialog with the repo URL input
- **Repo list:** Each ingested repo shown as a clickable item with its slug
- **Active repo:** Highlighted with `--accent` left border
- shadcn components: `Sheet` (mobile), `Button`, `ScrollArea`, `Dialog`

### Chat Header
- Shows the currently selected repo name
- Model indicator badge: `Gemini 2.5 Flash`
- shadcn: `Badge`

### Message Area
- **Bot messages:** Left-aligned, with a small avatar/icon, rendered in Markdown
- **User messages:** Right-aligned, with `--bg-elevated` background bubble
- **Source cards:** After each bot message, display file name badges that link to GitHub
- shadcn: `Avatar`, `Badge`, `ScrollArea`, `Card`

### Chat Input
- Full-width input bar at the bottom
- Placeholder: `Ask me anything about this repo...`
- Suggestion chips below: `What does this project do?` | `How do I install it?` | `Show me the API`
- Send button on the right (purple accent, circular)
- shadcn: `Input`, `Button`
- On submit: call `POST /api/v1/chat` and stream the response

### Repo Ingestion Flow (when adding a new repo)
1. User clicks "+ New Repo"
2. Dialog opens with `Input` for URL
3. On submit: calls `POST /api/v1/ingest`
4. Dialog shows progress (polls `GET /api/v1/ingest/status/{name}`)
5. On completion: dialog closes, new repo appears in sidebar, auto-selected

### Streaming Behavior
- First chunk from the API starts with `METADATA:` — parse this to extract source file names
- Subsequent chunks are the actual answer text — append them to the message area in real time
- After streaming is complete, render the source cards below the message

---

## Build Order Summary

| Phase | Section | Est. Time |
|---|---|---|
| 1 | Navbar | 30 min |
| 2 | Hero Section | 45 min |
| 3 | What Is It | 30 min |
| 4 | How It Works | 30 min |
| 5 | CTA Section | 15 min |
| 6 | Footer | 10 min |
| 7 | Chat Page | 1.5 hr |

**Total estimated build time: ~4–5 hours**

---

## API Endpoints (Backend Reference)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/v1/ingest` | Start repo ingestion (body: `{repo_url, branch}`) |
| `GET` | `/api/v1/ingest/status/{name}` | Poll ingestion progress |
| `POST` | `/api/v1/chat` | Stream chat response (body: `{repo_url, query}`) |

---

## Technical Notes

1. **Streaming in Next.js:** Use `fetch()` with `response.body.getReader()`. Don't use Axios — it buffers the full response.
2. **Markdown rendering:** Use `react-markdown` with `remark-gfm` for rendering bot responses.
3. **State management:** Use React `useState` + `useContext` for the selected repo and chat history. No need for Redux.
4. **Responsive:** Sidebar collapses into a `Sheet` on mobile. Chat input stays fixed at the bottom.
5. **Animations:** Use `framer-motion` for section reveals on the landing page and message entry animations in chat.
