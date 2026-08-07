"use client";

// S4 · 结构化输出图表化：把工具返回里 output.chart 字段渲染成 Recharts 柱状/折线/饼图。
//
// 契约（约定优于配置）：
//   output.chart = {
//     type: "bar" | "line" | "pie",
//     title?: string,
//     data: Array<{ label: string; value: number }>,
//   }
//
// 只要 AI 通过工具返回符合上述 shape 的 chart，UI 就能自动画出对应图表。
// 这样"AI 说什么图 → 前端画什么图"，不用 hard-code 分支。

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// 与工具返回的最小 shape
export interface AutoChartSpec {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Array<{ label: string; value: number }>;
}

// 从任意 unknown（工具 output）里判断是否包含合法 chart 字段
export function extractChartSpec(output: unknown): AutoChartSpec | null {
  if (!output || typeof output !== "object") return null;
  const chart = (output as { chart?: unknown }).chart;
  if (!chart || typeof chart !== "object") return null;
  const c = chart as Record<string, unknown>;
  if (c.type !== "bar" && c.type !== "line" && c.type !== "pie") return null;
  if (!Array.isArray(c.data)) return null;
  const data = c.data
    .map((d) => {
      if (!d || typeof d !== "object") return null;
      const label = (d as Record<string, unknown>).label;
      const value = (d as Record<string, unknown>).value;
      if (typeof label !== "string" || typeof value !== "number") return null;
      return { label, value };
    })
    .filter((x): x is { label: string; value: number } => !!x);
  if (data.length === 0) return null;
  return {
    type: c.type,
    title: typeof c.title === "string" ? c.title : undefined,
    data,
  };
}

// 一组温和的图表配色，够画到 10 类
const PALETTE = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#f59e0b", // amber-500
  "#dc2626", // red-600
  "#8b5cf6", // violet-500
  "#0ea5e9", // sky-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#64748b", // slate-500
];

export function AutoChart({ spec }: { spec: AutoChartSpec }) {
  return (
    <div className="my-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-3">
      {spec.title && (
        <div className="mb-2 text-xs font-medium text-[color:var(--foreground)]">
          {spec.title}
        </div>
      )}
      {/* 固定高度容器，避免 ResponsiveContainer 在弹层里塌成 0 高 */}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "bar" ? (
            <BarChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                cursor={{ fill: "rgba(148,163,184,0.15)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : spec.type === "line" ? (
            <LineChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={PALETTE[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Pie
                data={spec.data}
                dataKey="value"
                nameKey="label"
                outerRadius={80}
                innerRadius={40}
                label={{ fontSize: 11 }}
              >
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}