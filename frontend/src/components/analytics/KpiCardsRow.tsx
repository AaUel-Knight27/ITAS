import type { ReactNode } from "react";

import { Award, CheckCircle2, FileText, PlayCircle, Users } from "lucide-react";

import type { AnalyticsDashboardDto } from "@/lib/types";

interface Props {
  data: AnalyticsDashboardDto;
}

const KPI_ITEMS = (data: AnalyticsDashboardDto): { label: string; value: string; icon: ReactNode; color: string; bg: string }[] => [
  {
    label: "Total Registered Users",
    value: data.totalUsers.toLocaleString(),
    icon: <Users className="h-5 w-5 text-blue-600" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Active Learners",
    value: data.activeLearners.toLocaleString(),
    icon: <PlayCircle className="h-5 w-5 text-green-600" />,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Courses Completed",
    value: data.totalCompletions.toLocaleString(),
    icon: <CheckCircle2 className="h-5 w-5 text-purple-600" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Certificates Issued",
    value: data.totalCertificates.toLocaleString(),
    icon: <Award className="h-5 w-5 text-yellow-600" />,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    label: "Avg Quiz Score",
    value: `${data.avgQuizScore.toFixed(1)}%`,
    icon: <FileText className="h-5 w-5 text-red-600" />,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function KpiCardsRow({ data }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {KPI_ITEMS(data).map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
            {item.icon}
          </div>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          <p className="mt-1 text-xs text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
