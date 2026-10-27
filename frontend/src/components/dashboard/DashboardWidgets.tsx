"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString();

/* ---------------- KPI card ---------------- */

const TONES = {
  navy: { icon: "bg-primary/10 text-primary", border: "border-slate-200", value: "text-slate-900" },
  amber: { icon: "bg-amber-100 text-amber-700", border: "border-slate-200", value: "text-slate-900" },
  red: { icon: "bg-red-100 text-red-700", border: "border-red-200", value: "text-red-700" },
  green: { icon: "bg-green-100 text-green-700", border: "border-slate-200", value: "text-green-700" },
  gold: { icon: "bg-golden-dark/10 text-golden-deep", border: "border-slate-200", value: "text-slate-900" },
} as const;

export type Tone = keyof typeof TONES;

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ElementType;
  tone?: Tone;
}

export const KpiCard = ({ label, value, hint, icon: Icon, tone = "navy" }: KpiCardProps) => (
  <div className={`flex flex-col gap-2.5 rounded-xl border bg-white p-5 shadow-sm ${TONES[tone].border}`}>
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone].icon}`}>
        <Icon className="h-[1.125rem] w-[1.125rem]" />
      </span>
    </div>
    <span className={`text-3xl font-bold tracking-tight ${TONES[tone].value}`}>{value}</span>
    {hint && <span className="text-xs text-slate-500">{hint}</span>}
  </div>
);

/** "+5% vs previous period" with a neutral arrow (more complaints isn't automatically bad) */
export const ChangeHint = ({ percent, isAllTime }: { percent: number | null; isAllTime: boolean }) => {
  if (isAllTime) return <>Since records began</>;
  if (percent === null) return <>No data for the previous period</>;
  const Icon = percent > 0 ? ArrowUpRight : percent < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5" />
      {percent > 0 ? "+" : ""}
      {percent}% vs previous period
    </span>
  );
};

/* ---------------- Panel ---------------- */

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Panel = ({ title, subtitle, action, className = "", children }: PanelProps) => (
  <section className={`flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="mt-4 flex-1">{children}</div>
  </section>
);

export const EmptyState = ({ text = "No data for this period." }: { text?: string }) => (
  <p className="py-8 text-center text-sm text-slate-500">{text}</p>
);

/* ---------------- Horizontal bar list ---------------- */

interface BarListItem {
  key: string;
  label: string;
  value: number;
  display?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BarListProps {
  items: BarListItem[];
  /** Tailwind background class for the bar */
  barClass: string;
  /** Scale bars against this instead of the largest value (e.g. 5 for ratings) */
  max?: number;
}

export const BarList = ({ items, barClass, max }: BarListProps) => {
  if (items.length === 0) return <EmptyState />;
  const top = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={`truncate ${item.active ? "font-semibold text-primary" : "text-slate-700"}`}>
                {item.label}
              </span>
              <span className="shrink-0 font-semibold text-slate-900">{item.display ?? formatNumber(item.value)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barClass}`}
                style={{ width: `${Math.max((item.value / top) * 100, item.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={item.key}>
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
};

/* ---------------- Status split ---------------- */

interface Segment {
  label: string;
  value: number;
  dotClass: string;
}

export const StatusSplit = ({ segments, total }: { segments: Segment[]; total: number }) => {
  if (total === 0) return <EmptyState />;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div>
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${pct(s.value)}%`).join(", ")}
      >
        {segments.map((s) => (
          <span key={s.label} className={`h-full ${s.dotClass}`} style={{ width: `${pct(s.value)}%` }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dotClass}`} />
            {s.label}
            <span className="ml-auto font-semibold text-slate-900">{formatNumber(s.value)}</span>
            <span className="w-11 text-right text-slate-400">{pct(s.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Loading / error ---------------- */

export const DashboardSkeleton = ({ cards }: { cards: number }) => (
  <div className="flex flex-col gap-4" aria-busy="true">
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cards === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="h-[8.5rem] animate-pulse rounded-xl border border-slate-200 bg-white p-5">
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-5 h-8 w-20 rounded bg-slate-100" />
          <div className="mt-4 h-3 w-32 rounded bg-slate-50" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-2" />
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  </div>
);

export const DashboardError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <p className="text-sm text-slate-600">Could not load the dashboard.</p>
    <Button onClick={onRetry} className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium">
      Retry
    </Button>
  </div>
);
