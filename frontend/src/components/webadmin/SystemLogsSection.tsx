"use client";

import { useCallback, useEffect, useState } from "react";

import { systemLogsApi } from "@/lib/api";
import type { ActivityLogEntry } from "@/lib/types";

const ACTIVITY_TYPES = [
  "VIDEO_WATCH",
  "QUIZ_ATTEMPT",
  "COURSE_ENROLL",
  "CERTIFICATE_DOWNLOAD",
  "LOGIN",
  "LOGOUT",
];

export default function SystemLogsSection() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [activityType, setActivityType] = useState("");
  const [username, setUsername] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemLogsApi.getActivityLogs({
        page,
        size: PAGE_SIZE,
        activityType: activityType || undefined,
        username: username || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, activityType, username, from, to]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(0);
  }, [activityType, username, from, to]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await systemLogsApi.exportActivityLogs();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Filter by user..."
            className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Activity Type</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="ml-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "⬇ Export CSV"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {["User", "Activity", "Resource", "Time"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{log.username}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {log.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{log.resourceId || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span>{total} total logs</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-3 py-1">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
