"use client";

import { MessageSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useGetFeedbackOverviewQuery } from "@/redux/api/dashboardApi";
import { exportToCSV } from "@/utils/dashboardHelper";
import { formatDate } from "@/utils/date";
import DashboardFilterBar from "./DashboardFilterBar";
import TrendChart from "./TrendChart";
import {
  BarList,
  ChangeHint,
  DashboardError,
  DashboardSkeleton,
  EmptyState,
  KpiCard,
  NoSectorsState,
  Panel,
  formatNumber,
} from "./DashboardWidgets";
import { PERIOD_LABELS, type DashboardFilters } from "./useDashboardFilters";

interface Props {
  filters: DashboardFilters;
  setFilters: (changes: Partial<DashboardFilters>) => void;
}

// One colour per star level, red → green
const RATING_BAR: Record<number, string> = {
  5: "bg-green-600",
  4: "bg-lime-600",
  3: "bg-yellow-500",
  2: "bg-orange-500",
  1: "bg-red-600",
};

const percentText = (n: number | null) => (n === null ? "—" : `${n}%`);

export default function FeedbackDashboard({ filters, setFilters }: Props) {
  const { data, isLoading, isFetching, isError, refetch } = useGetFeedbackOverviewQuery({
    period: filters.period,
    sector_id: filters.sectorId,
  });

  const filterBar = (
    <DashboardFilterBar
      filters={filters}
      setFilters={setFilters}
      sectors={data?.filters.sectors ?? []}
      categories={[]}
      exportDisabled={!data || data.empty}
      onExport={() => {
        if (!data) return;
        exportToCSV(
          data.by_sector.map((s) => ({
            Sector: s.name,
            Feedback: s.total,
            "Average rating": s.avg_rating ?? "",
          })),
          `feedback_by_sector_${filters.period}.csv`,
        );
      }}
    />
  );

  if (isError) return <>{filterBar}<DashboardError onRetry={refetch} /></>;
  if (isLoading || !data) return <>{filterBar}<DashboardSkeleton cards={4} /></>;
  if (data.empty) return <>{filterBar}<NoSectorsState /></>;

  const k = data.kpis;

  return (
    <>
      {filterBar}

      <div className={`flex flex-col gap-4 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Feedback received"
            value={formatNumber(k.total)}
            hint={<ChangeHint percent={k.change_percent} isAllTime={filters.period === "all"} />}
            icon={MessageSquare}
            tone="navy"
          />
          <KpiCard
            label="Average rating"
            value={
              k.avg_rating === null ? "—" : (
                <>
                  {k.avg_rating}
                  <span className="text-base font-medium text-slate-500"> / 5</span>
                </>
              )
            }
            hint="Across all ratings in period"
            icon={Star}
            tone="gold"
          />
          <KpiCard
            label="Satisfied (4–5 ★)"
            value={percentText(k.satisfied_percent)}
            hint="Share of ratings"
            icon={ThumbsUp}
            tone="green"
          />
          <KpiCard
            label="Unsatisfied (1–2 ★)"
            value={percentText(k.unsatisfied_percent)}
            hint="Share of ratings"
            icon={ThumbsDown}
            tone="red"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Average rating over time" subtitle={PERIOD_LABELS[filters.period]} className="lg:col-span-2">
            <TrendChart
              data={data.trend}
              series={[{ key: "avg_rating", label: "Average rating", color: "#8A6A0E" }]}
              yDomain={[1, 5]}
            />
          </Panel>
          <Panel title="Rating distribution" subtitle={`${formatNumber(k.total)} ratings`}>
            <ul className="flex flex-col gap-3">
              {data.by_rating.map((r) => (
                <li key={r.rating} className="flex items-center gap-3 text-sm">
                  <span className="w-8 shrink-0 text-slate-600">{r.rating} ★</span>
                  <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${RATING_BAR[r.rating]}`}
                      style={{ width: k.total ? `${(r.count / k.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-semibold text-slate-900">{formatNumber(r.count)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Average rating by sector" subtitle="Lowest first · click a sector to filter">
            <BarList
              max={5}
              barClass="bg-golden-deep"
              items={[...data.by_sector]
                .filter((s) => s.avg_rating !== null)
                .sort((a, b) => (a.avg_rating ?? 0) - (b.avg_rating ?? 0))
                .map((s) => ({
                  key: s.sector_node_id,
                  label: `${s.name} (${formatNumber(s.total)})`,
                  value: s.avg_rating ?? 0,
                  display: `${s.avg_rating} / 5`,
                  active: s.sector_node_id === filters.sectorId,
                  onClick: () =>
                    setFilters({ sectorId: s.sector_node_id === filters.sectorId ? undefined : s.sector_node_id }),
                }))}
            />
          </Panel>
          <Panel title="Latest low ratings" subtitle="1–2 ★ feedback in period">
            {data.low_ratings.length === 0 ? (
              <EmptyState text="No low ratings in this period." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.low_ratings.map((f) => (
                  <li key={f.feedback_id} className="py-3 first:pt-0">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-slate-900">
                        {f.full_name || "Anonymous"}
                        {f.sector_name && <span className="font-normal text-slate-500"> · {f.sector_name}</span>}
                      </span>
                      <span className={`shrink-0 font-bold ${f.rating === 1 ? "text-red-600" : "text-orange-600"}`}>
                        {f.rating} ★
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{f.feedback}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(f.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
