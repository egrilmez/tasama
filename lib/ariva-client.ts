/** Client helper: stream a one-off message through the ARIVA proxy.
 *  Returns { ok: false } when ARIVA is not configured (HTTP 501) or errors. */
export async function arivaStream(
  message: string,
  onDelta: (accumulated: string) => void,
  workspaceId?: string
): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, workspaceId }),
    });
    if (!res.ok || !res.body) return { ok: false, text: "" };

    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/event-stream")) {
      const json = await res.json().catch(() => null);
      if (json?.reply) {
        onDelta(json.reply);
        return { ok: true, text: json.reply };
      }
      return { ok: false, text: "" };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "delta" && evt.text) {
            acc += evt.text;
            onDelta(acc);
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }
    return { ok: acc.length > 0, text: acc };
  } catch {
    return { ok: false, text: "" };
  }
}
