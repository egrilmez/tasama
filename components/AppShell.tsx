"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect } from "react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import WorkspaceTabs from "@/components/WorkspaceTabs";
import Composer from "@/components/Composer";
import ChatThread from "@/components/ChatThread";
import AgentPanel from "@/components/AgentPanel";
import AttachModal from "@/components/AttachModal";
import WorkspaceModal from "@/components/WorkspaceModal";
import { AGENTS } from "@/lib/data";
import { AppProvider, useApp } from "@/lib/store";

function AgentChips() {
  const { runAgent } = useApp();
  return (
    <div className="mt-6">
      <div className="text-center text-[11px] font-bold tracking-widest text-muted uppercase mb-2.5">
        Agents
      </div>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {AGENTS.map((a) => (
          <button
            key={a.slug}
            onClick={() => runAgent(a.slug)}
            className="flex items-center gap-1.5 border border-line bg-white rounded-full px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:shadow-sm transition-all"
          >
            {a.type === "chat" ? (
              <Bot size={14} className="text-primary" />
            ) : (
              <Sparkles size={14} className="text-primary" />
            )}
            {a.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatHome() {
  return (
    <div className="flex-1 grid place-items-center px-8">
      <div className="w-full max-w-[680px] -mt-16">
        <h1 className="font-display font-bold text-[32px] text-center mb-7 anim-rise">
          Ready when you are.
        </h1>
        <div className="anim-rise" style={{ animationDelay: "80ms" }}>
          <Composer hero />
        </div>
        <div className="anim-rise" style={{ animationDelay: "160ms" }}>
          <AgentChips />
        </div>
      </div>
    </div>
  );
}

function ActiveChat() {
  const { panelAgent } = useApp();
  return (
    <div className="flex-1 min-h-0 flex">
      <div
        className={`flex flex-col min-h-0 ${
          panelAgent ? "w-[420px] shrink-0" : "flex-1"
        }`}
      >
        <ChatThread />
        <div
          className={`px-6 pb-5 ${
            panelAgent ? "" : "max-w-[760px] w-full mx-auto"
          }`}
        >
          <Composer />
        </div>
      </div>
      <AgentPanel />
    </div>
  );
}

function Shell() {
  const { activeChatId, runAgent, ready } = useApp();
  useEffect(() => {
    if (!ready) return;
    const slug = new URLSearchParams(window.location.search).get("agent");
    if (slug) {
      runAgent(slug);
      window.history.replaceState({}, "", "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 min-h-0 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col bg-white">
          <WorkspaceTabs />
          {activeChatId ? <ActiveChat /> : <ChatHome />}
        </main>
      </div>
      <AttachModal />
      <WorkspaceModal />
    </div>
  );
}

export default function AppShell() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
