# Spec: n8n-backed Agents + Dynamic Registry

**Date:** 2026-07-27
**Status:** Approved (design)

## Goal

Let Tasama run automation agents backed by n8n workflows at
`n8n.agenticdynamic.com`, managed at runtime per workspace, and surfaced in the
existing Agent Marketplace alongside the current mock/ARIVA agents. Focus:
Saudi market-entry ("soft-landing") agents for companies.

## Webhook contract (n8n side)

App → `POST ${N8N_BASE_URL}/webhook/<webhook_path>` (no auth for now):

```json
{ "message": "user text", "conversationId": "opt", "workspaceId": "...", "userId": "..." }
```

n8n responds with **either**, and the proxy streams to the UI as SSE:

- **SSE** in the existing shape (passed through unchanged):
  `data: {"type":"delta","text":"…"}` … `data: {"type":"done","suggestions":[]}` … `data: [DONE]`
- **Plain JSON** — `{ "output": "…" }` (also accepts `reply`/`text`/`message`)
  → proxy wraps into one `delta` + `done` + `[DONE]` stream.

`N8N_BASE_URL` is an env var (default `https://n8n.agenticdynamic.com`), mirroring the ARIVA setup.

## Data model — new `agents` table (SQLite)

```
id TEXT PK, workspace_id TEXT FK, slug TEXT, name TEXT, description TEXT,
category TEXT, backend TEXT DEFAULT 'n8n', webhook_path TEXT,
enabled INTEGER DEFAULT 1, created_at INTEGER, UNIQUE(workspace_id, slug)
```

Idempotent seeding keyed on a marker table `workspace_agent_seed(workspace_id PK)`:
`seedAgentsForWorkspace(ws)` inserts the starters once (never re-seeds after
deletion). Called from `createWorkspace` and lazily from `GET /api/agents`.

### Starter agents (soft-landing, placeholder webhook paths)

| name | category | webhook_path |
|------|----------|--------------|
| Trade License Assistant | Company Setup | tasama-trade-license |
| Company Formation Guide | Company Setup | tasama-company-formation |
| Visa & Iqama Navigator | Government | tasama-visa-iqama |
| PRO & Government Desk | Government | tasama-gov-desk |

## Registry = static + dynamic, merged

- Static agents stay in `lib/data.ts`; each gains `backend: "mock" | "ariva" | "n8n"`.
- `GET /api/agents?workspaceId=` (session required) → merged list: static agents
  (always enabled) + this workspace's DB agents (with `enabled`, `webhook_path`, `id`).
  Common shape: `{ id, slug, name, description, category, type, backend, enabled }`.
- Store fetches it into app state on workspace load; Composer/Sidebar/ChatThread
  read from the store. Marketplace (standalone page) fetches `/api/me` +
  `/api/agents` itself.

## Runtime admin (owner-only)

"Manage agents" section in the Marketplace. Workspace **owners** (from
`/api/me` `isOwner`) can add / edit / enable-disable / delete n8n agents
(fields: name, description, category, webhook_path).

- `POST /api/agents` — create (owner). Generates slug + id.
- `PATCH /api/agents/[id]` — update (owner).
- `DELETE /api/agents/[id]` — delete (owner).

All guarded by session + `workspace.owner_id === user.id`.

## Routing (reuses chat flow)

`/api/chat` becomes a router. Request gains optional `agentId`:
- `agentId` resolves to an enabled n8n agent in the caller's workspace →
  proxy to `runN8nAgent(webhook_path, {message, conversationId, workspaceId, userId})`.
- else → existing ARIVA / mock path (unchanged).

Client `store.tsx sendMessage` passes the active chat agent's `id`. The SSE
parser is unchanged (identical delta/done format).

## Units (independently testable)

- `lib/db.ts` — `agents` CRUD (`listAgents`, `getAgent`, `createAgent`,
  `updateAgent`, `deleteAgent`) + `seedAgentsForWorkspace`.
- `lib/n8n-client.ts` — `runN8nAgent(path, body): Promise<Response>` +
  JSON→SSE conversion. Handles upstream errors → 502.
- `app/api/agents/route.ts` (GET/POST) + `app/api/agents/[id]/route.ts` (PATCH/DELETE).
- `app/api/chat/route.ts` — n8n routing branch.
- `lib/store.tsx` — registry state + `agentId` in sendMessage.
- Marketplace — dynamic category filter + manage UI.

## Error handling

- n8n unreachable / non-2xx → 502 with short message; client falls back to mock reply.
- Missing/disabled agent or non-member workspace → 404.
- Non-owner mutation → 403. Unauthenticated → 401.
- `busy_timeout` already guards concurrent SQLite writes.

## Out of scope (YAGNI)

Webhook auth (none for now), per-agent streaming toggle (auto-detected),
agent analytics, sharing agents across workspaces.
