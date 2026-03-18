"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, ArrowUpRight, ArrowRight } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
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
import { Button } from "../../button";
import { useGetDashboardStatsQuery } from "@/redux/api/dashboardApi";

/* =========================
   CHART CONFIG WITH ALL STATUS COLORS
   ========================= */
const chartConfig = {
  complaints: {
    label: "Complaints",
  },
  pending: {
    label: "Pending",
    color: "hsl(45, 100%, 50%)", // Yellow/Orange
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    color: "hsl(210, 70%, 60%)", // Light Blue
    icon: AlertCircle,
  },
  assigned: {
    label: "Assigned",
    color: "hsl(220, 100%, 65%)", // Blue
    icon: CheckCircle,
  },
  in_progress: {
    label: "In Progress",
    color: "hsl(210, 100%, 50%)", // Blue
    icon: RefreshCw,
  },
  rejected: {
    label: "Rejected",
    color: "hsl(0, 100%, 45%)", // Red
    icon: XCircle,
  },
  closed: {
    label: "Closed",
    color: "hsl(0, 0%, 60%)", // Gray
    icon: CheckCircle,
  },
  resolved: {
    label: "Resolved",
    color: "hsl(120, 100%, 35%)", // Green
    icon: CheckCircle,
  },
} satisfies ChartConfig;


// Helper to get status display name
const getStatusDisplayName = (status: string): string => {
  // Feedback rating statuses
  const ratingMap: Record<string, string> = {
    rating_1: "⭐ 1 Star",
    rating_2: "⭐⭐ 2 Stars",
    rating_3: "⭐⭐⭐ 3 Stars",
    rating_4: "⭐⭐⭐⭐ 4 Stars",
    rating_5: "⭐⭐⭐⭐⭐ 5 Stars",
  };
  if (ratingMap[status]) return ratingMap[status];

  const statusMap: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    assigned: "Assigned",
    in_progress: "In Progress",
    rejected: "Rejected",
    closed: "Closed",
    resolved: "Resolved",
  };
  return statusMap[status] || status;
};

/* =========================
   COMPONENT
   ========================= */
