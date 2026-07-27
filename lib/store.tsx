"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AGENTS, MODELS, SEED_FILES, type FileDef } from "./data";
import { analyzeGoal, analysisToMarkdown, type SmartAnalysis } from "./smart";

export interface SourceRef {
  kind: "doc" | "web" | "page";
  label: string;
  url?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentSlug?: string;
  status?: "searching" | "streaming" | "done";
  searchNote?: string;
  sources?: SourceRef[];
  suggestions?: string[];
}

export interface Chat {
  id: string;
  title: string;
  agentSlug?: string;
  messages: Message[];
  arivaConversationId?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  kind: "personal" | "org";
  hasAriva: boolean;
  isOwner: boolean;
}

export type PanelStatus = "idle" | "running" | "done" | "stopped";

export type WorkspaceTab = "chats" | "dashboard" | "kb";

interface AppState {
  ready: boolean;
  user: UserInfo | null;
  workspaces: WorkspaceInfo[];
  activeWorkspaceId: string | null;
  activeTab: WorkspaceTab;
  setActiveTab: (t: WorkspaceTab) => void;
  chats: Chat[];
  activeChatId: string | null;
  files: FileDef[];
  attachedFileIds: string[];
  modelId: string;
  kbEnabled: boolean;
  webEnabled: boolean;
  attachModalOpen: boolean;
  workspaceModalOpen: boolean;
  panelAgent: string | null;
  panelStatus: PanelStatus;
  panelAnalysis: SmartAnalysis | null;

  setModelId: (id: string) => void;
  setKbEnabled: (v: boolean) => void;
  setWebEnabled: (v: boolean) => void;
  setAttachModalOpen: (v: boolean) => void;
  setWorkspaceModalOpen: (v: boolean) => void;
  selectWorkspace: (id: string) => void;
  addWorkspace: (ws: WorkspaceInfo) => void;
  signOut: () => void;
  attachFile: (id: string) => void;
  detachFile: (id: string) => void;
  uploadFiles: (files: File[]) => void;
  newChat: () => void;
  selectChat: (id: string) => void;
  sendMessage: (text: string) => void;
  runAgent: (slug: string) => void;
  submitGoal: (division: string, goal: string) => void;
  stopPanel: () => void;
  closePanel: () => void;
  completePanel: () => void;
}

const Ctx = createContext<AppState | null>(null);

let seq = 0;
const uid = () => `id-${++seq}-${Date.now().toString(36)}`;

const DEFAULT_CHATS: Chat[] = [
  { id: "chat-goals", title: "Goals Copilot", agentSlug: "goals-copilot", messages: [] },
];

const KB_REPLY = `TASAMA's Digital & Technology (D&T) division offers enterprise digital transformation services, including:

- **AI workspaces & copilots** — secure, locally hosted assistants grounded in your organization's knowledge.
- **Data platforms** — governed data lakes, analytics dashboards, and KPI reporting.
- **Custom application delivery** — web and mobile products built with modern cloud architecture.
- **Integration services** — connecting ERP, HR, and finance systems through managed APIs.

These offerings are described in the attached *D&T Offerings* document.`;

