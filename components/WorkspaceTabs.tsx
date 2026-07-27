"use client";

import { MessageSquare, BarChart3, FolderOpen } from "lucide-react";
import { useApp, type WorkspaceTab } from "@/lib/store";

const TABS: { key: WorkspaceTab; label: string; icon: typeof MessageSquare }[] = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "kb", label: "Knowledge Base", icon: FolderOpen },
];

export default function WorkspaceTabs() {
  const { workspaces, activeWorkspaceId, activeTab, setActiveTab } = useApp();
  const wsName =
    workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? "…";
  return (
    <div className="h-[58px] shrink-0 flex items-center px-6 border-b border-line bg-white">
      <span className="font-display font-semibold text-[15px] truncate max-w-[220px]">
        {wsName}
      </span>
      <div className="ml-auto flex items-center gap-1 bg-panel border border-line rounded-2xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 text-[13px] rounded-xl px-3.5 py-1.5 transition-all ${
              activeTab === key
                ? "bg-white text-primary font-bold shadow-sm border border-line"
                : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
