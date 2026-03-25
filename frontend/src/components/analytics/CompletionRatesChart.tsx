"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CourseCompletionRateDto } from "@/lib/types";

interface Props {
  data: CourseCompletionRateDto[];
}

export default function CompletionRatesChart({ data }: Props) {
  const formatted = data.map((d) => ({
    name: d.courseName.length > 20 ? `${d.courseName.slice(0, 20)}...` : d.courseName,
    rate: Math.round(d.completionRate),
    fullName: d.courseName,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Course Completion Rates (Top 10)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} layout="vertical">
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value) => [`${Number(value)}%`, "Completion Rate"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={`hsl(${210 + i * 15}, 70%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
