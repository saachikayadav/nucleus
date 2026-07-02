// ─────────────────────────────────────────────────────────────────────────────
// Nucleus — Metric Info Tooltips
// Drop-in module: paste the three blocks below into your existing app file
// (or keep as a separate file and import { MetricCard, InfoTip, METRIC_INFO }).
//
// Behavior:
//   • Desktop: tooltip appears on hover over the metric card
//   • Touch:   tap toggles it (hover doesn't exist on mobile)
//   • Keyboard: card is focusable; tooltip shows on focus, hides on blur/Esc
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, ReactNode } from "react";

// ── 1. METRIC DEFINITIONS ────────────────────────────────────────────────────
// Plain-English copy. ⚠ Verify the clinical wording (especially PWAT range and
// direction) with your team before shipping — this reflects the standard
// Photographic Wound Assessment Tool, but Nucleus may use a variant.

export const METRIC_INFO: Record<string, { title: string; body: string }> = {
  pwat: {
    title: "PWAT Score",
    body:
      "Photographic Wound Assessment Tool — a validated score of wound severity " +
      "computed from the session's wound photos. It combines sub-scores for wound " +
      "edges, tissue type, surrounding skin, and healing indicators. Higher scores " +
      "indicate a more severe wound; lower scores indicate healing.",
  },
  avg_pwat: {
    title: "Avg PWAT Assigned",
    body:
      "The average PWAT score across all AI-scored sessions currently loaded. " +
      "A rising average over time can indicate a sicker patient population or " +
      "a shift in the model's scoring — worth investigating either way.",
  },
  sessions: {
    title: "AI-Scored Sessions",
    body:
      "Total number of patient sessions that the model has fully scored. Each " +
      "session is one set of wound photos submitted for assessment. Sessions " +
      "that failed validation or are still processing are not counted here.",
  },
  critical: {
    title: "Critical Detections",
    body:
      "Sessions triaged Red — the model flagged signs that need urgent clinical " +
      "review. These should be actioned first. The triage thresholds are set on " +
      "the model version shown on this dashboard.",
  },
  model_version: {
    title: "Model Version",
    body:
      "The version of the scoring model that produced the live stats on this " +
      "page. Benchmark sections marked STATIC come from the MD validation " +
      "dataset and may have been produced by an earlier version.",
  },
  triage: {
    title: "Triage Distribution",
    body:
      "How scored sessions split across the four triage levels. Red = urgent " +
      "clinical review, Orange = review soon, Yellow = monitor, Green = healing " +
      "as expected. Levels are assigned from the PWAT score plus risk flags.",
  },
  pwat_distribution: {
    title: "PWAT Score Distribution",
    body:
      "How many sessions fall into each PWAT score range. A healthy caseload " +
      "skews toward the lower buckets; growth in the upper buckets means more " +
      "severe wounds entering the system.",
  },
};

// ── 2. TOOLTIP PRIMITIVE ─────────────────────────────────────────────────────

export function InfoTip({
  info,
  children,
}: {
  info: { title: string; body: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isTouch =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none)").matches;

  // Close on tap-outside / Esc (touch + keyboard)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "block" }}
      onMouseEnter={() => !isTouch && setOpen(true)}
      onMouseLeave={() => !isTouch && setOpen(false)}
      onClick={() => isTouch && setOpen((o) => !o)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      tabIndex={0}
      aria-describedby={open ? `tip-${info.title}` : undefined}
    >
      {children}

      {open && (
        <div
          id={`tip-${info.title}`}
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            zIndex: 50,
            background: "rgba(6,12,24,0.97)",
            border: "1px solid var(--border-hi)",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            animation: "tipIn 120ms ease-out",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 4,
            }}
          >
            {info.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
              lineHeight: 1.55,
              color: "var(--text)",
            }}
          >
            {info.body}
          </div>
          {/* caret */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--border-hi)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Add once to your global CSS (or a <style> block):
//
//   @keyframes tipIn {
//     from { opacity: 0; transform: translateX(-50%) translateY(3px); }
//     to   { opacity: 1; transform: translateX(-50%) translateY(0); }
//   }
//   .metric-card { cursor: help; }
//   .metric-card .info-dot { opacity: 0; transition: opacity 120ms; }
//   .metric-card:hover .info-dot,
//   .metric-card:focus-within .info-dot { opacity: 1; }
//   @media (prefers-reduced-motion: reduce) {
//     [role="tooltip"] { animation: none !important; }
//   }

// ── 3. WRAPPED METRIC CARD ───────────────────────────────────────────────────
// Replaces your current inline metric-card markup. `infoKey` maps to
// METRIC_INFO above. Everything else passes through unchanged.

export function MetricCard({
  infoKey,
  colorClass, // e.g. "mc-cyan"
  valueClass, // e.g. "cv-cyan"
  label,
  value,
  suffix,
}: {
  infoKey: keyof typeof METRIC_INFO;
  colorClass: string;
  valueClass: string;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <InfoTip info={METRIC_INFO[infoKey]}>
      <div className={`metric-card ${colorClass}`}>
        <div
          className="metric-label"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {label}
          <span
            className="info-dot"
            aria-hidden
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "var(--text3)",
              border: "1px solid var(--border-hi)",
              borderRadius: "50%",
              width: 13,
              height: 13,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            i
          </span>
        </div>
        <div className={`metric-value ${valueClass}`}>
          {value}
          {suffix}
        </div>
      </div>
    </InfoTip>
  );
}

// ── 4. USAGE — replace your existing metrics-grid block ─────────────────────
//
// <div className="metrics-grid" style={{ marginBottom: 20 }}>
//   <MetricCard infoKey="model_version" colorClass="mc-blue"  valueClass="cv-blue"
//     label="Model Version" value="v3.1" />
//   <MetricCard infoKey="sessions" colorClass="mc-amber" valueClass="cv-amber"
//     label="AI-Scored Sessions" value={sl ? "—" : total} />
//   <MetricCard infoKey="avg_pwat" colorClass="mc-cyan" valueClass="cv-cyan"
//     label="Avg PWAT Assigned" value={sl ? "—" : Number(avg).toFixed(2)} />
//   <MetricCard infoKey="critical" colorClass="mc-red" valueClass="cv-red"
//     label="Critical Detections" value={sl ? "—" : triage.Red?.count ?? 0}
//     suffix={<span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 400 }}> Red</span>} />
// </div>
//
// For chart cards (PWAT Distribution, Triage pie), wrap just the card title:
//
// <span className="card-title">
//   <InfoTip info={METRIC_INFO.pwat_distribution}>
//     <span style={{ borderBottom: "1px dotted var(--text3)", cursor: "help" }}>
//       PWAT Score Distribution
//     </span>
//   </InfoTip>
// </span>
