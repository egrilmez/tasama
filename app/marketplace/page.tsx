"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Search,
  Store,
  History,
  Send,
} from "lucide-react";
import { useState } from "react";
import TopBar from "@/components/TopBar";
import { AGENTS, USER } from "@/lib/data";

function MiniRail() {
  return (
    <aside className="w-[64px] shrink-0 bg-lavender border-r border-line flex flex-col items-center py-4 gap-4">
      <span className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center text-[11px] font-bold">
        AA
      </span>
      <span className="h-9 w-9 rounded-full bg-white text-primary grid place-items-center text-[11px] font-bold border border-line">
        C
      </span>
      <div className="mt-auto flex flex-col items-center gap-4 text-muted">
        <Store size={17} />
        <span className="h-8 w-8 rounded-full bg-white text-primary grid place-items-center text-[10px] font-bold border border-line">
          {USER.initials}
        </span>
      </div>
    </aside>
  );
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<"browse" | "sessions">("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const visible = AGENTS.filter(
    (a) =>
      (!category || a.category === category) &&
      a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 min-h-0 flex">
        <MiniRail />
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
              Run automation agents and pick up saved sessions where you left
              off.
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
              <button
                onClick={() => setTab("sessions")}
                className={`flex items-center gap-1.5 px-4 py-2 border-l border-line ${
                  tab === "sessions"
                    ? "bg-lavender"
                    : "hover:bg-panel text-muted"
                }`}
              >
                <History size={14} /> My sessions
              </button>
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
                <div className="flex gap-2 mt-3">
                  {["HR", "Productivity"].map((c) => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                  {visible.map((a, i) => (
                    <div
                      key={a.slug}
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
                          {a.type === "chat" ? (
                            <Bot size={11} />
                          ) : (
                            <Sparkles size={11} />
                          )}
                          {a.type === "chat" ? "Chat agent" : "UI agent"}
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
              </>
            ) : (
              <div className="border border-line rounded-2xl mt-6 py-16 grid place-items-center text-center">
                <History size={26} className="text-muted mb-2" />
                <div className="font-semibold">No saved sessions yet</div>
                <p className="text-sm text-muted mt-1">
                  Run an agent and your sessions will appear here.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
