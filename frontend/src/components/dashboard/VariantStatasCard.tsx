"use client";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer, ChartConfig } from "../ui/chart";
import React from "react";
import { Button } from "../ui/button";
import { useGetDashboardStatsQuery } from "@/redux/api/dashboardApi";
import { exportToCSV, normalizeStatus } from "@/utils/dashboardHelper";
import { formatDate, isWithinRange, type TimeRange } from "@/utils/date";

// Rating colors for feedback mode
const ratingColors: Record<number, string> = {
  1: "hsl(0, 100%, 45%)",     // Red
  2: "hsl(25, 100%, 50%)",    // Orange
  3: "hsl(45, 100%, 50%)",    // Yellow
  4: "hsl(90, 60%, 45%)",     // Light green
  5: "hsl(120, 100%, 35%)",   // Green
};

const ratingLabels: Record<number, string> = {
  1: "⭐ 1 Star",
  2: "⭐⭐ 2 Stars",
  3: "⭐⭐⭐ 3 Stars",
  4: "⭐⭐⭐⭐ 4 Stars",
  5: "⭐⭐⭐⭐⭐ 5 Stars",
};

// Tailwind only generates classes it can see in full, so the column count can't be built as `lg:grid-cols-${n}`
const LG_GRID_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

interface Props {
  dataType?: "complaint" | "feedback";
}

