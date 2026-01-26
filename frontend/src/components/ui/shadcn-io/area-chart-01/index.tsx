"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../select";
import { Card } from "../../card";
import { exportToCSV } from "../../../../utils/dashboardHelper";
import { useGetDashboardStatsQuery } from "@/redux/api/dashboardApi";
import { Button } from "../../button";

// Helper functions
export const normalizeStatus = (status: string) => {
  if (status === "resolved" || status === "closed") return "resolved";
  if (status === "rejected") return "rejected";
  return "pending"; // pending, under_review, assigned, in_progress
};

// Helper to format date for grouping with timezone correction
const getDayKey = (dateString: string) => {
  const date = new Date(dateString);
  // Use local date to avoid timezone issues
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getMonthKey = (dateString: string) => {
  const date = new Date(dateString);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`;
};

const getWeekKey = (dateString: string) => {
  const date = new Date(dateString);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const year = localDate.getFullYear();

  // Get week number
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (localDate.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

// Helper to determine optimal grouping based on date range
const determineOptimalGrouping = (dates: string[]): "day" | "week" | "month" => {
  if (dates.length === 0) return "month";

  const dateObjects = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const oldest = dateObjects[0];
  const newest = dateObjects[dateObjects.length - 1];

  const diffDays = (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 30) return "day";
  if (diffDays <= 90) return "week";
  return "month";
};

// Helper to fill missing dates in the dataset
const fillMissingDates = (
  data: { date: string; pending: number; resolved: number; rejected: number }[],
  grouping: "day" | "week" | "month"
): { date: string; pending: number; resolved: number; rejected: number }[] => {
  if (data.length === 0) return [];

  const result = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const filledData = [];

  const startDate = new Date(result[0].date);
  const endDate = new Date(result[result.length - 1].date);

  let current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

    let key: string;
    switch (grouping) {
      case "day":
        key = getDayKey(dateStr);
        break;
      case "week":
        key = getWeekKey(dateStr);
        // Move to next week
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        key = monthStr;
        // Move to next month
        current.setMonth(current.getMonth() + 1);
        break;
    }

    // Find existing data for this period
    const existing = result.find(item => {
      if (grouping === "day") return getDayKey(item.date) === key;
      if (grouping === "week") return getWeekKey(item.date) === key;
      return getMonthKey(item.date) === key;
    });

    if (existing) {
      filledData.push(existing);
    } else {
      // Fill with zeros for missing periods
      filledData.push({
        date: grouping === "month" ? `${key}-01` : dateStr,
        pending: 0,
        resolved: 0,
        rejected: 0
      });
    }

    // Increment for day grouping
    if (grouping === "day") {
      current.setDate(current.getDate() + 1);
    }
  }

  return filledData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/* =========================
   CHART CONFIG
   ========================= */
const chartConfig = {
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-7))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-1))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

/* =========================
   COMPONENT
   ========================= */
export function ChartAreaInteractive() {
  const { data: dashboardData, isLoading, isError } = useGetDashboardStatsQuery();

  const [selectedSectorId, setSelectedSectorId] = React.useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [groupBy, setGroupBy] = React.useState<"day" | "week" | "month">("month");

  // Set default sector when data loads
  React.useEffect(() => {
    if (dashboardData?.data?.sectors?.length > 0) {
      const firstSector = dashboardData.data.sectors[0];
      if (!selectedSectorId && firstSector) {
        setSelectedSectorId(firstSector.sector_node_id);
      }
    }
  }, [dashboardData, selectedSectorId]);

  // Get categories for the selected sector
  const sectorCategories = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    return sector?.complaint_categories || [];
  }, [dashboardData, selectedSectorId]);

  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    // Get selected sector
    const selectedSector = dashboardData.data.sectors.find(
      (sector: any) => sector.sector_node_id === selectedSectorId
    );

    if (!selectedSector) return [];

    // Collect all complaints based on filters
    let allComplaints: any[] = [];
    const allDates: string[] = [];

    if (selectedCategoryId) {
      // Get complaints from specific category
      const selectedCategory = selectedSector.complaint_categories.find(
        (cat: any) => cat.category_id === selectedCategoryId
      );
      if (selectedCategory) {
        const complaints = selectedCategory.complaints || [];
        complaints.forEach((complaint: any) => {
          allComplaints.push({
            ...complaint,
            normalizedStatus: normalizeStatus(complaint.status),
            category_name: selectedCategory.name
          });
          allDates.push(complaint.created_at);
        });
      }
    } else {
      // Get all complaints from all categories in the sector
      selectedSector.complaint_categories.forEach((category: any) => {
        const complaints = category.complaints || [];
        complaints.forEach((complaint: any) => {
          allComplaints.push({
            ...complaint,
            normalizedStatus: normalizeStatus(complaint.status),
            category_name: category.name
          });
          allDates.push(complaint.created_at);
        });
      });
    }

    // Determine optimal grouping based on date range
    let optimalGrouping = determineOptimalGrouping(allDates);

    // Override with user selection if they've changed it
    const effectiveGrouping = groupBy || optimalGrouping;

    // Group complaints by date
    const groupedData: Record<string, { pending: number; resolved: number; rejected: number; date: string }> = {};

    allComplaints.forEach((complaint) => {
      let key: string;
      let displayDate: string;

      switch (effectiveGrouping) {
        case "day":
          key = getDayKey(complaint.created_at);
          displayDate = getDayKey(complaint.created_at);
          break;
        case "week":
          key = getWeekKey(complaint.created_at);
          // Use Monday of the week as display date
          const date = new Date(complaint.created_at);
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          const monday = new Date(date.setDate(diff));
          displayDate = getDayKey(monday.toISOString());
          break;
        default: // month
          key = getMonthKey(complaint.created_at);
          displayDate = `${key}-01`;
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          pending: 0,
          resolved: 0,
          rejected: 0,
          date: displayDate
        };
      }

      if (complaint.normalizedStatus === "pending") {
        groupedData[key].pending++;
      } else if (complaint.normalizedStatus === "resolved") {
        groupedData[key].resolved++;
      } else if (complaint.normalizedStatus === "rejected") {
        groupedData[key].rejected++;
      }
    });

    // Convert to array and sort by date
    let result = Object.values(groupedData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fill missing dates to ensure smooth chart
    result = fillMissingDates(result, effectiveGrouping);

    return result;
  }, [dashboardData, selectedSectorId, selectedCategoryId, groupBy]);

  // Auto-adjust grouping based on data span
  React.useEffect(() => {
    if (chartData.length > 0 && !groupBy) {
      const dates = chartData.map(item => item.date);
      const optimalGrouping = determineOptimalGrouping(dates);
      setGroupBy(optimalGrouping);
    }
  }, [chartData, groupBy]);

  const formatXAxisTick = (value: string) => {
    const date = new Date(value);

    switch (groupBy) {
      case "day":
        return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
      case "week":
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        const startDay = date.getDate();
        const endDay = weekEnd.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        return `${startDay}-${endDay} ${month}`;
      default: // month
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const formatTooltipLabel = (value: string) => {
    const date = new Date(value);

    switch (groupBy) {
      case "day":
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case "week":
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        return `Week of ${date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric'
        })} - ${weekEnd.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`;
      default: // month
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const exportData = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId || chartData.length === 0) {
      return [];
    }

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    if (!sector) return [];

    const categoryNames = selectedCategoryId
      ? sectorCategories.find((cat: any) => cat.category_id === selectedCategoryId)?.name
      : "All Categories";

    return chartData.map((item) => ({
      Sector: sector.name,
      Category: categoryNames,
      Period: item.date,
      Pending: item.pending,
      Resolved: item.resolved,
      Rejected: item.rejected,
    }));
  }, [dashboardData, selectedSectorId, selectedCategoryId, chartData, sectorCategories]);

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading chart data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">Error loading chart data</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!dashboardData?.data?.sectors?.length) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col justify-start items-start 3xl:flex-row gap-4 pb-4 mb-4">
        <div className="grid flex-1 gap-1">
          <h3 className="text-lg font-semibold">
            Complaints Trend Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Pending, resolved, and rejected complaints by sector and category
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              exportToCSV(
                exportData,
                `complaints_trend_${selectedSectorId}_${groupBy}.csv`
              )
            }
            disabled={!exportData.length}
            className="rounded-lg border px-4 py-2 text-sm font-medium
             hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </Button>

          {/* Sector Filter */}
          <Select value={selectedSectorId} onValueChange={(value) => {
            setSelectedSectorId(value);
            setSelectedCategoryId(null);
            setGroupBy(null); // Reset grouping when sector changes
          }}>
            <SelectTrigger
              className="w-full sm:w-[180px] rounded-lg bg-white"
              aria-label="Select sector"
            >
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white">
              {dashboardData.data.sectors.map((sector: any) => (
                <SelectItem
                  key={sector.sector_node_id}
                  value={sector.sector_node_id}
                  className="rounded-lg"
                >
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {selectedSectorId && sectorCategories.length > 0 && (
            <Select
              value={selectedCategoryId || "all"}
              onValueChange={(value) => {
                setSelectedCategoryId(value === "all" ? null : value);
                setGroupBy(null); // Reset grouping when category changes
              }}
            >
              <SelectTrigger
                className="w-full sm:w-[180px] rounded-lg bg-white"
                aria-label="Select category"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value="all" className="rounded-lg">
                  All Categories
                </SelectItem>
                {sectorCategories.map((category: any) => (
                  <SelectItem
                    key={category.category_id}
                    value={category.category_id}
                    className="rounded-lg"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Group By Filter */}
          <Select value={groupBy || "auto"} onValueChange={(value: "day" | "week" | "month" | "auto") => {
            setGroupBy(value === "auto" ? null : value);
          }}>
            <SelectTrigger
              className="w-full sm:w-[140px] rounded-lg bg-white"
              aria-label="Group by"
            >
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white">
              <SelectItem value="auto" className="rounded-lg">Auto</SelectItem>
              <SelectItem value="day" className="rounded-lg">Daily</SelectItem>
              <SelectItem value="week" className="rounded-lg">Weekly</SelectItem>
              <SelectItem value="month" className="rounded-lg">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fill-pending" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-pending)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-pending)"
                    stopOpacity={0.1}
                  />
                </linearGradient>

                <linearGradient id="fill-resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-resolved)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-resolved)"
                    stopOpacity={0.1}
                  />
                </linearGradient>

                <linearGradient id="fill-rejected" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-rejected)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-rejected)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={groupBy === "day" ? 32 : groupBy === "week" ? 24 : 8}
                tickFormatter={formatXAxisTick}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatTooltipLabel}
                    indicator="dot"
                  />
                }
              />

              <Area
                dataKey="pending"
                type="natural"
                fill="url(#fill-pending)"
                stroke="var(--color-pending)"
                stackId="a"
              />
              <Area
                dataKey="resolved"
                type="natural"
                fill="url(#fill-resolved)"
                stroke="var(--color-resolved)"
                stackId="a"
              />
              <Area
                dataKey="rejected"
                type="natural"
                fill="url(#fill-rejected)"
                stroke="var(--color-rejected)"
                stackId="a"
              />

              <ChartLegend
                content={(props) => (
                  <ChartLegendContent
                    payload={props.payload}
                    verticalAlign={props.verticalAlign}
                  />
                )}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-64 w-full">
            <p className="text-sm text-muted-foreground">
              No data available for the selected filters
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}