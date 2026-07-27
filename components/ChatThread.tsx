"use client";

import {
  Bot,
  Copy,
  CheckCircle2,
  XCircle,
  StopCircle,
  FileText,
  Globe,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useApp, type Message } from "@/lib/store";
import { AGENTS } from "@/lib/data";

/** minimal markdown-ish renderer: bold, italics, bullets, line breaks */
function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <span key={key}>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          p
        )
      )}
    </span>
  );
}

function MessageBody({ content }: { content: string }) {
  return (
    <div className="space-y-1.5 text-[14px] leading-relaxed">
      {content.split("\n").map((line, i) =>
        line.startsWith("- ") ? (
          <div key={i} className="flex gap-2 pl-1">
            <span className="text-primary mt-[7px] h-1 w-1 rounded-full bg-current shrink-0" />
            <span>{renderInline(line.slice(2), i)}</span>
          </div>
        ) : (
          <p key={i}>{renderInline(line, i)}</p>
        )
      )}
    </div>
  );
}

function SourceChips({ m }: { m: Message }) {
  if (!m.sources?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {m.sources.map((s, i) => {
        const inner = (
          <>
            {s.kind === "doc" ? <FileText size={12} /> : <Globe size={12} />}
            {s.label}
          </>
        );
        return s.url ? (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold bg-lavender text-primary rounded-full px-2.5 py-1 hover:bg-lavender-deep"
          >
            {inner}
          </a>
        ) : (
          <span
            key={i}
            className="flex items-center gap-1.5 text-xs font-semibold bg-lavender text-primary rounded-full px-2.5 py-1"
          >
            {inner}
          </span>
        );
      })}
    </div>
  );
}

function SuggestionChips({ m }: { m: Message }) {
  const { sendMessage } = useApp();
  if (!m.suggestions?.length || m.status !== "done") return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {m.suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => sendMessage(s)}
          className="text-xs font-semibold border border-line rounded-full px-3 py-1.5 text-muted hover:border-primary/40 hover:text-primary transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function AssistantMessage({ m, agentName }: { m: Message; agentName?: string }) {
  if (m.status === "searching") {
    return (
      <div className="bg-panel border border-line rounded-2xl px-4 py-4 max-w-[420px]">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="flex gap-1">
            <span className="dot h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-muted" />
          </span>
          {m.searchNote ?? "Searching attached files..."}
        </div>
        <div className="flex justify-end mt-3">
          <Copy size={14} className="text-muted" />
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[560px]">
      {agentName && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-7 w-7 rounded-full bg-lavender grid place-items-center">
            <Bot size={14} className="text-primary" />
          </span>
          <span className="text-sm font-bold">{agentName}</span>
          <span className="text-[10px] font-semibold bg-lavender text-primary rounded-full px-2 py-0.5">
            Chat agent
          </span>
        </div>
      )}
      <div
        className={`${
          agentName ? "border border-line rounded-2xl px-4 py-3 bg-white" : ""
        } ${m.status === "streaming" ? "stream-caret" : ""}`}
      >
        <MessageBody content={m.content} />
      </div>
      <SourceChips m={m} />
      <SuggestionChips m={m} />
      {m.status === "done" && (
        <button className="mt-2 text-muted hover:text-ink" aria-label="Copy">
          <Copy size={14} />
        </button>
      )}
    </div>
  );
}

export default function ChatThread() {
  const { chats, activeChatId, panelAgent, panelStatus, stopPanel, closePanel } =
    useApp();
  const chat = chats.find((c) => c.id === activeChatId);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  if (!chat) return null;
  const agent = AGENTS.find((a) => a.slug === chat.agentSlug);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {chat.messages.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end anim-rise">
              <div className="bg-primary text-white text-sm font-medium rounded-2xl rounded-br-md px-4 py-2.5 max-w-[440px]">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="anim-rise">
              <AssistantMessage
                m={m}
                agentName={i === 0 && agent ? agent.name : undefined}
              />
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      {panelAgent && (
        <div className="px-6 pb-2 flex items-center justify-between text-sm">
          {panelStatus === "running" ? (
            <>
              <span className="flex items-center gap-2 text-muted">
                <span className="h-3.5 w-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                Running in the agent panel...
              </span>
              <button
                onClick={stopPanel}
                className="flex items-center gap-1.5 border border-line rounded-full px-3 py-1 text-muted hover:bg-panel"
              >
                <StopCircle size={14} /> Stop
              </button>
            </>
          ) : panelStatus === "done" ? (
            <>
              <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                <CheckCircle2 size={15} /> Done
              </span>
              <button
                onClick={closePanel}
                className="border border-line rounded-full px-3 py-1 text-muted hover:bg-panel"
              >
                Close
              </button>
            </>
          ) : panelStatus === "stopped" ? (
            <span className="flex items-center gap-1.5 text-muted font-semibold">
              <XCircle size={15} /> Stopped
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
