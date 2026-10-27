"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DashboardPeriod, DashboardTab } from "@/redux/types/dashboard";

const PERIODS: DashboardPeriod[] = ["7d", "30d", "90d", "year", "all"];

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  year: "This year",
  all: "All time",
};

export interface DashboardFilters {
  tab: DashboardTab;
  period: DashboardPeriod;
  sectorId?: string;
  categoryId?: string;
}

/**
 * Dashboard filters live in the URL (?tab=&period=&sector=&category=) so every
 * widget reads the same values, and a refresh or shared link keeps the view.
 */
export function useDashboardFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const periodParam = searchParams.get("period") as DashboardPeriod | null;

  const filters: DashboardFilters = {
    tab: searchParams.get("tab") === "feedback" ? "feedback" : "complaint",
    period: periodParam && PERIODS.includes(periodParam) ? periodParam : "30d",
    sectorId: searchParams.get("sector") || undefined,
    categoryId: searchParams.get("category") || undefined,
  };

  const setFilters = useCallback(
    (changes: Partial<DashboardFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      const set = (key: string, value?: string) =>
        value ? params.set(key, value) : params.delete(key);

      if ("tab" in changes) {
        set("tab", changes.tab === "feedback" ? "feedback" : undefined);
        // Categories only apply to complaints
        if (changes.tab === "feedback") params.delete("category");
      }
      if ("period" in changes) set("period", changes.period === "30d" ? undefined : changes.period);
      if ("sectorId" in changes) set("sector", changes.sectorId);
      if ("categoryId" in changes) set("category", changes.categoryId);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { filters, setFilters };
}
