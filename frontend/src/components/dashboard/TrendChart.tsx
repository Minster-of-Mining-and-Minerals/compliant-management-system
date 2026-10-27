"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "./DashboardWidgets";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: Array<Record<string, any> & { date: string }>;
  series: TrendSeries[];
  /** Fixed y-axis domain, e.g. [1, 5] for ratings */
  yDomain?: [number, number];
  height?: number;
}

const DAY_MS = 86400000;

/** Daily data from the server skips empty days — fill them with zeros so the line doesn't jump */
const fillDailyGaps = (data: TrendChartProps["data"], series: TrendSeries[]) => {
  if (data.length < 2) return data;
  const first = new Date(data[0].date).getTime();
  const second = new Date(data[1].date).getTime();
  if (second - first > DAY_MS * 1.5) return data; // weekly / monthly buckets: leave as is

  const byDay = new Map(data.map((d) => [new Date(d.date).toISOString().slice(0, 10), d]));
  const last = new Date(data[data.length - 1].date).getTime();
  const filled: TrendChartProps["data"] = [];
  for (let t = first; t <= last; t += DAY_MS) {
    const key = new Date(t).toISOString().slice(0, 10);
    filled.push(
      byDay.get(key) ?? { date: new Date(t).toISOString(), ...Object.fromEntries(series.map((s) => [s.key, 0])) },
    );
  }
  return filled;
};

const formatTick = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function TrendChart({ data, series, yDomain, height = 260 }: TrendChartProps) {
  if (!data.length) return <EmptyState />;

  const points = fillDailyGaps(data, series);

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ backgroundColor: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={yDomain ?? [0, "auto"]}
              allowDecimals={!!yDomain}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
              contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
