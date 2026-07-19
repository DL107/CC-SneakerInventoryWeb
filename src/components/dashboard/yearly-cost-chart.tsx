"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/calculations";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";
import { CHART_COLORS } from "@/lib/chart-colors";

export function YearlyCostChart({ data }: { data: { year: string; cost: number }[] }) {
  const isDark = useIsDarkMode();
  const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-stone-400">No purchases recorded yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} />
        <XAxis dataKey="year" tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
        <YAxis tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: colors.grid, opacity: 0.4 }}
          formatter={(value) => formatCurrency(typeof value === "number" ? value : Number(value))}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="cost" fill={colors.series1} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
