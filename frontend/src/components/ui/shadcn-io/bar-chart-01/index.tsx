"use client";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import { useGetDashboardStatsQuery } from "@/redux/api/dashboardApi";
import { Button } from "../../button";

export const description = "Sector complaint counts";

/* =========================
   COMPONENT
   ========================= */
export function ChartBarInteractive({ dataType = "complaint" }: { dataType?: "complaint" | "feedback" }) {
  const { data: dashboardData, isLoading, isError } = useGetDashboardStatsQuery({ type: dataType });

  // State for selected year
  const [selectedYear, setSelectedYear] = React.useState<string>("all");

  // Generate year options from sector creation dates
  const yearOptions = React.useMemo(() => {
    if (!dashboardData?.data?.sectors) return [{ value: "all", label: "All Years" }];

    const years = new Set<number>();

    // Collect all years from sector creation dates
    dashboardData.data.sectors.forEach((sector: any) => {
      if (sector.created_at) {
        const year = new Date(sector.created_at).getFullYear();
        years.add(year);
      }
    });

    // Convert to array and sort
    const yearsArray = Array.from(years).sort();

    // If no years found, use current year
    if (yearsArray.length === 0) {
      const currentYear = new Date().getFullYear();
      yearsArray.push(currentYear);
    }

    // Add "all" option
    const options = [
      { value: "all", label: "All Years" }
    ];

    // Add years from earliest to most recent
    yearsArray.forEach(year => {
      options.push({ value: year.toString(), label: year.toString() });
    });

    // Add future years (up to 5 years from the latest)
    const latestYear = Math.max(...yearsArray);
    for (let i = 1; i <= 5; i++) {
      const futureYear = latestYear + i;
      options.push({
        value: futureYear.toString(),
        label: futureYear.toString()
      });
    }

    return options;
  }, [dashboardData]);

  // Transform data for chart - Filter sectors by creation year
  const chartData = React.useMemo(() => {
    if (!dashboardData?.data?.sectors) return [];

    return dashboardData.data.sectors
      .map((sector: any) => {
        const sectorYear = sector.created_at
          ? new Date(sector.created_at).getFullYear()
          : null;

        // Calculate total complaints for this sector (sum of all categories)
        const totalComplaints = sector.complaint_categories?.reduce((sum: number, category: any) => {
          return sum + (category.total_complaints || 0);
        }, 0) || 0;

        // Check if sector should be included based on year filter
        const shouldInclude = selectedYear === "all" ||
          (sectorYear && sectorYear === parseInt(selectedYear));

        return {
          name: sector.name,
          complaints: totalComplaints,
          sectorId: sector.sector_node_id,
          createdYear: sectorYear,
          createdDate: sector.created_at,
          shouldInclude,
          categories: sector.complaint_categories?.length || 0,
        };
      })
      .filter(sector => sector.complaints > 0 && sector.shouldInclude) // Only show sectors with complaints and matching year
      .sort((a, b) => b.complaints - a.complaints); // Sort by complaint count descending
  }, [dashboardData, selectedYear]);

  // Calculate totals for the select dropdown
  const totals = React.useMemo(() => {
    const totalComplaints = chartData.reduce((sum, sector) => sum + sector.complaints, 0);
    const totalSectors = chartData.length;
    const totalCategories = chartData.reduce((sum, sector) => sum + sector.categories, 0);

    return {
      totalComplaints,
      totalSectors,
      totalCategories,
    };
  }, [chartData]);

  // Calculate total sectors for "All Years" option
  const totalAllSectors = React.useMemo(() => {
    if (!dashboardData?.data?.sectors) return 0;

    return dashboardData.data.sectors
      .filter((sector: any) => {
        // Check if sector has any complaints
        const hasComplaints = sector.complaint_categories?.some(
          (category: any) => (category.total_complaints || 0) > 0
        );
        return hasComplaints;
      })
      .length;
  }, [dashboardData]);

  // Calculate total complaints for "All Years" option
  const totalAllComplaints = React.useMemo(() => {
    if (!dashboardData?.data?.sectors) return 0;

    return dashboardData.data.sectors.reduce((sum: number, sector: any) => {
      const sectorComplaints = sector.complaint_categories?.reduce(
        (categorySum: number, category: any) => categorySum + (category.total_complaints || 0),
        0
      ) || 0;
      return sum + sectorComplaints;
    }, 0);
  }, [dashboardData]);

  // Chart configuration
  const chartConfig = {
    complaints: {
      label: "Number of Complaints",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const exportData = React.useMemo(() => {
    if (!chartData.length) return [];

    return chartData.map((sector) => ({
      Sector: sector.name,
      "Created Year": sector.createdYear ?? "N/A",
      "Created Date": sector.createdDate
        ? new Date(sector.createdDate).toLocaleDateString()
        : "N/A",
      "Complaint Count": sector.complaints,
      "Categories Count": sector.categories,
    }));
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading sector data...</p>
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
            <p className="text-sm text-muted-foreground">No sector data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col items-stretch border-b pb-4 mb-4 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <h3 className="text-lg font-semibold">{dataType === "feedback" ? "Sector Feedbacks" : "Sector Complaints"}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedYear === "all"
              ? "Number of complaints across all sectors"
              : `Sectors created in ${selectedYear} and their complaints`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              exportToCSV(
                exportData,
                `sectors_complaints_${selectedYear}.csv`
              )
            }
            disabled={!exportData.length}
            className="h-8 rounded-lg border px-3 text-xs font-medium
             hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </Button>

          {/* Year Filter - Now enabled with sector creation dates */}
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[180px] rounded-lg bg-white">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>

            <SelectContent className="rounded-xl bg-white">
              {yearOptions.map((yearOption) => {
                // Calculate totals for each year option
                let yearTotalComplaints = 0;
                let yearTotalSectors = 0;

                if (yearOption.value === "all") {
                  yearTotalComplaints = totalAllComplaints;
                  yearTotalSectors = totalAllSectors;
                } else {
                  const year = parseInt(yearOption.value);
                  dashboardData.data.sectors.forEach((sector: any) => {
                    if (sector.created_at) {
                      const sectorYear = new Date(sector.created_at).getFullYear();
                      if (sectorYear === year) {
                        // Calculate sector complaints
                        const sectorComplaints = sector.complaint_categories?.reduce(
                          (sum: number, category: any) => sum + (category.total_complaints || 0),
                          0
                        ) || 0;

                        if (sectorComplaints > 0) {
                          yearTotalSectors++;
                          yearTotalComplaints += sectorComplaints;
                        }
                      }
                    }
                  });
                }

                return (
                  <SelectItem
                    key={yearOption.value}
                    value={yearOption.value}
                    className="rounded-lg"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {yearOption.label}
                        </span>
                      </div>

                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={10}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(value) => {
                  // Truncate long sector names
                  if (value.length > 10) {
                    return value.substring(0, 10) + '...';
                  }
                  return value;
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="complaints"
                    labelFormatter={(value) => {
                      const sector = chartData.find(sector => sector.name === value);
                      return sector?.name || value;
                    }}
                    formatter={(value, name) => [
                      `${value} complaint${value === 1 ? '' : 's'}`,
                      'Complaint Count'
                    ]}
                    labelClassName="font-semibold"
                    indicator="dot"
                  />
                }
              />
              <Bar
                dataKey="complaints"
                fill={`var(--color-complaints)`}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-64 w-full">
            <p className="text-sm text-muted-foreground">
              {selectedYear === "all"
                ? "No complaints found for any sector"
                : `No sectors created in ${selectedYear} have complaints`}
            </p>
          </div>
        )}
      </div>

      {/* Footer with summary stats */}
      {chartData.length > 0 && (
        <div className="flex flex-col items-start gap-2 text-sm pt-4 border-t">
          <div className="flex items-center gap-2 leading-none font-medium">
            <span>
              {selectedYear === "all"
                ? "All Sectors Summary"
                : `Sectors Created in ${selectedYear}`}
            </span>
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 mt-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">Sectors:</span>
              <span className="text-muted-foreground">{totals.totalSectors}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Total Complaints:</span>
              <span className="text-muted-foreground">{totals.totalComplaints}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Categories:</span>
              <span className="text-muted-foreground">{totals.totalCategories}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Avg Complaints/Sector:</span>
              <span className="text-muted-foreground">
                {totals.totalSectors > 0
                  ? (totals.totalComplaints / totals.totalSectors).toFixed(1)
                  : "0.0"}
              </span>
            </div>
            {selectedYear !== "all" && chartData[0]?.createdDate && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Earliest Created:</span>
                <span className="text-muted-foreground">
                  {new Date(chartData[chartData.length - 1].createdDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}