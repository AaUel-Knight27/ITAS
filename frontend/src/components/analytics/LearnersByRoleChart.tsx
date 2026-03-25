"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { RoleCountDto } from "@/lib/types";

interface Props {
  data: RoleCountDto[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

const ROLE_LABELS: Record<string, string> = {
  TAXPAYER: "Taxpayers",
  TAX_AGENT: "Tax Agents",
  MOR_STAFF: "MOR Staff",
};

export default function LearnersByRoleChart({ data }: Props) {
  const formatted = data.map((d) => ({
    name: ROLE_LABELS[d.role] || d.role,
    value: d.count,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Learners by Role</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={formatted}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {formatted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString(), "Users"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: "12px" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
