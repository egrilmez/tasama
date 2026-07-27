"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import WorkspaceTabs from "@/components/WorkspaceTabs";
import Composer from "@/components/Composer";
import ChatThread from "@/components/ChatThread";
import AgentPanel from "@/components/AgentPanel";
import AttachModal from "@/components/AttachModal";
import WorkspaceModal from "@/components/WorkspaceModal";
import DashboardView from "@/components/DashboardView";
import KnowledgeBaseView from "@/components/KnowledgeBaseView";
import { AppProvider, useApp } from "@/lib/store";

function AgentCards() {
  const { runAgent, agents } = useApp();
  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      {agents
        .filter((a) => a.enabled)
        .map((a, i) => (
          <button
            key={a.id}
            onClick={() => runAgent(a.slug)}
            className="group text-left flex items-start gap-3 bg-white border border-line rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all anim-rise"
            style={{ animationDelay: `${220 + i * 70}ms` }}
          >
            <span className="h-9 w-9 rounded-xl bg-lavender grid place-items-center shrink-0 group-hover:grad-primary transition-all">
              {a.type === "chat" ? (
                <Bot
                  size={16}
                  className="text-primary group-hover:text-white transition-colors"
                />
              ) : (
                <Sparkles
                  size={16}
                  className="text-primary group-hover:text-white transition-colors"
                />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{a.name}</span>
              <span className="block text-xs text-muted mt-0.5 leading-snug">
                {a.description}
              </span>
            </span>
          </button>
        ))}
    </div>
  );
}

function ChatHome() {
  const { user } = useApp();
  const firstName = user?.name.split(" ")[0];
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-8 pt-14 pb-10">
        <div className="text-center">
          <p className="text-[12px] font-bold text-primary tracking-[0.18em] uppercase anim-rise">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </p>
          <h1
            className="font-display font-bold text-[36px] mt-1.5 mb-8 anim-rise"
            style={{ animationDelay: "60ms" }}
          >
            Ready when{" "}
            <span className="text-transparent bg-clip-text grad-primary">
              you are.
            </span>
          </h1>
        </div>
        <div className="anim-rise" style={{ animationDelay: "120ms" }}>
          <Composer hero />
        </div>
        <AgentCards />
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
  const { activeChatId, activeTab, runAgent, ready, agents } = useApp();
  const launchedAgentParam = useRef(false);
  useEffect(() => {
    if (!ready || launchedAgentParam.current) return;
    const slug = new URLSearchParams(window.location.search).get("agent");
    if (!slug) {
      launchedAgentParam.current = true;
      return;
    }
    // Wait until the agent appears in the (async-loaded) registry so that
    // marketplace deep-links to n8n agents resolve, not just static ones.
    if (!agents.some((a) => a.slug === slug)) return;
    launchedAgentParam.current = true;
    runAgent(slug);
    window.history.replaceState({}, "", "/");
  }, [ready, agents, runAgent]);
  return (
    <div className="h-screen flex gap-3 p-3 bg-canvas">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col panel-card overflow-hidden">
        <WorkspaceTabs />
        {activeTab === "dashboard" ? (
          <DashboardView />
        ) : activeTab === "kb" ? (
          <KnowledgeBaseView />
        ) : activeChatId ? (
          <ActiveChat />
        ) : (
          <ChatHome />
        )}
      </main>
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
