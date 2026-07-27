/**
 * Server-side proxy to n8n workflow webhooks (n8n.agenticdynamic.com).
 *
 * The app POSTs {message, conversationId, workspaceId, userId} to a workflow's
 * webhook and streams the answer back to the browser as SSE in the same
 * delta/done shape the ARIVA path uses, so the client parser is shared.
 *
 * n8n workflows may respond in two ways — both are supported:
 *   1. A real SSE stream (Content-Type: text/event-stream) → passed through.
 *   2. A single JSON body (e.g. {"output": "..."}) → wrapped into one
 *      delta + done + [DONE] stream here.
 */

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

function n8nBase(): string {
  return process.env.N8N_BASE_URL ?? "https://n8n.agenticdynamic.com";
}

/** Build a one-shot SSE stream from a plain text answer. */
function textToSseStream(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const frames = [
    `data: ${JSON.stringify({ type: "delta", text })}\n\n`,
    `data: ${JSON.stringify({ type: "done", sources: [], suggestions: [] })}\n\n`,
    `data: [DONE]\n\n`,
  ];
  return new ReadableStream({
    start(controller) {
      for (const f of frames) controller.enqueue(enc.encode(f));
      controller.close();
    },
  });
}

/** Pull a human-readable answer out of an arbitrary n8n JSON response. */
function extractText(json: unknown): string {
  if (typeof json === "string") return json;
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    for (const key of ["output", "reply", "text", "message", "answer"]) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    // n8n sometimes wraps in an array of items: [{ json: { output } }] or [{...}]
    if (Array.isArray(json) && json.length) return extractText(json[0]);
    if ("json" in obj) return extractText(obj.json);
  }
  return "";
}

/**
 * Call an n8n agent webhook and return an SSE Response for the browser.
 * Returns a JSON error Response (502) if the upstream is unreachable or fails.
 */
export async function runN8nAgent(
  webhookPath: string,
  body: {
    message: string;
    conversationId?: string;
    workspaceId?: string;
    userId?: string;
  }
): Promise<Response> {
  const url = `${n8nBase()}/webhook/${encodeURIComponent(webhookPath)}`;
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return Response.json(
      { error: `n8n unreachable: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `n8n error ${upstream.status}: ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const ctype = upstream.headers.get("content-type") ?? "";

  // Real SSE stream → pass straight through.
  if (ctype.includes("text/event-stream") && upstream.body) {
    return new Response(upstream.body, { headers: SSE_HEADERS });
  }

  // Otherwise treat as a single JSON/text answer and synthesize a stream.
  let text = "";
  if (ctype.includes("application/json")) {
    const json = await upstream.json().catch(() => null);
    text = extractText(json);
  } else {
    text = (await upstream.text().catch(() => "")).trim();
  }
  if (!text) text = "The agent returned an empty response.";

  return new Response(textToSseStream(text), { headers: SSE_HEADERS });
}
