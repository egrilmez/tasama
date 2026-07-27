"use client";

import { MessageSquare, BarChart3, FolderOpen } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";

const TABS = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "kb", label: "Knowledge Base", icon: FolderOpen },
] as const;

export default function WorkspaceTabs() {
  const [active, setActive] = useState<string>("chats");
  const { workspaces, activeWorkspaceId } = useApp();
  const wsName =
    workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? "…";
  return (
    <div className="h-[54px] shrink-0 flex items-center gap-2 px-5 border-b border-line bg-white">
      <span className="text-sm font-bold mr-2 truncate max-w-[200px]">
        {wsName}
      </span>
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 transition-colors ${
            active === key
              ? "bg-white border border-line shadow-sm font-semibold"
              : "text-muted hover:bg-lavender"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
