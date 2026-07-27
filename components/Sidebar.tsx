"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  LibraryBig,
  Store,
  Globe,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { useApp } from "@/lib/store";

function wsInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export default function Sidebar() {
  const {
    chats,
    activeChatId,
    newChat,
    selectChat,
    user,
    workspaces,
    activeWorkspaceId,
    selectWorkspace,
    setWorkspaceModalOpen,
    signOut,
  } = useApp();

  return (
    <aside className="w-[300px] shrink-0 panel-card flex flex-col overflow-hidden">
      {/* brand */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3 select-none">
        <span className="h-9 w-9 rounded-xl grad-primary grid place-items-center font-display font-bold text-white text-[16px]">
          T
        </span>
        <div className="leading-none">
          <span className="font-display font-bold text-[16px] tracking-[0.16em] text-ink">
            TASAMA <span className="text-primary">CORE</span>
          </span>
          <div className="text-[6.5px] tracking-[0.08em] mt-1 text-muted">
            Business Services &nbsp;·&nbsp; خدمات الأعمال
          </div>
        </div>
      </div>

      {/* workspace search */}
      <div className="px-4 pb-2">
        <label className="flex items-center gap-2 bg-panel border border-line rounded-xl px-3 h-9 text-sm text-muted focus-within:border-primary/40 transition-colors">
          <Search size={15} />
          <input
            placeholder="Search workspaces"
            className="bg-transparent outline-none w-full placeholder:text-muted text-ink"
          />
        </label>
      </div>

      {/* workspaces */}
      <div className="px-4 space-y-1">
        {workspaces.map((ws) => {
          const active = ws.id === activeWorkspaceId;
          return (
            <button
              key={ws.id}
              onClick={() => selectWorkspace(ws.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-lavender text-primary"
                  : "text-ink hover:bg-panel"
              }`}
            >
              <span
                className={`h-7 w-7 rounded-lg grid place-items-center text-[11px] font-bold ${
                  active
                    ? "grad-primary text-white"
                    : "bg-panel text-muted border border-line"
                }`}
              >
                {wsInitials(ws.name)}
              </span>
              <span className="truncate">{ws.name}</span>
              {ws.hasAriva && (
                <span
                  title="Connected to ARIVA"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500"
                />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setWorkspaceModalOpen(true)}
          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted hover:bg-panel hover:text-ink transition-colors"
        >
          <Plus size={16} className="ml-1.5 mr-1" />
          New AI Workspace
        </button>
      </div>

      <div className="mx-4 my-3.5 h-px bg-line" />

      {/* chats section */}
      <div className="px-4 space-y-2">
        <button
          onClick={newChat}
          className="w-full h-10 rounded-xl grad-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/25"
        >
          <Plus size={16} /> New Chat
        </button>
        <label className="flex items-center gap-2 bg-panel border border-line rounded-xl px-3 h-9 text-sm text-muted focus-within:border-primary/40 transition-colors">
          <Search size={15} />
          <input
            placeholder="Search in Chats..."
            className="bg-transparent outline-none w-full placeholder:text-muted text-ink"
          />
        </label>
        <button className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-ink hover:bg-panel transition-colors">
          <LibraryBig size={16} className="text-muted" /> My Files
        </button>
      </div>

      {/* chat list */}
      <div className="px-4 mt-3 flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase mb-1.5">
          All Chats ({chats.length})
        </div>
        <div className="space-y-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className={`group w-full flex items-center rounded-xl px-2.5 py-2 text-sm transition-colors ${
                c.id === activeChatId
                  ? "bg-lavender text-primary font-semibold"
                  : "text-ink hover:bg-panel"
              }`}
            >
              <span className="truncate flex-1 text-left">{c.title}</span>
              {c.messages.length > 0 && (
                <span
                  className={`text-[11px] tabular-nums mr-1 ${
                    c.id === activeChatId ? "text-primary/70" : "text-muted"
                  }`}
                >
                  {c.messages.length}
                </span>
              )}
              <MoreVertical
                size={14}
                className={
                  c.id === activeChatId
                    ? "text-primary/70"
                    : "text-muted opacity-0 group-hover:opacity-100"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="border-t border-line">
        <Link
          href="/marketplace"
          className="flex items-center gap-2.5 px-5 py-3 text-sm text-ink hover:bg-panel transition-colors"
        >
          <Store size={16} className="text-muted" /> Agent Marketplace
        </Link>
        <button className="w-full flex items-center gap-2.5 px-5 py-3 text-sm text-ink hover:bg-panel transition-colors border-t border-line">
          <Globe size={16} className="text-muted" /> Language
        </button>
        <div className="flex items-center gap-2.5 px-5 py-3 border-t border-line bg-panel/60">
          <span className="h-8 w-8 rounded-lg grad-primary grid place-items-center text-[11px] font-bold text-white shrink-0">
            {user?.initials ?? "…"}
          </span>
          <div className="leading-tight min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {user?.name ?? "Loading…"}
            </div>
            <div className="text-[11px] text-muted truncate">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="text-muted hover:text-ink shrink-0"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
