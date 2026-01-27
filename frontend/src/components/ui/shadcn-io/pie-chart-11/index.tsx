"use client";

import * as React from "react";
import { Pie, PieChart, Label, Cell } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
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

export const description =
  "Complaints by category filtered by sector";

/* =========================
   COMPONENT
   ========================= */
export function ChartPieInteractive() {
  const id = "pie-sector-category";

  // Get dashboard data
  const { data: dashboardData, isLoading, isError } = useGetDashboardStatsQuery();

  // State for filters
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

  // Transform data for chart - Group by category
  const { chartData, chartConfig, totalComplaints } = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) {
      return { chartData: [], chartConfig: {}, totalComplaints: 0 };
    }

    // Get selected sector
    const selectedSector = dashboardData.data.sectors.find(
      (sector: any) => sector.sector_node_id === selectedSectorId
    );

    if (!selectedSector) {
      return { chartData: [], chartConfig: {}, totalComplaints: 0 };
    }

    // Get categories based on filter
    let categories = selectedSector.complaint_categories || [];

    // If a specific category is selected, only show that one
    if (selectedCategoryId) {
      categories = categories.filter((cat: any) => cat.category_id === selectedCategoryId);
    }

    // Prepare chart data from categories
    const chartDataArray = categories
      .map((category: any) => {
        const totalCategoryComplaints = category.total_complaints || 0;
        const complaints = category.complaints || [];

        // Generate a color based on category name (consistent hashing)
        const stringToColor = (str: string) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          let color = '#';
          for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
          }
          return color;
        };

        const color = stringToColor(category.name);

        return {
          categoryId: category.category_id,
          name: category.name,
          value: totalCategoryComplaints,
          color: color,
          description: category.description || "",
          complaints: complaints
        };
      })
      .filter((item: any) => item.value > 0) // Only include categories with complaints
      .sort((a: any, b: any) => b.value - a.value); // Sort by complaint count descending

    // Create dynamic chart config based on categories
    const dynamicChartConfig: ChartConfig = {
      value: {
        label: "Complaints",
      },
    };

    // Add each category to chart config
    chartDataArray.forEach((item: any) => {
      const statusKey = item.name.toLowerCase().replace(/\s+/g, '_');
      dynamicChartConfig[statusKey] = {
        label: item.name,
        color: item.color,
      };
    });

    // Calculate total
    const total = chartDataArray.reduce((sum: number, item: any) => sum + item.value, 0);

    return {
      chartData: chartDataArray,
      chartConfig: dynamicChartConfig,
      totalComplaints: total,
    };
  }, [dashboardData, selectedSectorId, selectedCategoryId]);

  // Get available categories for the selected sector
  const availableCategories = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId) return [];

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    return sector?.complaint_categories || [];
  }, [dashboardData, selectedSectorId]);

  const exportData = React.useMemo(() => {
    if (!dashboardData || !selectedSectorId || chartData.length === 0) {
      return [];
    }

    const sector = dashboardData.data.sectors.find(
      (s: any) => s.sector_node_id === selectedSectorId
    );

    if (!sector) return [];

    const categoryName = selectedCategoryId
      ? availableCategories.find((cat: any) => cat.category_id === selectedCategoryId)?.name
      : "All Categories";

    return chartData.map((item: any) => ({
      Sector: sector.name,
      Category: categoryName || item.name,
      Complaints: item.value,
      Description: item.description,
    }));
  }, [dashboardData, selectedSectorId, selectedCategoryId, chartData, availableCategories]);

  if (isLoading) {
    return (
      <Card
        data-chart={id}
        className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col space-y-4 p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading category data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (isError || !dashboardData?.data?.sectors?.length) {
    return (
      <Card
        data-chart={id}
        className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col space-y-4 p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm  text-gray-500 mb-2">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      data-chart={id}
      className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col space-y-4 p-6"
    >
      <ChartStyle id={id} config={chartConfig} />

      {/* Header */}
      <div className="flex flex-col 3xl:flex-row items-start gap-3 justify-between ">
        <div className="grid gap-1">
          <h3 className="text-lg font-semibold">
            Complaints by Category
          </h3>
          <p className="text-sm text-muted-foreground">
            Distribution of complaints by category type
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              exportToCSV(
                exportData,
                `complaints_by_category_${selectedSectorId}.csv`
              )
            }
            disabled={!exportData.length}
            className="h-7 rounded-lg border px-3 text-xs font-medium
             hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </Button>

          {/* Sector Filter */}
          <Select
            value={selectedSectorId}
            onValueChange={(value) => {
              setSelectedSectorId(value);
              setSelectedCategoryId(null);
            }}
          >
            <SelectTrigger
              className="h-7 w-[160px] rounded-lg pl-2.5 bg-white"
              aria-label="Select sector"
            >
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl bg-white">
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
          {selectedSectorId && availableCategories.length > 0 && (
            <Select
              value={selectedCategoryId || "all"}
              onValueChange={(value) => {
                setSelectedCategoryId(value === "all" ? null : value);
              }}
            >
              <SelectTrigger
                className="h-7 w-[160px] rounded-lg pl-2.5 bg-white"
                aria-label="Select category"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl bg-white">
                <SelectItem value="all" className="rounded-lg">
                  All Categories
                </SelectItem>
                {availableCategories.map((category: any) => (
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

      {/* Chart + Category Legend */}
      <div className="flex justify-center items-center space-x-2">
        {chartData.length > 0 ? (
          <>
            <ChartContainer
              id={id}
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {chartData.map((entry: any) => (
                    <Cell
                      key={entry.categoryId}
                      fill={entry.color}
                    />
                  ))}

                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalComplaints}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Total Complaints
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Category Legend */}
            <div className="mx-auto aspect-square w-full max-w-[300px] flex items-center">
              <div className="rounded-xl">
                {chartData.map((item: any) => (
                  <div
                    key={item.categoryId}
                    className="rounded-lg [&_span]:flex mt-4"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-1">
                        ({item.value})
                      </span>
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground ml-5 mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-64">
            <p className="text-sm text-muted-foreground">
              No category data available for selected filters
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs justify-center">
          <div className="flex items-center gap-1">
            <span className="font-medium">Total Complaints:</span>
            <span className="text-muted-foreground">{totalComplaints}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Categories:</span>
            <span className="text-muted-foreground">{chartData.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Top Category:</span>
            <span className="text-muted-foreground">
              {chartData.length > 0 ? chartData[0].name : "None"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Avg Complaints/Category:</span>
            <span className="text-muted-foreground">
              {chartData.length > 0
                ? (totalComplaints / chartData.length).toFixed(1)
                : "0.0"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}