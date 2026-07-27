"use client";

import { X, Loader2, KeyRound } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";

export default function WorkspaceModal() {
  const { workspaceModalOpen, setWorkspaceModalOpen, addWorkspace } = useApp();
  const [name, setName] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!workspaceModalOpen) return null;

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        arivaAssistantId: assistantId,
        arivaApiKey: apiKey,
      }),
    });
    if (res.ok) {
      addWorkspace(await res.json());
      setWorkspaceModalOpen(false);
      setName("");
      setAssistantId("");
      setApiKey("");
    } else {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Could not create the workspace.");
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 grid place-items-center p-6"
      onClick={() => setWorkspaceModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] anim-rise p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-[20px]">
              New AI Workspace
            </h2>
            <p className="text-sm text-muted mt-1">
              A separate space with its own chats and knowledge base.
            </p>
          </div>
          <button
            onClick={() => setWorkspaceModalOpen(false)}
            className="text-muted hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name (e.g. CPS)"
            className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          <div className="rounded-xl border border-line bg-panel p-3.5">
            <div className="flex items-center gap-1.5 text-[13px] font-bold">
              <KeyRound size={13} className="text-primary" /> ARIVA connection
              <span className="text-muted font-normal">(optional)</span>
            </div>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Give this workspace its own ARIVA assistant. Leave empty to use
              the app default.
            </p>
            <input
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              placeholder="Assistant ID"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 bg-white"
            />
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API key (ak_live_…)"
              type="password"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 bg-white mt-2"
            />
          </div>
          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={submit}
            disabled={!name.trim() || busy}
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Create workspace
          </button>
        </div>
      </div>
    </div>
  );
}
