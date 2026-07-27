export function TasamaWordmark({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="leading-none">
        <span
          className={`font-display font-bold text-[19px] tracking-[0.18em] ${
            light ? "text-white" : "text-primary"
          }`}
        >
          TASAMA
        </span>
        <div
          className={`text-[6px] tracking-[0.08em] mt-0.5 ${
            light ? "text-white/60" : "text-muted"
          }`}
        >
          Business Services &nbsp;·&nbsp; خدمات الأعمال
        </div>
      </div>
      <span className={`h-6 w-px ${light ? "bg-white/40" : "bg-line"}`} />
      <span
        className={`font-display font-semibold text-[17px] tracking-[0.22em] ${
          light ? "text-white" : "text-ink"
        }`}
      >
        CORE
      </span>
    </div>
  );
}

export default function TopBar() {
  return (
    <header className="h-[52px] shrink-0 bg-primary-deep px-5 flex items-center">
      <TasamaWordmark />
    </header>
  );
}
