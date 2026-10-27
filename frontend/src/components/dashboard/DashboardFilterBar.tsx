"use client";

import { Download, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { DashboardPeriod } from "@/redux/types/dashboard";
import { PERIOD_LABELS, type DashboardFilters } from "./useDashboardFilters";

const ALL = "all";

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  setFilters: (changes: Partial<DashboardFilters>) => void;
  sectors: Array<{ sector_node_id: string; name: string }>;
  categories: Array<{ category_id: string; name: string }>;
  onExport: () => void;
  exportDisabled?: boolean;
}

const fieldLabel = "text-xs font-semibold text-slate-600";
const trigger = "h-10 w-full rounded-lg bg-white";

export default function DashboardFilterBar({
  filters,
  setFilters,
  sectors,
  categories,
  onExport,
  exportDisabled,
}: DashboardFilterBarProps) {
  const showSector = sectors.length > 1;
  const showCategory = filters.tab === "complaint" && categories.length > 0;
  const hasFilters = !!filters.sectorId || !!filters.categoryId || filters.period !== "30d";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {showSector && (
          <div className="flex flex-col gap-1">
            <label htmlFor="dash-sector" className={fieldLabel}>Sector</label>
            <Select
              value={filters.sectorId ?? ALL}
              onValueChange={(v) => setFilters({ sectorId: v === ALL ? undefined : v })}
            >
              <SelectTrigger id="dash-sector" className={trigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value={ALL}>All sectors</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s.sector_node_id} value={s.sector_node_id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showCategory && (
          <div className="flex flex-col gap-1">
            <label htmlFor="dash-category" className={fieldLabel}>Category</label>
            <Select
              value={filters.categoryId ?? ALL}
              onValueChange={(v) => setFilters({ categoryId: v === ALL ? undefined : v })}
            >
              <SelectTrigger id="dash-category" className={trigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.category_id} value={c.category_id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="dash-period" className={fieldLabel}>Period</label>
          <Select value={filters.period} onValueChange={(v) => setFilters({ period: v as DashboardPeriod })}>
            <SelectTrigger id="dash-period" className={trigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white">
              {(Object.keys(PERIOD_LABELS) as DashboardPeriod[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setFilters({ sectorId: undefined, categoryId: undefined, period: "30d" })}
            className="h-10 rounded-lg px-3 text-sm text-slate-600"
          >
            <X className="mr-1 h-4 w-4" />
            Reset
          </Button>
        )}
        <Button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="h-10 flex-1 rounded-lg border border-primary bg-white px-4 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50 lg:flex-none"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
