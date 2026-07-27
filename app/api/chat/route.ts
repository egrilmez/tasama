import { getSessionUser } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Proxy to the ARIVA Assistant API (ariva.agenticdynamic.com).
 * Credentials are resolved per workspace (DB) with env vars as fallback;
 * the API key never reaches the client. SSE streams pass straight through.
 *
 * Env fallback:
 *   ARIVA_BASE_URL      (default: https://ariva.agenticdynamic.com)
 *   ARIVA_ASSISTANT_ID
 *   ARIVA_API_KEY
 */
export async function POST(req: Request) {
  const base = process.env.ARIVA_BASE_URL ?? "https://ariva.agenticdynamic.com";
  const { message, conversationId, confirmToken, decision, workspaceId } =
    await req.json();

  let assistantId = process.env.ARIVA_ASSISTANT_ID;
  let apiKey = process.env.ARIVA_API_KEY;

  if (workspaceId) {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const ws = getWorkspaceForUser(workspaceId, user.id);
    if (!ws) {
      return Response.json({ error: "Workspace not found" }, { status: 404 });
    }
    if (ws.ariva_assistant_id && ws.ariva_api_key) {
      assistantId = ws.ariva_assistant_id;
      apiKey = ws.ariva_api_key;
    }
  }

  if (!assistantId || !apiKey) {
    return Response.json({ error: "ARIVA is not configured" }, { status: 501 });
  }

  const upstream = await fetch(
    `${base}/api/v1/assistants/${encodeURIComponent(assistantId)}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        message,
        conversationId,
        confirmToken,
        decision,
        stream: true,
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return Response.json(
      { error: `ARIVA error ${upstream.status}: ${text.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }
  // Non-stream JSON (e.g. handoff/confirmation shapes)
  return new Response(upstream.body, {
    headers: { "Content-Type": "application/json" },
  });
}
