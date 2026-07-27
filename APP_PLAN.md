# TASAMA Core Clone — Reverse-Engineering Analysis & App Plan

Source: 10 screenshots of `core.tasama.com.sa` (TASAMA | CORE), an enterprise AI workspace platform built for the Saudi market (Arabic/English, sovereign locally-hosted models).

---

## 1. What the product is

An **enterprise multi-tenant AI workspace**: ChatGPT-style chat grounded in a per-workspace knowledge base, plus a **marketplace of task-specific agents** that can either respond in chat ("Chat agent") or render a live interactive mini-app in a side panel ("UI agent"). Branding: "Powered by TASAMA".

---

## 2. Screen-by-screen inventory (what was observed)

### 2.1 Global layout
- **Top bar** (dark indigo `#1E1EA8`-ish): `TASAMA | CORE` logo (with Arabic sub-text).
- **Left sidebar** (light lavender):
  - Search workspaces
  - Workspace list: personal workspace ("Ahmed Alsugair", avatar `AA`) + org workspace ("CPS")
  - `+ New AI Workspace`
  - Section header: `<WORKSPACE> · ALL CHATS` with collapse icon
  - `+ New Chat` (primary button), `Search in Chats…`, `My Files`
  - `ALL CHATS (n)` list — each chat row has title, message-count badge, kebab menu
  - Footer: `Agent Marketplace`, `Language` (i18n switcher), user card (name + email)
  - Sidebar has a collapsed mini-rail state (icons only) — seen on the Marketplace screen.
- **Workspace tabs** (top of main area): `Chats` | `Dashboard` | `Knowledge Base`, prefixed by workspace name.

### 2.2 Chat home (empty state)
- Hero: **"Ready when you are."**
- Composer card:
  - Hints above input: `@ Type @ to mention a file` · `📎 Or use the paperclip to upload a new one`
  - Placeholder `Ask anything...`
  - Controls: paperclip (attach), **Agents & Tools** popover button, **model selector** pill (`Qwen3.6 27B ▾`), help `?`, round send button
- Below composer: `AGENTS` chip row — quick-launch chips: Goals Copilot, Language Intelligence, Meeting Intelligence, QR Studio.

### 2.3 Model selector
- Dropdown listing locally hosted models with Saudi flag icons: **Qwen3.6 27B** (checked), **GPT OSS 120B**. → sovereign/on-prem inference is a selling point.

### 2.4 Agents & Tools popover
- **Knowledge Base** toggle — "Enabled: AI will search only within your attached files. Other workspace documents are not included."
- **Quick web search** toggle — "results in a few seconds."
- `AGENTS` section listing each agent with type label: `Goals Copilot — Chat agent`, `Language Intelligence — UI agent`, `Meeting Intelligence — UI agent`, `QR Studio — UI agent`.

### 2.5 Attach Files modal ("Attach Files to Chat")
- Upload dropzone: "Drop files here or click to upload", **max 5 files, up to 50 MB each**, `Choose Files` button.
- Supported formats: **PDF, Word, PowerPoint, Excel (.xlsx, .xlsm), TXT, MD**.
- "Select from Existing Files": search box, `All Types` filter, scope filter, `+ Add New Files`, empty state "No files found".

### 2.6 RAG chat in action
- User bubble (right, indigo): "what does tasama offer part of D&T?"
- Assistant status while retrieving: animated dots + **"Searching attached files… (4): D&T Offerings"** (shows file count & matched doc name).
- Attached file chip in composer (`2026.07.08_… ✕`) and a removable `Knowledge Base ✕` scope chip.
- Notice above composer: "Knowledge base is limited to your attached files for this message."

### 2.7 Goals Copilot — chat agent + live UI panel (flagship pattern)
- Left: chat thread. Agent intro bubble: "Turn rough objectives into clear, measurable, SMART goals." Status line at bottom: **"Running in the agent panel…"** with `Stop`; later **"✓ Done"** with `Close`.
- Right: **side panel** headed `✨ Goals Copilot` with a **Live** badge and expand icon, rendering a branded mini-app:
  - `TASAMA Core` header + "← Review a spreadsheet" link
  - Title: **Goals Intelligence Agent** — "Pick a division, write a goal, and I'll check it against the five SMART criteria, whether it aligns with that division's KPIs, and offer a sharper rewrite."
  - Input state: "What goal are you working on?" + Division dropdown + goal text input + send.
  - Result state: per-criterion rows (S/M/A/R/T, each ✅/❌ with explanation) + `KPI — Division KPI` alignment row + amber "This goal needs review" verdict + "To improve:" paragraph + highlighted **SUGGESTED REWRITE** card.
  - Footer: "Powered by TASAMA".
