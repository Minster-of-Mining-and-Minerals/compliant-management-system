"use client";

import { AlertTriangle, Clock, Inbox, Star, Timer } from "lucide-react";
import { useGetComplaintOverviewQuery, useGetFeedbackOverviewQuery } from "@/redux/api/dashboardApi";
import { exportToCSV } from "@/utils/dashboardHelper";
import DashboardFilterBar from "./DashboardFilterBar";
import NeedsAttention from "./NeedsAttention";
import TrendChart from "./TrendChart";
import {
  BarList,
  ChangeHint,
  DashboardError,
  DashboardSkeleton,
  KpiCard,
  Panel,
  StatusSplit,
  formatNumber,
} from "./DashboardWidgets";
import { PERIOD_LABELS, type DashboardFilters } from "./useDashboardFilters";

interface Props {
  filters: DashboardFilters;
  setFilters: (changes: Partial<DashboardFilters>) => void;
}

export default function ComplaintDashboard({ filters, setFilters }: Props) {
  const query = {
    period: filters.period,
    sector_id: filters.sectorId,
    category_id: filters.categoryId,
  };
  const { data, isLoading, isFetching, isError, refetch } = useGetComplaintOverviewQuery(query);
  // Satisfaction card comes from feedback for the same sector and period
  const { data: feedback } = useGetFeedbackOverviewQuery({ period: filters.period, sector_id: filters.sectorId });

  const filterBar = (
    <DashboardFilterBar
      filters={filters}
      setFilters={setFilters}
      sectors={data?.filters.sectors ?? []}
      categories={data?.filters.categories ?? []}
      exportDisabled={!data || data.empty}
      onExport={() => {
        if (!data) return;
        exportToCSV(
          data.by_sector.map((s) => ({
            Sector: s.name,
            Received: s.total,
            Open: s.open,
            Resolved: s.resolved,
          })),
          `complaints_by_sector_${filters.period}.csv`,
        );
      }}
    />
  );

  if (isError) return <>{filterBar}<DashboardError onRetry={refetch} /></>;
  if (isLoading || !data) return <>{filterBar}<DashboardSkeleton cards={5} /></>;

  const k = data.kpis;
  const isAllTime = filters.period === "all";
  const pct = (n: number) => (k.total > 0 ? Math.round((n / k.total) * 100) : 0);

  const sectorItems = [...data.by_sector]
    .sort((a, b) => b.open - a.open)
    .map((s) => ({
      key: s.sector_node_id,
      label: s.name,
      value: s.open,
      active: s.sector_node_id === filters.sectorId,
      // Click a sector to filter the whole page to it (click again to clear)
      onClick: () => setFilters({ sectorId: s.sector_node_id === filters.sectorId ? undefined : s.sector_node_id }),
    }));

  return (
    <>
      {filterBar}

      <div className={`flex flex-col gap-4 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Received"
            value={formatNumber(k.total)}
            hint={<ChangeHint percent={k.change_percent} isAllTime={isAllTime} />}
            icon={Inbox}
            tone="navy"
          />
          <KpiCard label="Open" value={formatNumber(k.open)} hint={`${pct(k.open)}% of received`} icon={Clock} tone="amber" />
          <KpiCard
            label="Overdue"
            value={formatNumber(k.overdue)}
            hint={`Open more than ${k.overdue_after_days} days`}
            icon={AlertTriangle}
            tone="red"
          />
          <KpiCard
            label="Avg. days to resolve"
            value={k.avg_resolution_days === null ? "—" : k.avg_resolution_days}
            hint={k.avg_resolution_days === null ? "No resolutions in this period" : "Submission → first resolution"}
            icon={Timer}
            tone="green"
          />
          <KpiCard
            label="Satisfaction"
            value={
              feedback?.kpis.avg_rating == null ? "—" : (
                <>
                  {feedback.kpis.avg_rating}
                  <span className="text-base font-medium text-slate-500"> / 5</span>
                </>
              )
            }
            hint={feedback ? `From ${formatNumber(feedback.kpis.total)} feedback` : undefined}
            icon={Star}
            tone="gold"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Received vs resolved"
            subtitle={`${PERIOD_LABELS[filters.period]} · a widening gap means the backlog is growing`}
            className="lg:col-span-2"
          >
            <TrendChart
              data={data.trend}
              series={[
                { key: "received", label: "Received", color: "#073A55" },
                { key: "resolved", label: "Resolved", color: "#16A34A" },
              ]}
            />
          </Panel>
          <NeedsAttention sectorId={filters.sectorId} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Sectors — open complaints" subtitle="Most open first · click a sector to filter">
            <BarList items={sectorItems} barClass="bg-amber-400" />
          </Panel>
          <Panel title="Status of complaints" subtitle={`${formatNumber(k.total)} received in period`}>
            <StatusSplit
              total={k.total}
              segments={[
                { label: "Open", value: k.open, dotClass: "bg-amber-400" },
                { label: "Resolved", value: k.resolved, dotClass: "bg-green-500" },
                { label: "Rejected", value: k.rejected, dotClass: "bg-red-500" },
              ]}
            />
          </Panel>
          <Panel title="Top categories" subtitle="Complaints received in period">
            <BarList
              items={data.by_category.map((c) => ({
                key: c.category_id,
                label: c.name,
                value: c.total,
                active: c.category_id === filters.categoryId,
                onClick: () =>
                  setFilters({ categoryId: c.category_id === filters.categoryId ? undefined : c.category_id }),
              }))}
              barClass="bg-primary"
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