const GENERIC_REPLY = `Happy to help. I can answer questions from your workspace knowledge base, search the web when enabled, or run one of the agents below — try **Goals Copilot** to shape a SMART goal, or attach a file and ask me about it.`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chats");

  const [chats, setChats] = useState<Chat[]>(DEFAULT_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileDef[]>(SEED_FILES);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [kbEnabled, setKbEnabled] = useState(true);
  const [webEnabled, setWebEnabled] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [panelAgent, setPanelAgent] = useState<string | null>(null);
  const [panelStatus, setPanelStatus] = useState<PanelStatus>("idle");
  const [panelAnalysis, setPanelAnalysis] = useState<SmartAnalysis | null>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- identity ---- */
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) {
          window.location.href = "/login";
          return;
        }
        setUser(json.user);
        setWorkspaces(json.workspaces);
        setActiveWorkspaceId(json.workspaces[0]?.id ?? null);
      })
      .catch(() => {});
  }, []);

  /* ---- per-user, per-workspace localStorage persistence ---- */
  const storageKey =
    user && activeWorkspaceId
      ? `tasama-core-v2:${user.id}:${activeWorkspaceId}`
      : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const ready = loadedKey !== null && loadedKey === storageKey;

  useEffect(() => {
    if (!storageKey || storageKey === loadedKey) return;
    // reset to defaults, then overlay whatever is stored for this identity
    let s: Partial<{
      chats: Chat[];
      activeChatId: string | null;
      files: FileDef[];
      attachedFileIds: string[];
      modelId: string;
      kbEnabled: boolean;
      webEnabled: boolean;
    }> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) s = JSON.parse(raw);
    } catch {
      // corrupt state — start fresh
    }
    // Legitimate hydration from localStorage during initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setChats(
      Array.isArray(s.chats)
        ? s.chats.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.status && m.status !== "done" ? { ...m, status: "done" as const } : m
            ),
          }))
        : DEFAULT_CHATS
    );
    setActiveChatId(s.activeChatId ?? null);
    setFiles(Array.isArray(s.files) ? s.files : SEED_FILES);
    setAttachedFileIds(Array.isArray(s.attachedFileIds) ? s.attachedFileIds : []);
    setModelId(s.modelId ?? MODELS[0].id);
    setKbEnabled(s.kbEnabled ?? true);
    setWebEnabled(s.webEnabled ?? false);
    setPanelAgent(null);
    setPanelStatus("idle");
    setPanelAnalysis(null);
    setLoadedKey(storageKey);
  }, [storageKey, loadedKey]);

  useEffect(() => {
    if (!storageKey || storageKey !== loadedKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          chats,
          activeChatId,
          files,
          attachedFileIds,
          modelId,
          kbEnabled,
          webEnabled,
        })
      );
    } catch {
      // storage full/unavailable — persistence is best-effort
    }
  }, [
    storageKey,
    loadedKey,
    chats,
    activeChatId,
    files,
    attachedFileIds,
    modelId,
    kbEnabled,
    webEnabled,
  ]);

  /* ---- helpers ---- */

  const patchMessage = useCallback(
    (chatId: string, msgId: string, patch: Partial<Message>) => {
      setChats((cs) =>
        cs.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, ...patch } : m
                ),
              }
            : c
        )
      );
    },
    []
  );

  const streamInto = useCallback(
    (chatId: string, msgId: string, full: string, onDone?: () => void) => {
      const words = full.split(" ");
      let i = 0;
      if (streamTimer.current) clearInterval(streamTimer.current);
      streamTimer.current = setInterval(() => {
        i = Math.min(i + 3, words.length);
        patchMessage(chatId, msgId, {
          content: words.slice(0, i).join(" "),
          status: i < words.length ? "streaming" : "done",
        });
        if (i >= words.length) {
          if (streamTimer.current) clearInterval(streamTimer.current);
          onDone?.();
        }
      }, 60);
    },
    [patchMessage]
  );

  /** Stream a reply from the ARIVA backend proxy. Returns false if unavailable. */
  const tryAriva = useCallback(
    async (
      chatId: string,
      msgId: string,
      message: string,
      conversationId?: string
    ): Promise<boolean> => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId,
            workspaceId: activeWorkspaceId ?? undefined,
          }),
        });
        if (!res.ok || !res.body) return false;

        const ctype = res.headers.get("content-type") ?? "";
        if (!ctype.includes("text/event-stream")) {
          const json = await res.json();
          if (json.handoff) {
            patchMessage(chatId, msgId, {
              content:
                "_Your message was recorded — a human agent will respond shortly._",
              status: "done",
            });
            return true;
          }
          if (json.reply) {
            patchMessage(chatId, msgId, {
              content: json.reply,
              status: "done",
              sources: json.sources,
              suggestions: json.suggestions,
            });
            if (json.conversationId)
              setChats((cs) =>
                cs.map((c) =>
                  c.id === chatId
                    ? { ...c, arivaConversationId: json.conversationId }
                    : c
                )
              );
            return true;
          }
          return false;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        patchMessage(chatId, msgId, { status: "streaming" });
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            let evt: {
              type?: string;
              text?: string;
              conversationId?: string;
              sources?: SourceRef[];
              suggestions?: string[];
            };
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }
            if (evt.type === "delta" && evt.text) {
              acc += evt.text;
              patchMessage(chatId, msgId, { content: acc, status: "streaming" });
            } else if (evt.type === "done") {
              patchMessage(chatId, msgId, {
                status: "done",
                sources: evt.sources,
                suggestions: evt.suggestions,
              });
              if (evt.conversationId) {
                const convId = evt.conversationId;
                setChats((cs) =>
                  cs.map((c) =>
                    c.id === chatId ? { ...c, arivaConversationId: convId } : c
                  )
                );
              }
            }
          }
        }
        patchMessage(chatId, msgId, { status: "done" });
        return acc.length > 0;
      } catch {
        return false;
      }
    },
    [patchMessage, activeWorkspaceId]
  );

  const ensureChat = useCallback(
    (agentSlug?: string): string => {
      if (activeChatId) return activeChatId;
      const id = uid();
      const agent = AGENTS.find((a) => a.slug === agentSlug);
      setChats((cs) => [
        { id, title: agent ? agent.name : "New Chat", agentSlug, messages: [] },
        ...cs,
      ]);
      setActiveChatId(id);
      return id;
    },
    [activeChatId]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const chatId = ensureChat();
      const userMsg: Message = { id: uid(), role: "user", content: text };
      const asstMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "",
        status: attachedFileIds.length && kbEnabled ? "searching" : "streaming",
        searchNote:
          attachedFileIds.length && kbEnabled
            ? `Searching attached files... (${attachedFileIds.length * 4}): D&T Offerings`
            : undefined,
      };
      setChats((cs) =>
        cs.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, userMsg, asstMsg] }
            : c
        )
      );
      const chat = chats.find((c) => c.id === chatId);
      const isGoals = chat?.agentSlug === "goals-copilot";

      const reply = isGoals
        ? analysisToMarkdown(analyzeGoal(text, panelAnalysis?.division ?? "D&T"))
        : attachedFileIds.length && kbEnabled
          ? KB_REPLY
          : GENERIC_REPLY;

      const startMock = () => streamInto(chatId, asstMsg.id, reply);
      const start = () => {
        if (isGoals) {
          startMock();
          return;
        }
        // Real backend first (ARIVA RAG); mock demo reply if unconfigured.
        void tryAriva(chatId, asstMsg.id, text, chat?.arivaConversationId).then(
          (ok) => {
            if (!ok) startMock();
          }
        );
      };
      if (asstMsg.status === "searching") {
        setTimeout(() => {
          patchMessage(chatId, asstMsg.id, { status: "streaming" });
          start();
        }, 1600);
      } else {
        start();
      }
      if (isGoals) {
        setPanelAgent("goals-copilot");
        setPanelStatus("running");
        setTimeout(() => {
          setPanelAnalysis(analyzeGoal(text, panelAnalysis?.division ?? "D&T"));
          setPanelStatus("done");
        }, 1800);
      }
    },
    [
      ensureChat,
      attachedFileIds,
      kbEnabled,
      chats,
      panelAnalysis,
      patchMessage,
      streamInto,
      tryAriva,
    ]
  );

  const runAgent = useCallback((slug: string) => {
    const agent = AGENTS.find((a) => a.slug === slug);
    if (!agent) return;
    const id = uid();
    const intro: Message = {
      id: uid(),
      role: "assistant",
      content: agent.description,
      agentSlug: slug,
      status: "done",
    };
    setChats((cs) => [
      { id, title: agent.name, agentSlug: slug, messages: [intro] },
      ...cs,
    ]);
    setActiveChatId(id);
    setPanelAgent(slug);
    setPanelStatus("running");
    setPanelAnalysis(null);
  }, []);

  const submitGoal = useCallback(
    (division: string, goal: string) => {
      const chatId = ensureChat("goals-copilot");
      const analysis = analyzeGoal(goal, division);
      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: `${goal} (Division: ${division})`,
      };
      const asstMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "",
        status: "streaming",
      };
      setChats((cs) =>
        cs.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, userMsg, asstMsg] }
            : c
        )
      );
      setPanelStatus("running");
      streamInto(chatId, asstMsg.id, analysisToMarkdown(analysis), () => {
        setPanelStatus("done");
      });
      setTimeout(() => setPanelAnalysis(analysis), 900);
    },
    [ensureChat, streamInto]
  );

  const uploadFiles = useCallback((fs: File[]) => {
    const defs: FileDef[] = fs.slice(0, 5).map((f) => ({
      id: uid(),
      name: f.name,
      ext: f.name.split(".").pop() ?? "file",
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
    }));
    setFiles((prev) => [...prev, ...defs]);
    setAttachedFileIds((prev) => [...prev, ...defs.map((d) => d.id)]);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      user,
      workspaces,
      activeWorkspaceId,
      activeTab,
      setActiveTab,
      chats,
      activeChatId,
      files,
      attachedFileIds,
      modelId,
      kbEnabled,
      webEnabled,
      attachModalOpen,
      workspaceModalOpen,
      panelAgent,
      panelStatus,
      panelAnalysis,
      setModelId,
      setKbEnabled,
      setWebEnabled,
      setAttachModalOpen,
      setWorkspaceModalOpen,
      selectWorkspace: (id) => setActiveWorkspaceId(id),
      addWorkspace: (ws) => {
        setWorkspaces((prev) => [...prev, ws]);
        setActiveWorkspaceId(ws.id);
      },
      signOut: () => {
        void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          window.location.href = "/login";
        });
      },
      attachFile: (id) =>
        setAttachedFileIds((p) => (p.includes(id) ? p : [...p, id])),
      detachFile: (id) => setAttachedFileIds((p) => p.filter((x) => x !== id)),
      uploadFiles,
      newChat: () => {
        setActiveChatId(null);
        setPanelAgent(null);
        setPanelStatus("idle");
        setPanelAnalysis(null);
      },
      selectChat: (id) => {
        setActiveChatId(id);
        const c = chats.find((x) => x.id === id);
        if (c?.agentSlug) {
          setPanelAgent(c.agentSlug);
          setPanelStatus(c.messages.length > 1 ? "done" : "running");
        } else {
          setPanelAgent(null);
          setPanelStatus("idle");
        }
      },
      sendMessage,
      runAgent,
      submitGoal,
      stopPanel: () => setPanelStatus("stopped"),
      closePanel: () => {
        setPanelAgent(null);
        setPanelStatus("idle");
      },
      completePanel: () => setPanelStatus("done"),
    }),
    [
      ready,
      user,
      workspaces,
      activeWorkspaceId,
      activeTab,
      chats,
      activeChatId,
      files,
      attachedFileIds,
      modelId,
      kbEnabled,
      webEnabled,
      attachModalOpen,
      workspaceModalOpen,
      panelAgent,
      panelStatus,
      panelAnalysis,
      sendMessage,
      runAgent,
      submitGoal,
      uploadFiles,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