export default function VariantStatasCard({ dataType = "complaint" }: Props) {
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useGetDashboardStatsQuery({ type: dataType });

  const isFeedback = dataType === "feedback";

  const [timeRange, setTimeRange] = React.useState<TimeRange>("90d");
  const [selectedSectorId, setSelectedSectorId] = React.useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);

  // Reset selections when dataType changes
  React.useEffect(() => {
    setSelectedSectorId("");
    setSelectedCategoryId(null);
  }, [dataType]);

  // Set default sector when data loads
  React.useEffect(() => {
    if (dashboardData?.data?.sectors?.length > 0) {
      const firstSector = dashboardData.data.sectors[0];
      if (!selectedSectorId && firstSector) {
        setSelectedSectorId(firstSector.sector_node_id);
      }
    }
  }, [dashboardData, selectedSectorId]);

  // Map the data to stat cards
  const currentStats = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    // Get selected sector
    const selectedSector = dashboardData.data.sectors.find(
      (sector: any) => sector.sector_node_id === selectedSectorId
    );

    if (!selectedSector) return [];

    // Get items based on selected filters
    let items: any[] = [];

    if (selectedCategoryId) {
      const selectedCategory = selectedSector.complaint_categories.find(
        (cat: any) => cat.category_id === selectedCategoryId
      );
      if (selectedCategory) {
        items = selectedCategory.complaints || [];
      }
    } else {
      selectedSector.complaint_categories.forEach((category: any) => {
        if (category.complaints && category.complaints.length > 0) {
          items = [...items, ...category.complaints];
        }
      });
    }

    // Filter by time range
    const filteredItems = items.filter((item: any) =>
      isWithinRange(item.created_at, timeRange)
    );

    if (isFeedback) {
      // --- Feedback mode: group by rating ---
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      filteredItems.forEach((item: any) => {
        // status is "rating_1", "rating_2", etc. from backend
        const ratingMatch = item.status?.match(/rating_(\d)/);
        const r = ratingMatch ? parseInt(ratingMatch[1]) : 3;
        if (ratingCounts[r] !== undefined) ratingCounts[r]++;
      });

      const total = Object.values(ratingCounts).reduce((a, b) => a + b, 0) || 1;

      return Object.entries(ratingCounts)
        .map(([rating, count]) => {
          const r = parseInt(rating);
          return {
            id: `rating_${r}`,
            title: ratingLabels[r],
            value: count,
            percent: Math.round((count / total) * 100),
            change: `${count}`,
            color: ratingColors[r],
            status: r >= 4 ? "positive" : r <= 2 ? "negative" : "positive",
          };
        })
        .filter((item) => item.value > 0); // Only show ratings that have data
    } else {
      // --- Complaint mode: group by status ---
      let resolved = 0;
      let pending = 0;
      let rejected = 0;

      filteredItems.forEach((item: any) => {
        const bucket = normalizeStatus(item.status);
        if (bucket === "resolved") resolved++;
        else if (bucket === "rejected") rejected++;
        else pending++;
      });

      const total = resolved + pending + rejected || 1;

      return [
        {
          id: "1",
          title: "Resolved Complaints",
          value: resolved,
          percent: Math.round((resolved / total) * 100),
          change: "+0%",
          color: "hsl(var(--chart-2))",
          status: "positive",
        },
        {
          id: "2",
          title: "Pending Complaints",
          value: pending,
          percent: Math.round((pending / total) * 100),
          change: "+0%",
          color: "hsl(var(--chart-7))",
          status: "positive",
        },
        {
          id: "3",
          title: "Rejected Complaints",
          value: rejected,
          percent: Math.round((rejected / total) * 100),
          change: "-0%",
          color: "hsl(var(--chart-1))",
          status: "negative",
        },
      ];
    }
  }, [dashboardData, selectedSectorId, selectedCategoryId, timeRange, isFeedback]);

  const getTitleByType = () => {
    const label = isFeedback ? "Feedback" : "Complaint";
    if (!dashboardData || !selectedSectorId) return `${label} Statistics`;

    const selectedSector = dashboardData.data.sectors.find(
      (sector: any) => sector.sector_node_id === selectedSectorId
    );

    if (!selectedSector) return `${label} Statistics`;

    let title = `${selectedSector.name} ${label} Statistics`;

    if (selectedCategoryId) {
      const selectedCategory = selectedSector.complaint_categories.find(
        (cat: any) => cat.category_id === selectedCategoryId
      );
      if (selectedCategory) {
        title = `${selectedCategory.name} ${label} Statistics`;
      }
    }

    return title;
  };

  const exportData = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );
    if (!sector) return [];

    let items: any[] = [];

    if (selectedCategoryId) {
      const selectedCategory = sector.complaint_categories.find(
        (cat: any) => cat.category_id === selectedCategoryId
      );
      if (selectedCategory) {
        items = selectedCategory.complaints || [];
      }
    } else {
      sector.complaint_categories.forEach((category: any) => {
        if (category.complaints && category.complaints.length > 0) {
          items = [...items, ...category.complaints];
        }
      });
    }

    const rows: any[] = [];

    items.forEach((item: any) => {
      if (!isWithinRange(item.created_at, timeRange)) return;

      const localDate = formatDate(item.created_at);

      const category = sector.complaint_categories.find(
        (cat: any) => cat.complaints?.some((c: any) => c.complaint_id === item.complaint_id)
      );

      if (isFeedback) {
        rows.push({
          Sector: sector.name,
          Rating: category?.name || "N/A",
          "Full Name": item.ticketing_code,
          "Created Date": localDate,
        });
      } else {
        rows.push({
          Sector: sector.name,
          Category: category?.name || "N/A",
          "Ticket Code": item.ticketing_code,
          Status: normalizeStatus(item.status),
          "Created Date": localDate,
        });
      }
    });

    return rows;
  }, [dashboardData, selectedSectorId, selectedCategoryId, timeRange, isFeedback]);

  // Get categories for the selected sector
  const sectorCategories = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    return sector?.complaint_categories || [];
  }, [dashboardData, selectedSectorId]);

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Could not load statistics.</p>
            <Button
              onClick={() => refetch()}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!dashboardData?.data?.sectors?.length) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 p-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            {getTitleByType()}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() =>
                exportToCSV(
                  exportData,
                  `${getTitleByType().replace(/\s+/g, "_")}_${timeRange}.csv`
                )
              }
              disabled={!exportData.length}
              className="rounded-lg border px-4 py-2 text-sm font-medium
             hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </Button>

            {dashboardData.data.sectors.length > 1 && (
              <Select
                value={selectedSectorId}
                onValueChange={(value) => {
                  setSelectedSectorId(value);
                  setSelectedCategoryId(null);
                }}
              >
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
            )}

            {selectedSectorId && sectorCategories.length > 0 && (
              <Select
                value={selectedCategoryId || "all"}
                onValueChange={(value) => {
                  setSelectedCategoryId(value === "all" ? null : value);
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-[180px] rounded-lg bg-white"
                  aria-label={isFeedback ? "Select rating" : "Select category"}
                >
                  <SelectValue placeholder={isFeedback ? "Select rating" : "Select category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white">
                  <SelectItem value="all" className="rounded-lg">
                    {isFeedback ? "All Ratings" : "All Categories"}
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

            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger
                className="w-full sm:w-[160px] rounded-lg"
                aria-label="Select time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${LG_GRID_COLS[Math.min(currentStats.length, 5)] ?? "lg:grid-cols-3"} gap-4`}>
        {currentStats.map((item) => {
          const chartData = [
            { name: item.title, value: 100, fill: "hsl(var(--muted))" },
            { name: item.title, value: item.percent, fill: item.color },
          ];

          const chartConfig = {
            value: {
              label: item.title,
              color: item.color,
            },
          } satisfies ChartConfig;

          return (
            <React.Fragment key={item.id}>
              <div className="relative rounded-xl border border-slate-200 bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-primary">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-between">
                  {/* Text Section */}
                  <div className="flex flex-col space-y-4">
                    <div className="text-3xl text-primary font-bold tracking-tight">
                      {item.value.toLocaleString()}
                    </div>
                    {/* Share of the filtered total (period-over-period change is not computed yet) */}
                    <p className="text-sm text-slate-500">{item.percent}% of total</p>
                  </div>
                  {/* Radial Chart */}
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-square h-[90px]"
                  >
                    <RadialBarChart
                      data={chartData}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={35}
                      outerRadius={45}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                      />
                      <RadialBar
                        dataKey="value"
                        background={{ fill: "hsl(var(--muted))" }}
                        cornerRadius={10}
                        stackId="a"
                      />
                      <PolarRadiusAxis tick={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            if (!viewBox || !("cx" in viewBox)) return null;
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  className="text-sm font-bold"
                                  style={{ fill: item.color }}
                                >
                                  {item.percent}%
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}