- The chat thread mirrors the same analysis as markdown (S ❌ / M ✅ … + suggested rewrite) — dual output: prose in chat, interactive UI in panel.

### 2.8 Agent Marketplace
- Full-page view: "← Back to chats", title **Agent Marketplace** — "Run automation agents and pick up saved sessions where you left off."
- Tabs: `Browse` | `My sessions`. Search agents. Category filter chips: `HR`, `Productivity`.
- Agent cards: icon, type badge (`Chat agent` / `UI agent`), name, description, category tag, **Run agent** button.
- Catalog observed:
  | Agent | Type | Category | Description |
  |---|---|---|---|
  | Goals Copilot | Chat agent | HR | Turn rough objectives into clear, measurable, SMART goals |
  | Language Intelligence | UI agent | Productivity | Translate seamlessly between Arabic and English while preserving meaning and tone |
  | Meeting Intelligence | UI agent | Productivity | Turn meeting notes into clear actions, owners, and next steps |
  | QR Studio | UI agent | Productivity | Generate high-quality QR codes from links or text in seconds |

### 2.9 Not fully shown but implied
- `Dashboard` tab (usage/analytics per workspace), `Knowledge Base` tab (workspace-level document library), `My Files`, multi-workspace admin, Arabic UI via Language switcher (RTL).

---

## 3. Core product concepts (the domain model)

1. **Workspace** — tenant boundary. Personal + organizational. Own chats, files, KB, dashboard, members.
2. **Chat** — conversation in a workspace; message count; per-message tool scopes (KB on/off, web search on/off, attached files).
3. **File / Knowledge Base** — uploaded docs, chunked + embedded for retrieval; chat-scoped attachments vs workspace-level KB.
4. **Agent** — packaged capability with metadata (name, icon, type, category, description).
   - **Chat agent**: system-prompt/tool pipeline that replies in the thread.
   - **UI agent**: additionally renders an interactive micro-app in the live side panel; chat and panel stay in sync ("Running in the agent panel…" → "Done").
5. **Agent session** — resumable runs ("pick up saved sessions where you left off" → `My sessions`).
6. **Model** — selectable per message; locally hosted open models (sovereignty).

---

## 4. Clone architecture & tech stack

### Backend option A (preferred): ARIVA as the RAG engine

`ariva.agenticdynamic.com` (own product) exposes a headless Assistant API — verified from its OpenAPI spec (`/api/v1/openapi.json`):

- `POST /api/v1/assistants/{assistantId}/chat`, auth `Bearer ak_live_…` (per-assistant key)
- Request: `{ message, conversationId?, stream?, confirmToken?, decision? }`
- Response: `{ conversationId, reply (markdown), locations[], sources[], suggestions[] }`, or `requires_confirmation` (tool-approval flow), or `{ handoff: true }` (human takeover)
- SSE streaming: `delta` events → final `done` event with sources/suggestions

**Mapping to the TASAMA clone:**
| TASAMA Core concept | ARIVA feature |
|---|---|
| Workspace knowledge base + grounded answers | Assistant document store + RAG `reply` |
| Chat threads / multi-turn | `conversationId` (stored per chat) |
| "Searching attached files…" + source grounding | `sources[]` rendered as chips |
| Agent quick actions / follow-ups | `suggestions[]` chips |
| UI-agent tool approval (Stop/confirm) | `requires_confirmation` + `confirmToken` |
| Escalation to human | `handoff` ack |

**Integration (implemented):** Next.js route `app/api/chat/route.ts` proxies to ARIVA (key stays server-side), streams SSE through; the client store consumes deltas and falls back to mock replies when `ARIVA_ASSISTANT_ID`/`ARIVA_API_KEY` are unset (`.env.local`, see `.env.local.example`). One ARIVA assistant ≈ one TASAMA workspace KB; multiple workspaces → multiple assistants/keys.

**Gaps ARIVA doesn't cover (keep in-app):** per-chat ad-hoc file upload (public API has chat only — docs are managed in the ARIVA dashboard), the model-selector (ARIVA picks the model), Goals Copilot panel logic, marketplace/session management.

