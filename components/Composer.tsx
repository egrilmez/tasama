"use client";

import {
  Paperclip,
  SlidersHorizontal,
  HelpCircle,
  ArrowUp,
  AtSign,
  ChevronDown,
  Check,
  X,
  FileText,
  BookOpen,
  Globe,
  Sparkles,
  Bot,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MODELS } from "@/lib/data";
import { useApp } from "@/lib/store";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${
        checked ? "bg-primary" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function AgentsToolsPopover({ onClose }: { onClose: () => void }) {
  const { kbEnabled, setKbEnabled, webEnabled, setWebEnabled, runAgent, agents } =
    useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-0 w-[300px] bg-white rounded-2xl border border-line shadow-xl p-2 anim-rise z-30"
    >
      <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-panel">
        <span className="h-9 w-9 rounded-full bg-lavender grid place-items-center shrink-0">
          <BookOpen size={16} className="text-muted" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-bold">Knowledge Base</div>
          <p className="text-xs text-muted mt-0.5 leading-snug">
            {kbEnabled
              ? "Enabled: AI will search only within your attached files. Other workspace documents are not included."
              : "Disabled: AI will answer without searching your files."}
          </p>
        </div>
        <Toggle checked={kbEnabled} onChange={setKbEnabled} />
      </div>
      <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-panel border-t border-line">
        <span className="h-9 w-9 rounded-full bg-lavender grid place-items-center shrink-0">
          <Globe size={16} className="text-muted" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-bold">Quick web search</div>
          <p className="text-xs text-muted mt-0.5 leading-snug">
            Quick web search — results in a few seconds.
          </p>
        </div>
        <Toggle checked={webEnabled} onChange={setWebEnabled} />
      </div>
      <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wide text-muted uppercase">
        Agents
      </div>
      {agents
        .filter((a) => a.enabled)
        .map((a) => (
          <button
            key={a.id}
            onClick={() => {
              runAgent(a.slug);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-panel text-left"
          >
            <span className="h-9 w-9 rounded-full bg-lavender grid place-items-center shrink-0">
              {a.type === "chat" ? (
                <Bot size={16} className="text-primary" />
              ) : (
                <Sparkles size={16} className="text-primary" />
              )}
            </span>
            <div>
              <div className="text-sm font-bold">{a.name}</div>
              <div className="text-xs text-muted">
                {a.type === "chat" ? "Chat agent" : "UI agent"}
              </div>
            </div>
          </button>
        ))}
    </div>
  );
}

function ModelMenu({ onClose }: { onClose: () => void }) {
  const { modelId, setModelId } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-0 w-[200px] bg-white rounded-xl border border-line shadow-xl p-1.5 anim-rise z-30"
    >
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => {
            setModelId(m.id);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-panel text-sm font-semibold"
        >
          <span>{m.flag}</span>
          <span className="flex-1 text-left">{m.label}</span>
          {modelId === m.id && <Check size={15} className="text-primary" />}
        </button>
      ))}
    </div>
  );
}

export default function Composer({ hero = false }: { hero?: boolean }) {
  const {
    files,
    attachedFileIds,
    detachFile,
    kbEnabled,
    setKbEnabled,
    modelId,
    setAttachModalOpen,
    sendMessage,
  } = useApp();
  const [text, setText] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const model = MODELS.find((m) => m.id === modelId)!;
  const attached = files.filter((f) => attachedFileIds.includes(f.id));

  const submit = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  return (
    <div className="w-full">
      {attached.length > 0 && kbEnabled && (
        <p className="text-xs text-muted mb-1.5 px-1">
          Knowledge base is limited to your attached files for this message.
        </p>
      )}
      <div
        className={`bg-white rounded-[22px] border border-line focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/10 transition-all ${
          hero ? "shadow-lg shadow-primary/5" : "shadow-md"
        }`}
      >
        {/* input area */}
        <div className="px-5 pt-4 pb-2">
          {hero && (
            <div className="flex items-center gap-4 text-[11px] text-muted mb-1.5">
              <span className="flex items-center gap-1">
                <AtSign size={11} /> Type @ to mention a file
              </span>
              <span className="flex items-center gap-1">
                <Paperclip size={11} /> Or use the paperclip to upload a new one
              </span>
            </div>
          )}
          <textarea
            rows={hero ? 2 : 1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything..."
            className="w-full resize-none outline-none text-[15px] placeholder:text-muted py-1"
          />
          {attached.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {attached.map((f) => (
                <span
                  key={f.id}
                  className="flex items-center gap-1.5 bg-lavender text-primary text-xs font-semibold rounded-lg px-2.5 py-1.5"
                >
                  <FileText size={13} />
                  {f.name.length > 18 ? f.name.slice(0, 16) + "…" : f.name}
                  <button onClick={() => detachFile(f.id)} aria-label="Remove file">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* options toolbar — beneath the text input */}
        <div className="flex items-center gap-1.5 border-t border-line px-3.5 py-2.5">
          <button
            onClick={() => setAttachModalOpen(true)}
            className="h-9 w-9 grid place-items-center rounded-xl text-muted hover:bg-lavender hover:text-primary transition-colors"
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setToolsOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-[13px] font-semibold rounded-xl px-3 py-2 transition-colors ${
                toolsOpen
                  ? "bg-lavender text-primary"
                  : "text-muted hover:bg-lavender hover:text-primary"
              }`}
            >
              <SlidersHorizontal size={14} /> Agents &amp; Tools
            </button>
            {toolsOpen && <AgentsToolsPopover onClose={() => setToolsOpen(false)} />}
          </div>
          <div className="relative">
            <button
              onClick={() => setModelOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-[13px] font-semibold rounded-xl px-3 py-2 transition-colors ${
                modelOpen
                  ? "bg-lavender text-primary"
                  : "text-muted hover:bg-lavender hover:text-primary"
              }`}
            >
              {model.flag} {model.label} <ChevronDown size={13} />
            </button>
            {modelOpen && <ModelMenu onClose={() => setModelOpen(false)} />}
          </div>
          {attached.length > 0 && kbEnabled && (
            <span className="flex items-center gap-1.5 bg-lavender text-primary text-xs font-semibold rounded-xl px-3 py-2">
              <BookOpen size={13} /> Knowledge Base
              <button onClick={() => setKbEnabled(false)} aria-label="Disable knowledge base">
                <X size={12} />
              </button>
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              className="h-9 w-9 grid place-items-center rounded-xl text-muted hover:bg-lavender hover:text-primary transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={16} />
            </button>
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="h-10 w-10 rounded-full grad-primary text-white grid place-items-center hover:opacity-90 transition-all disabled:opacity-35 shadow-md shadow-primary/25"
              aria-label="Send"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
