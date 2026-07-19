"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";
import { CHART_COLORS } from "@/lib/chart-colors";

export type CategoryDatum = { label: string; value: number; tierIndex?: number };

export function CategoryBarChart({ data, mode = "single" }: { data: CategoryDatum[]; mode?: "single" | "ordinal" }) {
  const isDark = useIsDarkMode();
  const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-stone-400">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={colors.grid} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fill: colors.muted, fontSize: 12 }}
          stroke={colors.axis}
        />
        <Tooltip
          cursor={{ fill: colors.grid, opacity: 0.4 }}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={i} fill={mode === "ordinal" ? colors.ordinal[entry.tierIndex ?? i] : colors.series1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
