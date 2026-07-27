import { getSessionUser } from "@/lib/auth";
import {
  createAgent,
  getWorkspaceForUser,
  listAgents,
  seedAgentsForWorkspace,
  type AgentRow,
} from "@/lib/db";
import { staticRegistryAgents, type RegistryAgent } from "@/lib/data";

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

/** GET /api/agents?workspaceId=... → merged static + workspace n8n agents. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthenticated" }, { status: 401 });

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  const dynamic: RegistryAgent[] = [];
  if (workspaceId) {
    const ws = getWorkspaceForUser(workspaceId, user.id);
    if (!ws) return Response.json({ error: "Workspace not found" }, { status: 404 });
    // Lazily seed starter agents for workspaces created before this feature.
    seedAgentsForWorkspace(workspaceId);
    dynamic.push(...listAgents(workspaceId).map(toRegistry));
  }

  return Response.json({ agents: [...staticRegistryAgents(), ...dynamic] });
}

/** POST /api/agents → create an n8n agent (workspace owner only). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const workspaceId = body?.workspaceId;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const webhookPath =
    typeof body?.webhookPath === "string" ? body.webhookPath.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const category =
    typeof body?.category === "string" && body.category.trim()
      ? body.category.trim()
      : "Productivity";

  if (!workspaceId || !name || !webhookPath) {
    return Response.json(
      { error: "workspaceId, name, and webhookPath are required." },
      { status: 400 }
    );
  }

  const ws = getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return Response.json({ error: "Workspace not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return Response.json({ error: "Owner only" }, { status: 403 });

  const agent = createAgent(workspaceId, {
    name,
    description,
    category,
    webhookPath,
  });
  return Response.json({ agent: toRegistry(agent) }, { status: 201 });
}
