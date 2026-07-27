"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  LibraryBig,
  Store,
  Globe,
  MoreVertical,
  PanelLeft,
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
    <aside className="w-[290px] shrink-0 bg-lavender border-r border-line flex flex-col">
      {/* workspace search */}
      <div className="p-3 pb-2">
        <label className="flex items-center gap-2 bg-white rounded-lg border border-line px-3 h-9 text-sm text-muted">
          <Search size={15} />
          <input
            placeholder="Search workspaces"
            className="bg-transparent outline-none w-full placeholder:text-muted text-ink"
          />
        </label>
      </div>

      {/* workspaces */}
      <div className="px-3 space-y-1">
        {workspaces.map((ws) => {
          const active = ws.id === activeWorkspaceId;
          return (
            <button
              key={ws.id}
              onClick={() => selectWorkspace(ws.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-primary text-white" : "text-ink hover:bg-lavender-deep"
              }`}
            >
              <span
                className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-white text-primary"
                }`}
              >
                {wsInitials(ws.name)}
              </span>
              <span className="truncate">{ws.name}</span>
              {ws.hasAriva && (
                <span
                  title="Connected to ARIVA"
                  className={`ml-auto h-1.5 w-1.5 rounded-full ${
                    active ? "bg-green-300" : "bg-green-500"
                  }`}
                />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setWorkspaceModalOpen(true)}
          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-lavender-deep transition-colors"
        >
          <Plus size={16} className="ml-1.5 mr-1" />
          New AI Workspace
        </button>
      </div>

      {/* chats section */}
      <div className="mt-4 px-3 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide text-muted uppercase truncate">
          {user?.name ?? "…"} · All Chats
        </span>
        <PanelLeft size={14} className="text-muted shrink-0" />
      </div>

      <div className="p-3 pt-2 space-y-2">
        <button
          onClick={newChat}
          className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-deep transition-colors shadow-sm"
        >
          <Plus size={16} /> New Chat
        </button>
        <label className="flex items-center gap-2 bg-white rounded-lg border border-line px-3 h-9 text-sm text-muted">
          <Search size={15} />
          <input
            placeholder="Search in Chats..."
            className="bg-transparent outline-none w-full placeholder:text-muted text-ink"
          />
        </label>
        <button className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-lavender-deep transition-colors">
          <LibraryBig size={16} className="text-muted" /> My Files
        </button>
      </div>

      {/* chat list */}
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="text-[11px] font-bold tracking-wide text-muted uppercase mb-1.5">
          All Chats ({chats.length})
        </div>
        <div className="space-y-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className={`group w-full flex items-center rounded-lg px-2.5 py-2 text-sm transition-colors ${
                c.id === activeChatId
                  ? "bg-primary text-white font-semibold"
                  : "text-ink hover:bg-lavender-deep"
              }`}
            >
              <span className="truncate flex-1 text-left">{c.title}</span>
              {c.messages.length > 0 && (
                <span
                  className={`text-[11px] tabular-nums mr-1 ${
                    c.id === activeChatId ? "text-white/80" : "text-muted"
                  }`}
                >
                  {c.messages.length}
                </span>
              )}
              <MoreVertical
                size={14}
                className={
                  c.id === activeChatId
                    ? "text-white/80"
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
          className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-lavender-deep transition-colors"
        >
          <Store size={16} className="text-muted" /> Agent Marketplace
        </Link>
        <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-lavender-deep transition-colors border-t border-line">
          <Globe size={16} className="text-muted" /> Language
        </button>
        <div className="flex items-center gap-2.5 px-4 py-3 border-t border-line">
          <span className="h-8 w-8 rounded-full bg-white text-primary grid place-items-center text-[11px] font-bold shrink-0">
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
