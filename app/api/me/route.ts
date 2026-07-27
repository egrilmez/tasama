import { getSessionUser } from "@/lib/auth";
import { listWorkspacesForUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthenticated" }, { status: 401 });
  const workspaces = listWorkspacesForUser(user.id).map((w) => ({
    id: w.id,
    name: w.name,
    kind: w.kind,
    hasAriva: Boolean(w.ariva_assistant_id && w.ariva_api_key),
    isOwner: w.owner_id === user.id,
  }));
  return Response.json({ user, workspaces });
}
