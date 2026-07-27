"use client";

import {
  Sparkles,
  Maximize2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Download,
  QrCode,
  Languages,
  ListChecks,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import QRCode from "qrcode";
import { AGENTS, DIVISIONS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { arivaStream } from "@/lib/ariva-client";
import type { CriterionResult } from "@/lib/smart";

/* ---------- shared frame ---------- */

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-[20px] tracking-[0.14em] text-primary">
          TASAMA <span className="text-ink font-semibold">Core</span>
        </span>
        <button className="flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Review a spreadsheet
        </button>
      </div>
      <div className="h-[3px] bg-primary rounded-full mt-3 mb-8" />
      <h1 className="font-display font-bold text-[28px] leading-tight">{title}</h1>
      <p className="text-[15px] text-muted mt-2 leading-relaxed">{subtitle}</p>
    </>
  );
}

function PoweredBy() {
  return (
    <div className="text-center text-xs text-muted pb-5 flex items-center justify-center gap-1.5">
      Powered by{" "}
      <span className="font-display font-bold tracking-[0.14em] text-ink">
        TASAMA
      </span>
    </div>
  );
}

/* ---------- Goals Copilot ---------- */

function CriterionRow({ c, index }: { c: CriterionResult; index: number }) {
  const mark =
    c.status === "pass" ? (
      <span className="text-green-600 font-bold">✓</span>
    ) : c.status === "fail" ? (
      <span className="text-red-500 font-bold">✕</span>
    ) : (
      <span className="text-muted font-bold">–</span>
    );
  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 border-b border-line last:border-0 anim-rise"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span className="h-9 w-9 rounded-lg bg-lavender text-primary grid place-items-center text-xs font-bold shrink-0">
        {c.key}
      </span>
      {mark}
      <div className="leading-tight">
        <div className="text-sm font-bold">{c.label}</div>
        <div className="text-[13px] text-muted">{c.note}</div>
      </div>
    </div>
  );
}

