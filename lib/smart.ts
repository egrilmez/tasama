export interface CriterionResult {
  key: "S" | "M" | "A" | "R" | "T" | "KPI";
  label: string;
  status: "pass" | "fail" | "unknown";
  note: string;
}

export interface SmartAnalysis {
  goal: string;
  division: string;
  criteria: CriterionResult[];
  verdict: "ready" | "review";
  improve: string;
  rewrite: string;
}

const TIME_WORDS =
  /\b(by|before|until|within|deadline|q[1-4]|fy\d{2,4}|20\d{2}|end of|fiscal year|month|week|quarter|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

const NUMBER =
  /\d+(?:[.,]\d+)?\s*(?:%|million|billion|thousand|[mkb])?\s*(?:sar|usd)?/i;

const OUTCOME_WORDS =
  /\b(revenue|sales|cost|churn|retention|satisfaction|nps|hire|launch|deliver|reduce|increase|grow|improve|secure|achieve)\b/i;

export function analyzeGoal(goal: string, division: string): SmartAnalysis {
  const words = goal.trim().split(/\s+/).length;
  const hasNumber = NUMBER.test(goal);
  const hasTime = TIME_WORDS.test(goal);
  const hasOutcome = OUTCOME_WORDS.test(goal);
  const specific = words >= 8 && hasOutcome;

  const criteria: CriterionResult[] = [
    {
      key: "S",
      label: "Specific",
      status: specific ? "pass" : "fail",
      note: specific
        ? "the goal states a clear outcome and scope"
        : "the goal does not specify what it refers to or how it will be achieved",
    },
    {
      key: "M",
      label: "Measurable",
      status: hasNumber ? "pass" : "fail",
      note: hasNumber
        ? "the goal includes a concrete numeric target"
        : "no numeric target or success metric is included",
    },
    {
      key: "A",
      label: "Achievable",
      status: "fail",
      note: "without context it is unclear whether the target is realistic with available resources",
    },
    {
      key: "R",
      label: "Relevant",
      status: hasOutcome ? "pass" : "fail",
      note: hasOutcome
        ? "the goal supports a clear business objective"
        : "the goal does not indicate how it supports a clear business or role objective",
    },
    {
      key: "T",
      label: "Time-bound",
      status: hasTime ? "pass" : "fail",
      note: hasTime
        ? "a deadline or time frame is provided"
        : "no deadline or time frame is provided",
    },
    {
      key: "KPI",
      label: "Division KPI",
      status: "unknown",
      note: "Alignment could not be determined",
    },
  ];

  const fails = criteria.filter((c) => c.status === "fail").length;
  const verdict: SmartAnalysis["verdict"] = fails > 0 ? "review" : "ready";

  const rawTarget = goal.match(NUMBER)?.[0]?.trim();
  const target = rawTarget
    ?.replace(/(\d)\s*m\b/i, "$1 million")
    .replace(/(\d)\s*k\b/i, "$1 thousand")
    .replace(/(\d)\s*b\b/i, "$1 billion");
  const rewrite = `Secure ${
    target ? `${target}${/sar|usd|%/i.test(target) ? "" : " SAR"}` : "a measurable target"
  } in revenue from the ${division || "selected"} division by the end of the current fiscal year.`;

  return {
    goal,
    division,
    criteria,
    verdict,
    improve:
      "Add a clear, actionable deadline, clarify the scope, confirm the target is realistic and aligns with a specific business objective, and frame the goal as a measurable, time-bound outcome.",
    rewrite,
  };
}

export function analysisToMarkdown(a: SmartAnalysis): string {
  const icon = (s: CriterionResult["status"]) =>
    s === "pass" ? "✅" : s === "fail" ? "❌" : "—";
  const lines = [
    `**Your goal:** "${a.goal}" *(Division: ${a.division || "—"})*`,
    a.verdict === "review"
      ? "⚠️ **This goal needs review**"
      : "✅ **This goal is SMART-ready**",
    ...a.criteria.map(
      (c) => `${icon(c.status)} **${c.key} — ${c.label}:** ${c.note}`
    ),
    `**To improve:** ${a.improve}`,
    `**Suggested rewrite:**`,
    a.rewrite,
  ];
  return lines.join("\n");
}
