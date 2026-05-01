import type { ReactNode } from "react";

import { Award, BookOpen, FileText, PlayCircle } from "lucide-react";

import type { ActivityLogDto } from "@/lib/types";

interface Props {
  data: ActivityLogDto[];
  lastUpdated: Date | null;
}

const ACTIVITY_COLORS: Record<string, string> = {
  VIDEO_WATCH: "bg-blue-100 text-blue-700",
  QUIZ_ATTEMPT: "bg-purple-100 text-purple-700",
  COURSE_ENROLL: "bg-green-100 text-green-700",
  CERTIFICATE_DOWNLOAD: "bg-yellow-100 text-yellow-700",
};

const ACTIVITY_ICONS: Record<string, ReactNode> = {
  VIDEO_WATCH: <PlayCircle className="h-3 w-3" />,
  QUIZ_ATTEMPT: <FileText className="h-3 w-3" />,
  COURSE_ENROLL: <BookOpen className="h-3 w-3" />,
  CERTIFICATE_DOWNLOAD: <Award className="h-3 w-3" />,
};

export default function RecentActivityTable({ data, lastUpdated }: Props) {
  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatActivity = (type: string) =>
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        {lastUpdated && (
          <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No recent activity</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Activity</th>
                <th className="pb-2 font-medium">Course</th>
                <th className="pb-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((log, i) => (
                <tr key={`${log.username}-${log.timestamp}-${i}`} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-800">{log.username}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ACTIVITY_COLORS[log.activityType] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ACTIVITY_ICONS[log.activityType] || "•"}
                      {formatActivity(log.activityType)}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate py-2.5 text-gray-500">{log.courseName || "—"}</td>
                  <td className="whitespace-nowrap py-2.5 text-right text-xs text-gray-400">
                    {formatTime(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
