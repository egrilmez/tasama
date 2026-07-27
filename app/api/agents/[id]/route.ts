import { getSessionUser } from "@/lib/auth";
import {
  deleteAgent,
  getWorkspaceForUser,
  updateAgent,
  type AgentRow,
} from "@/lib/db";
import type { RegistryAgent } from "@/lib/data";

export const runtime = "nodejs";

function toRegistry(a: AgentRow): RegistryAgent {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    type: "chat",
    backend: "n8n",
    enabled: Boolean(a.enabled),
    editable: true,
    webhookPath: a.webhook_path,
  };
}

/** Resolve the owned workspace for a mutation, or an error Response. */
async function requireOwnedWorkspace(
  workspaceId: unknown
): Promise<{ error: Response } | { userId: string; workspaceId: string }> {
  const user = await getSessionUser();
  if (!user)
    return { error: Response.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (typeof workspaceId !== "string" || !workspaceId)
    return {
      error: Response.json({ error: "workspaceId is required" }, { status: 400 }),
    };
  const ws = getWorkspaceForUser(workspaceId, user.id);
  if (!ws)
    return { error: Response.json({ error: "Workspace not found" }, { status: 404 }) };
  if (ws.owner_id !== user.id)
    return { error: Response.json({ error: "Owner only" }, { status: 403 }) };
  return { userId: user.id, workspaceId };
}

/** PATCH /api/agents/[id] — update an n8n agent (owner only). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const auth = await requireOwnedWorkspace(body?.workspaceId);
  if ("error" in auth) return auth.error;

  const patch: {
    name?: string;
    description?: string;
    category?: string;
    webhookPath?: string;
    enabled?: boolean;
  } = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.category === "string") patch.category = body.category.trim();
  if (typeof body.webhookPath === "string") patch.webhookPath = body.webhookPath.trim();
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;

  const updated = updateAgent(id, auth.workspaceId, patch);
  if (!updated) return Response.json({ error: "Agent not found" }, { status: 404 });
  return Response.json({ agent: toRegistry(updated) });
}

/** DELETE /api/agents/[id]?workspaceId=... — delete an n8n agent (owner only). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  const auth = await requireOwnedWorkspace(workspaceId);
  if ("error" in auth) return auth.error;

  const ok = deleteAgent(id, auth.workspaceId);
  if (!ok) return Response.json({ error: "Agent not found" }, { status: 404 });
  return Response.json({ ok: true });
}
