import { getSessionUser } from "@/lib/auth";
import { createWorkspace } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthenticated" }, { status: 401 });
  const { name, arivaAssistantId, arivaApiKey } = await req.json();
  if (!name?.trim()) {
    return Response.json({ error: "Workspace name is required." }, { status: 400 });
  }
  const ws = createWorkspace(
    user.id,
    name.trim(),
    "org",
    arivaAssistantId?.trim() || undefined,
    arivaApiKey?.trim() || undefined
  );
  return Response.json({
    id: ws.id,
    name: ws.name,
    kind: ws.kind,
    hasAriva: Boolean(ws.ariva_assistant_id && ws.ariva_api_key),
    isOwner: true,
  });
}
