export type AgentType = "chat" | "ui";

export type AgentBackend = "mock" | "ariva" | "n8n";

export interface AgentDef {
  slug: string;
  name: string;
  type: AgentType;
  category: string;
  description: string;
  /** Where the agent runs. Static agents are handled client-side ("mock"). */
  backend: AgentBackend;
}

/**
 * Unified shape for both static (code) and dynamic (DB / n8n) agents, as
 * returned by GET /api/agents and held in app state. `editable` agents are
 * workspace-managed n8n agents; static agents are read-only.
 */
export interface RegistryAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  type: AgentType;
  backend: AgentBackend;
  enabled: boolean;
  editable: boolean;
  webhookPath?: string;
}

/** Map the static AGENTS array into the unified registry shape. */
export function staticRegistryAgents(): RegistryAgent[] {
  return AGENTS.map((a) => ({
    id: a.slug,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    type: a.type,
    backend: a.backend,
    enabled: true,
    editable: false,
  }));
}

export interface ModelDef {
  id: string;
  label: string;
  flag: string;
}

export interface WorkspaceDef {
  id: string;
  name: string;
  initials: string;
  kind: "personal" | "org";
}

export interface FileDef {
  id: string;
  name: string;
  ext: string;
  size: string;
}

export const USER = {
  name: "Ahmed Alsugair",
  email: "aalsugair@tasama.com.sa",
  initials: "AA",
};

export const WORKSPACES: WorkspaceDef[] = [
  { id: "ws-personal", name: "Ahmed Alsugair", initials: "AA", kind: "personal" },
  { id: "ws-cps", name: "CPS", initials: "C", kind: "org" },
];

export const MODELS: ModelDef[] = [
  { id: "qwen-3-6-27b", label: "Qwen3.6 27B", flag: "🇸🇦" },
  { id: "gpt-oss-120b", label: "GPT OSS 120B", flag: "🇸🇦" },
];

export const AGENTS: AgentDef[] = [
  {
    slug: "goals-copilot",
    name: "Goals Copilot",
    type: "chat",
    category: "HR",
    description: "Turn rough objectives into clear, measurable, SMART goals.",
    backend: "mock",
  },
  {
    slug: "language-intelligence",
    name: "Language Intelligence",
    type: "ui",
    category: "Productivity",
    description:
      "Translate seamlessly between Arabic and English while preserving meaning and tone.",
    backend: "mock",
  },
  {
    slug: "meeting-intelligence",
    name: "Meeting Intelligence",
    type: "ui",
    category: "Productivity",
    description: "Turn meeting notes into clear actions, owners, and next steps.",
    backend: "mock",
  },
  {
    slug: "qr-studio",
    name: "QR Studio",
    type: "ui",
    category: "Productivity",
    description: "Generate high-quality QR codes from links or text in seconds.",
    backend: "mock",
  },
];

export const SEED_FILES: FileDef[] = [
  { id: "f1", name: "2026.07.08_D&T Offerings.pdf", ext: "pdf", size: "3.2 MB" },
];

export const DIVISIONS = [
  "D&T",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
  "Legal",
];