function GoalsBody() {
  const { panelAnalysis, panelStatus, submitGoal } = useApp();
  const [division, setDivision] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="px-8 pt-7 pb-6 max-w-[720px] mx-auto">
      <PanelHeader
        title="Goals Intelligence Agent"
        subtitle="Pick a division, write a goal, and I'll check it against the five SMART criteria, whether it aligns with that division's KPIs, and offer a sharper rewrite."
      />

      {!panelAnalysis && panelStatus !== "stopped" && (
        <div className="mt-14 text-center anim-rise">
          <h2 className="font-display font-bold text-[26px]">
            What goal are you working on?
          </h2>
          <p className="text-muted mt-3 max-w-[440px] mx-auto text-[15px]">
            I&apos;ll check it against the five SMART criteria, see whether it
            aligns with your division&apos;s KPIs, and suggest a sharper rewrite.
          </p>
          <div className="mt-8 flex items-center gap-3 bg-white rounded-2xl border border-line shadow-lg shadow-primary/5 p-3 max-w-[560px] mx-auto">
            <div className="relative">
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="appearance-none border border-line rounded-lg pl-3 pr-8 py-2.5 text-sm font-semibold outline-none bg-white"
              >
                <option value="">Division...</option>
                {DIVISIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
            </div>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && goal.trim())
                  submitGoal(division, goal.trim());
              }}
              placeholder="Type your goal here..."
              className="flex-1 border-2 border-primary/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => goal.trim() && submitGoal(division, goal.trim())}
              className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center hover:bg-primary-deep transition-colors shrink-0"
              aria-label="Analyze goal"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {panelAnalysis && (
        <div className="mt-8">
          <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm">
            {panelAnalysis.criteria.map((c, i) => (
              <CriterionRow key={c.key} c={c} index={i} />
            ))}
          </div>

          <div className="mt-5 anim-rise" style={{ animationDelay: "560ms" }}>
            <div className="bg-amber-bg text-amber-ink font-bold text-[15px] rounded-t-xl px-5 py-3">
              {panelAnalysis.verdict === "review"
                ? "This goal needs review"
                : "This goal is SMART-ready"}
            </div>
            <div className="border border-t-0 border-line rounded-b-xl px-5 py-4 text-[14px] leading-relaxed">
              <strong className="text-amber-ink">To improve:</strong>{" "}
              {panelAnalysis.improve}
            </div>
          </div>

          <div
            className="mt-5 bg-hl/60 rounded-xl overflow-hidden anim-rise"
            style={{ animationDelay: "700ms" }}
          >
            <div className="px-5 pt-4 text-[11px] font-bold tracking-widest text-primary uppercase">
              Suggested rewrite
            </div>
            <p className="px-5 py-3 text-[15px] font-medium">
              <mark className="bg-hl px-0.5">{panelAnalysis.rewrite}</mark>
            </p>
            <div className="h-2.5 bg-primary/70" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- QR Studio ---------- */

function QrBody() {
  const { completePanel } = useApp();
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const generate = async () => {
    if (!text.trim()) return;
    const url = await QRCode.toDataURL(text.trim(), {
      width: 320,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });
    setDataUrl(url);
    completePanel();
  };

  return (
    <div className="px-8 pt-7 pb-6 max-w-[720px] mx-auto">
      <PanelHeader
        title="QR Studio"
        subtitle="Generate high-quality QR codes from links or text in seconds."
      />
      <div className="mt-10 max-w-[560px] mx-auto anim-rise">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-line shadow-lg shadow-primary/5 p-3">
          <QrCode size={18} className="text-primary ml-1 shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Paste a link or type any text..."
            className="flex-1 border-2 border-primary/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={generate}
            className="h-10 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors shrink-0"
          >
            Generate
          </button>
        </div>

        {dataUrl && (
          <div className="mt-8 text-center anim-rise">
            <div className="inline-block bg-white border border-line rounded-2xl shadow-sm p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt="Generated QR code" width={256} height={256} />
            </div>
            <div>
              <a
                href={dataUrl}
                download="qr-code.png"
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:text-primary-deep"
              >
                <Download size={15} /> Download PNG
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Meeting Intelligence ---------- */

interface ActionRow {
  action: string;
  owner: string;
  due: string;
}

const DUE_RE =
  /\b(by |before |until )?(today|tomorrow|next week|next month|monday|tuesday|wednesday|thursday|friday|q[1-4]|end of \w+|\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/i;

function extractActions(notes: string): ActionRow[] {
  return notes
    .split(/\n|(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .map((s) => {
      const ownerMatch =
        s.match(/^@?([A-Z][a-z]+)\b(?=\s+(?:will|to|should|takes|owns))/) ??
        s.match(/^([A-Z][a-z]+):/);
      const dueMatch = s.match(DUE_RE);
      return {
        action: s.replace(/^([A-Z][a-z]+):\s*/, ""),
        owner: ownerMatch?.[1] ?? "—",
        due: dueMatch ? dueMatch[0].replace(/^(by|before|until)\s+/i, "") : "—",
      };
    });
}

function MeetingBody() {
  const { completePanel } = useApp();
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ActionRow[] | null>(null);

  return (
    <div className="px-8 pt-7 pb-6 max-w-[720px] mx-auto">
      <PanelHeader
        title="Meeting Intelligence"
        subtitle="Turn meeting notes into clear actions, owners, and next steps."
      />
      <div className="mt-8 anim-rise">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder={
            "Paste your meeting notes...\ne.g. Sara will send the budget draft by Friday. Omar to book the venue."
          }
          className="w-full bg-white border border-line rounded-2xl p-4 text-sm outline-none focus:border-primary/60 shadow-sm resize-y"
        />
        <button
          onClick={() => {
            if (!notes.trim()) return;
            setRows(extractActions(notes));
            completePanel();
          }}
          className="mt-3 h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors inline-flex items-center gap-2"
        >
          <ListChecks size={15} /> Extract actions
        </button>

        {rows && (
          <div className="mt-6 bg-white border border-line rounded-2xl overflow-hidden shadow-sm anim-rise">
            <div className="grid grid-cols-[1fr_120px_130px] text-[11px] font-bold tracking-wide uppercase text-muted bg-panel px-4 py-2.5 border-b border-line">
              <span>Action</span>
              <span>Owner</span>
              <span>Due</span>
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px_130px] items-center text-sm px-4 py-3 border-b border-line last:border-0 anim-rise"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="pr-3">{r.action}</span>
                <span className="font-semibold">{r.owner}</span>
                <span className="text-muted">{r.due}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Language Intelligence ---------- */

function LanguageBody() {
  const { completePanel, activeWorkspaceId } = useApp();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const translate = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    setNotice(null);
    setOutput("");
    const prompt = `Translate the following between Arabic and English (detect the source language; translate to the other one), preserving meaning and tone. Reply with the translation only.\n\n${input.trim()}`;
    const res = await arivaStream(prompt, setOutput, activeWorkspaceId ?? undefined);
    if (!res.ok) {
      setNotice(
        "Live translation runs through ARIVA. Add ARIVA_ASSISTANT_ID and ARIVA_API_KEY to .env.local to enable it."
      );
    } else {
      completePanel();
    }
    setBusy(false);
  };

  return (
    <div className="px-8 pt-7 pb-6 max-w-[720px] mx-auto">
      <PanelHeader
        title="Language Intelligence"
        subtitle="Translate seamlessly between Arabic and English while preserving meaning and tone."
      />
      <div className="mt-8 grid grid-cols-2 gap-4 anim-rise">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="Type or paste text in Arabic or English..."
          className="bg-white border border-line rounded-2xl p-4 text-sm outline-none focus:border-primary/60 shadow-sm resize-y"
        />
        <div
          dir="auto"
          className="bg-panel border border-line rounded-2xl p-4 text-sm whitespace-pre-wrap overflow-y-auto min-h-[120px]"
        >
          {output || (
            <span className="text-muted">Translation appears here…</span>
          )}
        </div>
      </div>
      <button
        onClick={translate}
        disabled={busy}
        className="mt-4 h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors inline-flex items-center gap-2 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Languages size={15} />
        )}
        Translate
      </button>
      {notice && (
        <p className="mt-4 text-[13px] bg-amber-bg text-amber-ink rounded-xl px-4 py-3">
          {notice}
        </p>
      )}
    </div>
  );
}

/* ---------- panel shell ---------- */

const BODIES: Record<string, () => React.ReactElement> = {
  "goals-copilot": GoalsBody,
  "qr-studio": QrBody,
  "meeting-intelligence": MeetingBody,
  "language-intelligence": LanguageBody,
};

export default function AgentPanel() {
  const { panelAgent } = useApp();
  if (!panelAgent) return null;
  const agent = AGENTS.find((a) => a.slug === panelAgent);
  const Body = BODIES[panelAgent];
  if (!agent || !Body) return null;

  return (
    <section className="flex-1 min-w-0 border-l border-line bg-panel flex flex-col">
      <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-line bg-white">
        <Sparkles size={15} className="text-primary" />
        <span className="text-sm font-bold">{agent.name}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-green-600 border border-green-200 bg-green-50 rounded-full px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-ping" />
          Live
        </span>
        <button className="text-muted hover:text-ink ml-1" aria-label="Expand">
          <Maximize2 size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Body />
        <PoweredBy />
      </div>
    </section>
  );
}
