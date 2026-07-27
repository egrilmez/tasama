"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Search,
  Store,
  Settings2,
  Send,
  Plus,
  Pencil,
  Trash2,
  Webhook,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import type { RegistryAgent } from "@/lib/data";

interface MeWorkspace {
  id: string;
  name: string;
  kind: "personal" | "org";
  hasAriva: boolean;
  isOwner: boolean;
}
interface Me {
  user: { id: string; name: string; email: string; initials: string };
  workspaces: MeWorkspace[];
}

const N8N_BASE_HINT = "https://n8n.agenticdynamic.com/webhook/";
const emptyForm = { id: "", name: "", description: "", category: "", webhookPath: "" };

function MiniRail({ initials }: { initials: string }) {
  return (
    <aside className="w-[64px] shrink-0 bg-lavender border-r border-line flex flex-col items-center py-4 gap-4">
      <span className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center text-[11px] font-bold">
        {initials}
      </span>
      <div className="mt-auto flex flex-col items-center gap-4 text-muted">
        <Store size={17} />
      </div>
    </aside>
  );
}

export default function MarketplacePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [activeWs, setActiveWs] = useState<string | null>(null);
  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [tab, setTab] = useState<"browse" | "manage">("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Me | null) => {
        if (!j) {
          window.location.href = "/login";
          return;
        }
        setMe(j);
        const qsWs = new URLSearchParams(window.location.search).get("ws");
        setActiveWs(
          qsWs && j.workspaces.some((w) => w.id === qsWs)
            ? qsWs
            : (j.workspaces[0]?.id ?? null)
        );
      })
      .catch(() => {});
  }, []);

  const loadAgents = useCallback((wsId: string) => {
    fetch(`/api/agents?workspaceId=${encodeURIComponent(wsId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.agents) setAgents(j.agents as RegistryAgent[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeWs) loadAgents(activeWs);
  }, [activeWs, loadAgents]);

  const isOwner = Boolean(me?.workspaces.find((w) => w.id === activeWs)?.isOwner);
  const categories = useMemo(
    () => Array.from(new Set(agents.map((a) => a.category))).sort(),
    [agents]
  );
  const editable = agents.filter((a) => a.editable);
  const visible = agents.filter(
    (a) =>
      a.enabled &&
      (!category || a.category === category) &&
      a.name.toLowerCase().includes(query.toLowerCase())
  );

  const resetForm = () => {
    setForm({ ...emptyForm });
    setError(null);
  };

  const submitForm = async () => {
    if (!activeWs) return;
    if (!form.name.trim() || !form.webhookPath.trim()) {
      setError("Name and webhook path are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      workspaceId: activeWs,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "Productivity",
      webhookPath: form.webhookPath.trim(),
    };
    const res = form.id
      ? await fetch(`/api/agents/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error ?? "Could not save the agent.");
      return;
    }
    resetForm();
    loadAgents(activeWs);
  };

  const toggleAgent = async (a: RegistryAgent) => {
    if (!activeWs) return;
    await fetch(`/api/agents/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: activeWs, enabled: !a.enabled }),
    });
    loadAgents(activeWs);
  };

  const removeAgent = async (a: RegistryAgent) => {
    if (!activeWs) return;
    await fetch(
      `/api/agents/${a.id}?workspaceId=${encodeURIComponent(activeWs)}`,
      { method: "DELETE" }
    );
    if (form.id === a.id) resetForm();
    loadAgents(activeWs);
  };

  const startEdit = (a: RegistryAgent) => {
    setForm({
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      webhookPath: a.webhookPath ?? "",
    });
    setError(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 min-h-0 flex">
        <MiniRail initials={me?.user.initials ?? "U"} />
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-[1060px] mx-auto px-8 py-8">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink w-fit"
            >
              <ArrowLeft size={15} /> Back to chats
            </Link>
            <h1 className="font-display font-bold text-[30px] mt-3">
              Agent Marketplace
            </h1>
            <p className="text-muted mt-1">
              Run automation agents{" "}
              {isOwner ? "or manage your workspace's n8n agents." : "in your workspace."}
            </p>

            <div className="flex mt-6 border border-line rounded-lg w-fit overflow-hidden text-sm font-semibold">
              <button
                onClick={() => setTab("browse")}
                className={`flex items-center gap-1.5 px-4 py-2 ${
                  tab === "browse" ? "bg-lavender" : "hover:bg-panel text-muted"
                }`}
              >
                <Store size={14} /> Browse
              </button>
              {isOwner && (
                <button
                  onClick={() => setTab("manage")}
                  className={`flex items-center gap-1.5 px-4 py-2 border-l border-line ${
                    tab === "manage" ? "bg-lavender" : "hover:bg-panel text-muted"
                  }`}
                >
                  <Settings2 size={14} /> Manage agents
                </button>
              )}
            </div>

            {tab === "browse" ? (
              <>
                <label className="flex items-center gap-2 border border-line rounded-xl px-4 h-11 text-sm text-muted mt-5 max-w-[420px]">
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search agents..."
                    className="bg-transparent outline-none w-full text-ink"
                  />
                </label>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(category === c ? null : c)}
                        className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-colors ${
                          category === c
                            ? "bg-primary text-white border-primary"
                            : "border-line text-muted hover:bg-panel"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                  {visible.map((a, i) => (
                    <div
                      key={a.id}
                      className="border border-line rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md hover:border-primary/30 transition-all anim-rise"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="h-11 w-11 rounded-full bg-lavender grid place-items-center">
                          {a.type === "chat" ? (
                            <Bot size={19} className="text-primary" />
                          ) : (
                            <Sparkles size={19} className="text-primary" />
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold border border-line rounded-full px-2.5 py-1 text-muted">
                          {a.backend === "n8n" ? (
                            <>
                              <Webhook size={11} /> n8n
                            </>
                          ) : a.type === "chat" ? (
                            <>
                              <Bot size={11} /> Chat agent
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} /> UI agent
                            </>
                          )}
                        </span>
                      </div>
                      <div className="font-display font-semibold text-[17px] mt-4">
                        {a.name}
                      </div>
                      <p className="text-sm text-muted mt-1.5 flex-1">
                        {a.description}
                      </p>
                      <span className="text-[11px] font-semibold bg-panel border border-line rounded-full px-2.5 py-1 w-fit mt-4 text-muted">
                        {a.category}
                      </span>
                      <Link
                        href={`/?agent=${a.slug}`}
                        className="mt-4 h-10 rounded-lg bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-deep transition-colors"
                      >
                        <Send size={14} /> Run agent
                      </Link>
                    </div>
                  ))}
                </div>
                {visible.length === 0 && (
                  <div className="border border-line rounded-2xl mt-6 py-16 grid place-items-center text-center text-muted">
                    No agents match your search.
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 grid lg:grid-cols-[360px_1fr] gap-6">
                {/* Add / edit form */}
                <div className="border border-line rounded-2xl p-5 h-fit">
                  <div className="font-display font-semibold text-[16px] flex items-center gap-2">
                    {form.id ? (
                      <>
                        <Pencil size={15} className="text-primary" /> Edit agent
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="text-primary" /> New n8n agent
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Agent name"
                      className="border border-line rounded-lg px-3 h-10 text-sm outline-none focus:border-primary"
                    />
                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      placeholder="Category (e.g. Company Setup)"
                      className="border border-line rounded-lg px-3 h-10 text-sm outline-none focus:border-primary"
                    />
                    <div className="flex items-center border border-line rounded-lg pl-3 focus-within:border-primary">
                      <span className="text-[11px] text-muted whitespace-nowrap">
                        /webhook/
                      </span>
                      <input
                        value={form.webhookPath}
                        onChange={(e) =>
                          setForm({ ...form, webhookPath: e.target.value })
                        }
                        placeholder="workflow-path"
                        className="px-2 h-10 text-sm outline-none w-full"
                      />
                    </div>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="What does this agent do?"
                      rows={3}
                      className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                    />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={submitForm}
                        disabled={saving}
                        className="h-10 flex-1 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-60"
                      >
                        {saving ? "Saving..." : form.id ? "Save changes" : "Add agent"}
                      </button>
                      {form.id && (
                        <button
                          onClick={resetForm}
                          className="h-10 px-4 rounded-lg border border-line text-sm font-semibold text-muted hover:bg-panel"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted leading-snug">
                      The app POSTs {`{message, conversationId, workspaceId, userId}`}{" "}
                      to <span className="font-mono">{N8N_BASE_HINT}</span>
                      &lt;path&gt;. Return SSE (delta/done) or JSON{" "}
                      <span className="font-mono">{`{ "output": "..." }`}</span>.
                    </p>
                  </div>
                </div>

                {/* Existing n8n agents */}
                <div className="flex flex-col gap-3">
                  {editable.length === 0 && (
                    <div className="border border-line rounded-2xl py-14 grid place-items-center text-center text-muted text-sm">
                      No n8n agents yet — add one on the left.
                    </div>
                  )}
                  {editable.map((a) => (
                    <div
                      key={a.id}
                      className="border border-line rounded-xl p-4 flex items-start gap-3"
                    >
                      <span className="h-9 w-9 rounded-lg bg-lavender grid place-items-center shrink-0">
                        <Webhook size={16} className="text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{a.name}</span>
                          <span className="text-[10px] font-semibold bg-panel border border-line rounded-full px-2 py-0.5 text-muted">
                            {a.category}
                          </span>
                          {!a.enabled && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {a.description || "No description"}
                        </p>
                        <p className="text-[11px] text-muted mt-1 font-mono truncate">
                          /webhook/{a.webhookPath}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <label className="flex items-center gap-1 text-[11px] text-muted mr-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={a.enabled}
                            onChange={() => toggleAgent(a)}
                          />
                          on
                        </label>
                        <button
                          onClick={() => startEdit(a)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-line text-muted hover:text-ink hover:bg-panel"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeAgent(a)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-line text-muted hover:text-red-600 hover:border-red-200"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
