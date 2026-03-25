"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { QuizPassRateDto } from "@/lib/types";

interface Props {
  data: QuizPassRateDto[];
}

export default function QuizPassRatesChart({ data }: Props) {
  const formatted = data.map((d) => ({
    name: d.courseName.length > 15 ? `${d.courseName.slice(0, 15)}...` : d.courseName,
    rate: Math.round(d.passRate),
    fullName: d.courseName,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Quiz Pass Rates by Course</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted}>
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value)}%`, "Pass Rate"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <ReferenceLine
            y={70}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: "Pass (70%)",
              fontSize: 10,
              fill: "#ef4444",
            }}
          />
          <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