export function ChartBarMixed({ dataType = "complaint" }: { dataType?: "complaint" | "feedback" }) {
  const { data: dashboardData, isLoading, isError } = useGetDashboardStatsQuery({ type: dataType });

  const [selectedSectorId, setSelectedSectorId] = React.useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);

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

    if (selectedCategoryId) {
      // Get complaints from specific category
      const selectedCategory = selectedSector.complaint_categories.find(
        (cat: any) => cat.category_id === selectedCategoryId
      );
      if (selectedCategory) {
        allComplaints = selectedCategory.complaints || [];
      }
    } else {
      // Get all complaints from all categories in the sector
      selectedSector.complaint_categories.forEach((category: any) => {
        const complaints = category.complaints || [];
        allComplaints = [...allComplaints, ...complaints];
      });
    }

    // Count complaints by status
    const statusCounts: Record<string, number> = {
      pending: 0,
      under_review: 0,
      assigned: 0,
      in_progress: 0,
      rejected: 0,
      closed: 0,
      resolved: 0,
    };

    allComplaints.forEach((complaint: any) => {
      const status = complaint.status.toLowerCase();
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else {
        // If status is not in our predefined list, add it
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });

    // Convert to chart data format
    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0) // Only include statuses with data
      .map(([status, complaints]) => ({
        status,
        complaints,
        displayName: getStatusDisplayName(status),
      }))
      .sort((a, b) => b.complaints - a.complaints); // Sort by complaint count descending
  }, [dashboardData, selectedSectorId, selectedCategoryId]);

  // Calculate trend based on status distribution
  const getTrend = React.useMemo(() => {
    if (chartData.length === 0) {
      return {
        icon: Minus,
        text: "No Complaints found",
        description: "No complaints for selected filters"
      };
    }

    const totalComplaints = chartData.reduce((sum, item) => sum + item.complaints, 0);

    // Count active complaints (pending, under_review, assigned, in_progress)
    const activeComplaints = chartData
      .filter(item => ['pending', 'under_review', 'assigned', 'in_progress'].includes(item.status))
      .reduce((sum, item) => sum + item.complaints, 0);

    // Count completed complaints (resolved, closed)
    const completedComplaints = chartData
      .filter(item => ['resolved', 'closed'].includes(item.status))
      .reduce((sum, item) => sum + item.complaints, 0);

    const activeRatio = activeComplaints / totalComplaints;
    const completionRatio = completedComplaints / totalComplaints;

    if (completionRatio > 0.7) {
      return {
        icon: CheckCircle,
        text: "High resolution rate",
        description: "Most complaints are resolved or closed"
      };
    } else if (activeRatio > 0.6) {
      return {
        icon: AlertCircle,
        text: "Many active complaints",
        description: "High number of pending or in-progress complaints"
      };
    } else if (chartData.find(item => item.status === 'rejected')?.complaints || 0 > totalComplaints * 0.3) {
      return {
        icon: XCircle,
        text: "High rejection rate",
        description: "Many complaints were rejected"
      };
    } else if (completionRatio > 0.4) {
      return {
        icon: TrendingUp,
        text: "Good progress",
        description: "Making steady progress on complaint resolution"
      };
    } else {
      return {
        icon: Minus,
        text: "Needs attention",
        description: "Requires focus on complaint resolution"
      };
    }
  }, [chartData]);

  // Get color for each bar based on status
  const getBarFill = (status: string) => {
    // Rating colors for feedback mode
    const ratingColors: Record<string, string> = {
      rating_1: "hsl(0, 100%, 45%)",
      rating_2: "hsl(25, 100%, 50%)",
      rating_3: "hsl(45, 100%, 50%)",
      rating_4: "hsl(90, 60%, 45%)",
      rating_5: "hsl(120, 100%, 35%)",
    };
    if (ratingColors[status]) return ratingColors[status];

    const statusConfig = chartConfig[status as keyof typeof chartConfig];
    return (statusConfig as any)?.color || "var(--color-medium)";
  };

  // Get icon for each status
  const getStatusIcon = (status: string) => {
    const statusConfig = chartConfig[status as keyof typeof chartConfig];
    const IconComponent = (statusConfig as any)?.icon || AlertCircle;
    return <IconComponent className="h-3 w-3" />;
  };

  const exportData = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId || chartData.length === 0) {
      return [];
    }

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    if (!sector) return [];

    const categoryName = selectedCategoryId
      ? sectorCategories.find((cat: any) => cat.category_id === selectedCategoryId)?.name
      : "All Categories";

    return chartData.map((item) => ({
      Sector: sector.name,
      Category: categoryName || "All Categories",
      Status: item.displayName,
      Complaints: item.complaints,
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
            <p className="text-sm text-gray-500 mb-2">No data available</p>

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
          <h3 className="text-lg font-semibold">{dataType === "feedback" ? "Feedbacks by Rating" : "Complaints by Status"}</h3>
          <p className="text-sm text-muted-foreground">
            {dataType === "feedback"
              ? "Distribution of feedbacks by rating"
              : "Distribution of complaints by current status"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              exportToCSV(
                exportData,
                `complaints_by_status_${selectedSectorId}.csv`
              )
            }
            disabled={!exportData.length}
            className="rounded-lg border px-4 py-2 text-sm font-medium
             hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </Button>

          {/* Sector Filter */}
          {dashboardData.data.sectors.length > 1 && (
            <Select value={selectedSectorId} onValueChange={(value) => {
              setSelectedSectorId(value);
              setSelectedCategoryId(null);
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
          )}

          {/* Category Filter */}
          {selectedSectorId && sectorCategories.length > 0 && (
            <Select
              value={selectedCategoryId || "all"}
              onValueChange={(value) => {
                setSelectedCategoryId(value === "all" ? null : value);
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
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <YAxis
                dataKey="displayName"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={120}
                tickFormatter={(value) => value}
              />
              <XAxis
                dataKey="complaints"
                type="number"
                axisLine={false}
                tickLine={false}
                tickMargin={5}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => [`${value} complaints`, 'Count']}
                  />
                }
              />

              <Bar dataKey="complaints" radius={5}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarFill(entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-64 w-full">
            <p className="text-sm text-muted-foreground">
              No data available for the selected filters
            </p>
          </div>
        )}
      </div>

      {/* Footer with trend analysis */}
      <div className="flex flex-col items-start gap-2 text-sm pt-4 border-t">
        <div className="flex items-center gap-2 leading-none font-medium">
          <getTrend.icon className="h-4 w-4" />
          {getTrend.text}
        </div>
        <div className="text-muted-foreground leading-none">
          {getTrend.description}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {chartData.map((item) => {
            const statusConfig = chartConfig[item.status as keyof typeof chartConfig];
            if (!statusConfig) return null;

            return (
              <div key={item.status} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: statusConfig.color }}
                />
                <span className="flex items-center gap-1">
                  {/* {getStatusIcon(item.status)} */}
                  <span>{item.displayName}</span>
                  <span className="text-muted-foreground">({item.complaints})</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">Total Complaints:</span>
              <span className="text-muted-foreground">
                {chartData.reduce((sum, item) => sum + item.complaints, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Active:</span>
              <span className="text-muted-foreground">
                {chartData
                  .filter(item => ['pending', 'under_review', 'assigned', 'in_progress'].includes(item.status))
                  .reduce((sum, item) => sum + item.complaints, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Resolved:</span>
              <span className="text-muted-foreground">
                {chartData
                  .filter(item => ['resolved', 'closed'].includes(item.status))
                  .reduce((sum, item) => sum + item.complaints, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}