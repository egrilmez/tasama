import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

function openDb() {
  // DATA_DIR lets the deployment place the SQLite file on durable storage
  // outside the app root (e.g. Azure App Service's persistent /home/data,
  // which survives restarts AND redeploys). Falls back to ./data locally.
  const dir = process.env.DATA_DIR
    ? process.env.DATA_DIR
    : path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "tasama.db"));
  // Wait (up to 5s) for a lock to clear instead of throwing "database is
  // locked" immediately. Next.js build imports all API routes in parallel
  // workers, each opening this DB and running the CREATE TABLE writes below,
  // which race on the file; busy_timeout serializes them safely. Also makes
  // the app resilient to concurrent request writes at runtime.
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'org',
      owner_id TEXT NOT NULL REFERENCES users(id),
      ariva_assistant_id TEXT,
      ariva_api_key TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      PRIMARY KEY (workspace_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Productivity',
      backend TEXT NOT NULL DEFAULT 'n8n',
      webhook_path TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      UNIQUE(workspace_id, slug)
    );
    -- Marks workspaces whose starter agents have been seeded, so deleting a
    -- seeded agent never causes it to be re-created.
    CREATE TABLE IF NOT EXISTS workspace_agent_seed (
      workspace_id TEXT PRIMARY KEY
    );
  `);
  return db;
}

// Survive Next.js dev HMR without leaking connections.
const globalForDb = globalThis as unknown as { __tasamaDb?: Database.Database };
export const db = globalForDb.__tasamaDb ?? openDb();
globalForDb.__tasamaDb = db;

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  kind: "personal" | "org";
  owner_id: string;
  ariva_assistant_id: string | null;
  ariva_api_key: string | null;
}

/* ---- users ---- */

export function createUser(name: string, email: string, passwordHash: string): UserRow {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, email.toLowerCase(), passwordHash, Date.now());
  return { id, name, email: email.toLowerCase(), password_hash: passwordHash };
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

/* ---- sessions ---- */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = randomUUID() + randomUUID().replaceAll("-", "");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(token, userId, expiresAt);
  return { token, expiresAt };
}

export function getSessionUserRow(token: string): UserRow | undefined {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, Date.now()) as UserRow | undefined;
  return row;
}

export function deleteSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* ---- workspaces ---- */

export function createWorkspace(
  ownerId: string,
  name: string,
  kind: "personal" | "org",
  arivaAssistantId?: string,
  arivaApiKey?: string
): WorkspaceRow {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO workspaces (id, name, kind, owner_id, ariva_assistant_id, ariva_api_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, kind, ownerId, arivaAssistantId ?? null, arivaApiKey ?? null, Date.now());
  db.prepare(
    "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')"
  ).run(id, ownerId);
  seedAgentsForWorkspace(id);
  return {
    id,
    name,
    kind,
    owner_id: ownerId,
    ariva_assistant_id: arivaAssistantId ?? null,
    ariva_api_key: arivaApiKey ?? null,
  };
}

export function listWorkspacesForUser(userId: string): WorkspaceRow[] {
  return db
    .prepare(
      `SELECT w.* FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
       WHERE m.user_id = ? ORDER BY w.created_at ASC`
    )
    .all(userId) as WorkspaceRow[];
}

export function getWorkspaceForUser(
  workspaceId: string,
  userId: string
): WorkspaceRow | undefined {
  return db
    .prepare(
      `SELECT w.* FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
       WHERE w.id = ? AND m.user_id = ?`
    )
    .get(workspaceId, userId) as WorkspaceRow | undefined;
}

export function updateWorkspace(
  workspaceId: string,
  ownerId: string,
  patch: { name?: string; arivaAssistantId?: string | null; arivaApiKey?: string | null }
): boolean {
  const ws = db
    .prepare("SELECT * FROM workspaces WHERE id = ? AND owner_id = ?")
    .get(workspaceId, ownerId) as WorkspaceRow | undefined;
  if (!ws) return false;
  db.prepare(
    `UPDATE workspaces SET
       name = COALESCE(?, name),
       ariva_assistant_id = COALESCE(?, ariva_assistant_id),
       ariva_api_key = COALESCE(?, ariva_api_key)
     WHERE id = ?`
  ).run(
    patch.name ?? null,
    patch.arivaAssistantId ?? null,
    patch.arivaApiKey ?? null,
    workspaceId
  );
  return true;
}

/* ---- agents (n8n-backed, per workspace) ---- */

export interface AgentRow {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  backend: string;
  webhook_path: string;
  enabled: number;
  created_at: number;
}

/** Starter soft-landing agents seeded into each new workspace. Placeholder
 *  webhook paths — the owner points them at real n8n workflows. */
const STARTER_AGENTS: ReadonlyArray<{
  name: string;
  description: string;
  category: string;
  webhookPath: string;
}> = [
  {
    name: "Trade License Assistant",
    description:
      "Guide foreign companies through Saudi commercial registration (CR) and trade license applications step by step.",
    category: "Company Setup",
    webhookPath: "tasama-trade-license",
  },
  {
    name: "Company Formation Guide",
    description:
      "Plan your MISA investment license and legal entity setup to establish operations in Saudi Arabia.",
    category: "Company Setup",
    webhookPath: "tasama-company-formation",
  },
  {
    name: "Visa & Iqama Navigator",
    description:
      "Navigate work visas, iqama issuance, and GOSI/Qiwa employee registration for your new team.",
    category: "Government",
    webhookPath: "tasama-visa-iqama",
  },
  {
    name: "PRO & Government Desk",
    description:
      "Handle Absher, Muqeem, and Qiwa portal tasks and government correspondence for your entity.",
    category: "Government",
    webhookPath: "tasama-gov-desk",
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Insert the starter agents for a workspace exactly once (idempotent). */
export function seedAgentsForWorkspace(workspaceId: string): void {
  const already = db
    .prepare("SELECT 1 FROM workspace_agent_seed WHERE workspace_id = ?")
    .get(workspaceId);
  if (already) return;
  const insert = db.prepare(
    `INSERT OR IGNORE INTO agents
       (id, workspace_id, slug, name, description, category, backend, webhook_path, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'n8n', ?, 1, ?)`
  );
  const seed = db.transaction(() => {
    for (const a of STARTER_AGENTS) {
      insert.run(
        randomUUID(),
        workspaceId,
        slugify(a.name),
        a.name,
        a.description,
        a.category,
        a.webhookPath,
        Date.now()
      );
    }
    db.prepare(
      "INSERT OR IGNORE INTO workspace_agent_seed (workspace_id) VALUES (?)"
    ).run(workspaceId);
  });
  seed();
}

/** All agents for a workspace (enabled and disabled), newest first. */
export function listAgents(workspaceId: string): AgentRow[] {
  return db
    .prepare(
      "SELECT * FROM agents WHERE workspace_id = ? ORDER BY created_at ASC"
    )
    .all(workspaceId) as AgentRow[];
}

export function getAgent(id: string, workspaceId: string): AgentRow | undefined {
  return db
    .prepare("SELECT * FROM agents WHERE id = ? AND workspace_id = ?")
    .get(id, workspaceId) as AgentRow | undefined;
}

export function createAgent(
  workspaceId: string,
  data: { name: string; description: string; category: string; webhookPath: string }
): AgentRow {
  const id = randomUUID();
  // Ensure slug uniqueness within the workspace.
  let slug = slugify(data.name) || "agent";
  const exists = (s: string) =>
    db
      .prepare("SELECT 1 FROM agents WHERE workspace_id = ? AND slug = ?")
      .get(workspaceId, s);
  if (exists(slug)) slug = `${slug}-${id.slice(0, 6)}`;
  const created_at = Date.now();
  db.prepare(
    `INSERT INTO agents
       (id, workspace_id, slug, name, description, category, backend, webhook_path, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'n8n', ?, 1, ?)`
  ).run(
    id,
    workspaceId,
    slug,
    data.name,
    data.description,
    data.category,
    data.webhookPath,
    created_at
  );
  return {
    id,
    workspace_id: workspaceId,
    slug,
    name: data.name,
    description: data.description,
    category: data.category,
    backend: "n8n",
    webhook_path: data.webhookPath,
    enabled: 1,
    created_at,
  };
}

export function updateAgent(
  id: string,
  workspaceId: string,
  patch: {
    name?: string;
    description?: string;
    category?: string;
    webhookPath?: string;
    enabled?: boolean;
  }
): AgentRow | undefined {
  const current = getAgent(id, workspaceId);
  if (!current) return undefined;
  db.prepare(
    `UPDATE agents SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       category = COALESCE(?, category),
       webhook_path = COALESCE(?, webhook_path),
       enabled = COALESCE(?, enabled)
     WHERE id = ? AND workspace_id = ?`
  ).run(
    patch.name ?? null,
    patch.description ?? null,
    patch.category ?? null,
    patch.webhookPath ?? null,
    patch.enabled === undefined ? null : patch.enabled ? 1 : 0,
    id,
    workspaceId
  );
  return getAgent(id, workspaceId);
}

export function deleteAgent(id: string, workspaceId: string): boolean {
  const res = db
    .prepare("DELETE FROM agents WHERE id = ? AND workspace_id = ?")
    .run(id, workspaceId);
  return res.changes > 0;
}