### Recommended stack
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; `next-intl` for EN/AR with full RTL.
- **AI layer**: Vercel AI SDK v6 — streaming chat, tool calling, and **generative UI / data streaming** for the UI-agent side panel. AI Gateway (or self-hosted vLLM/Ollama endpoints) behind a model registry so "Qwen3.6 27B / GPT OSS 120B"-style local models are pluggable per deployment.
- **Backend**: Next.js route handlers (Fluid Compute); Postgres (Neon/Supabase) + `pgvector` for embeddings; Drizzle ORM.
- **Storage**: Vercel Blob or S3-compatible for uploaded files.
- **Auth & tenancy**: Auth.js (or Clerk) with organizations → workspaces; row-level tenancy by `workspace_id`.
- **Doc ingestion**: server-side pipeline — extract (pdf-parse / mammoth / xlsx), chunk, embed, upsert to pgvector; background jobs via Vercel Queues.
- **Web search tool**: Tavily/Brave API behind the "Quick web search" toggle.

### Data model (first pass)
```
users(id, name, email, avatar, locale)
workspaces(id, name, type[personal|org], owner_id)
workspace_members(workspace_id, user_id, role)
chats(id, workspace_id, title, agent_id?, created_by, message_count)
messages(id, chat_id, role, content, model_id, scopes{kb,web,file_ids}, agent_run_id?)
files(id, workspace_id, name, mime, size, blob_url, status[processing|ready])
chunks(id, file_id, content, embedding vector, meta)
agents(id, slug, name, type[chat|ui], category, description, icon, config{system_prompt, tools, ui_schema})
agent_sessions(id, agent_id, workspace_id, user_id, state jsonb, status[running|done|stopped])
models(id, label, provider, endpoint, flag/region, enabled)
```

### Key mechanisms
1. **Chat pipeline**: message → scope resolution (attached files ∩ KB toggle, web toggle) → retrieval (top-k pgvector, emit "Searching attached files… (n): <top doc>" status event) → model stream → persist.
2. **UI-agent protocol**: agent run streams two channels — chat markdown + structured JSON state for the panel (AI SDK `streamObject`/data parts). Panel is a registered React component per agent rendering that state (SMART checklist, translation view, meeting actions table, QR preview). Status lifecycle: `running → done | stopped`, with Stop/Close controls.
3. **Marketplace**: static registry table + per-workspace enablement; `My sessions` lists `agent_sessions` for resume.
4. **i18n/RTL**: locale switcher in sidebar footer; `dir="rtl"` for Arabic; Language Intelligence agent doubles as a showcase.

---

## 5. Build roadmap (phased)

### Phase 0 — Foundation (week 1)
Scaffold Next.js + Tailwind + shadcn, auth, Postgres schema, app shell: top bar, sidebar (workspaces, chats, footer), workspace tabs, empty-state chat home with composer. Design tokens matched to screenshots (indigo primary ~`#2320C6`, lavender sidebar, rounded-2xl cards).

### Phase 1 — Core chat (weeks 1–2)
Streaming chat with model selector (model registry), chat CRUD + sidebar list with counts, message persistence, "Ready when you are." empty state, agent quick-launch chips (stub).

### Phase 2 — Files & RAG (weeks 2–3)
Attach Files modal (dropzone, 5×50MB validation, format whitelist, existing-file picker), ingestion pipeline, `@` file mention, KB/web-search toggles in Agents & Tools popover, retrieval status events ("Searching attached files… (n): <doc>"), per-message scope chips, My Files + Knowledge Base tab.

### Phase 3 — Agent framework (weeks 3–4)
Agent registry + Agents & Tools popover listing, chat agents (Goals Copilot: SMART + division-KPI analysis prompt), **live side panel runtime** for UI agents with streamed structured state, Stop/Done lifecycle, panel expand. Ship the 4 launch agents: Goals Copilot (chat+panel), Language Intelligence, Meeting Intelligence, QR Studio (client-side QR lib).

### Phase 4 — Marketplace & sessions (week 5)
Marketplace page (browse, search, category filters, Run agent), agent sessions persistence + My sessions resume.

### Phase 5 — Enterprise polish (week 6+)
Dashboard tab (usage metrics), org workspaces + member management, Arabic locale + RTL pass, admin model management, audit/log, deployment hardening (optionally fully self-hosted inference for data sovereignty).

---

## 6. Risks / open questions
- **UI-agent sandboxing**: are panels first-party React components (recommended for v1) or third-party sandboxed iframes (marketplace extensibility later)?
- **Sovereign inference**: local GPU serving (vLLM) vs cloud gateway — affects infra cost materially.
- **Dashboard & Knowledge Base tabs** were not captured in detail — scope them from product needs, not the screenshots.
- Trademark note: clone the *patterns*, not the TASAMA brand/logo.
