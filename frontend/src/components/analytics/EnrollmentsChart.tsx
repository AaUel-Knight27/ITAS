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

import type { DailyEnrollmentDto } from "@/lib/types";

interface Props {
  data: DailyEnrollmentDto[];
}

export default function EnrollmentsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: d.count,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Enrollments Over Time (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name="Enrollments"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
