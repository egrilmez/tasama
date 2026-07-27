"use client";

import {
  MessageSquare,
  MessagesSquare,
  FileText,
  Sparkles,
  Bot,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { AGENTS } from "@/lib/data";

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <div
      className="bg-white border border-line rounded-2xl p-5 shadow-sm anim-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="h-10 w-10 rounded-xl bg-lavender grid place-items-center">
        <Icon size={18} className="text-primary" />
      </span>
      <div className="font-display font-bold text-[30px] mt-3 tabular-nums">
        {value}
      </div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export default function DashboardView() {
  const { chats, files, workspaces, activeWorkspaceId } = useApp();
  const wsName =
    workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? "workspace";

  const totalMessages = chats.reduce((n, c) => n + c.messages.length, 0);
  const agentChats = chats.filter((c) => c.agentSlug);
  const agentUsage = AGENTS.map((a) => ({
    agent: a,
    count: chats.filter((c) => c.agentSlug === a.slug).length,
  }));
  const byChat = chats
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => b.messages.length - a.messages.length)
    .slice(0, 6);
  const maxMsgs = Math.max(1, ...byChat.map((c) => c.messages.length));

  return (
    <div className="flex-1 overflow-y-auto bg-panel">
      <div className="max-w-[960px] mx-auto px-8 py-8">
        <h1 className="font-display font-bold text-[26px]">Dashboard</h1>
        <p className="text-muted mt-1">
          Activity across the {wsName} workspace.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard icon={MessageSquare} label="Chats" value={chats.length} delay={0} />
          <StatCard icon={MessagesSquare} label="Messages" value={totalMessages} delay={70} />
          <StatCard icon={FileText} label="Files" value={files.length} delay={140} />
          <StatCard icon={Sparkles} label="Agent sessions" value={agentChats.length} delay={210} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <div
            className="bg-white border border-line rounded-2xl p-5 shadow-sm anim-rise"
            style={{ animationDelay: "280ms" }}
          >
            <div className="text-sm font-bold mb-4">Messages per chat</div>
            {byChat.length === 0 ? (
              <p className="text-sm text-muted">No conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {byChat.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="truncate font-semibold">{c.title}</span>
                      <span className="text-muted tabular-nums ml-2">
                        {c.messages.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-lavender overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(c.messages.length / maxMsgs) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="bg-white border border-line rounded-2xl p-5 shadow-sm anim-rise"
            style={{ animationDelay: "350ms" }}
          >
            <div className="text-sm font-bold mb-4">Agent usage</div>
            <div className="space-y-3">
              {agentUsage.map(({ agent, count }) => (
                <div key={agent.slug} className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-lavender grid place-items-center shrink-0">
                    {agent.type === "chat" ? (
                      <Bot size={14} className="text-primary" />
                    ) : (
                      <Sparkles size={14} className="text-primary" />
                    )}
                  </span>
                  <span className="text-sm font-semibold flex-1 truncate">
                    {agent.name}
                  </span>
                  <span
                    className={`text-xs font-bold rounded-full px-2.5 py-1 tabular-nums ${
                      count > 0
                        ? "bg-lavender text-primary"
                        : "bg-panel text-muted border border-line"
                    }`}
                  >
                    {count} {count === 1 ? "session" : "sessions"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
