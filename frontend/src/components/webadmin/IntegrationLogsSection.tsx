"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { integrationApi } from "@/lib/api";
import { useUIStore } from "@/lib/store";
import type { SyncLogDto, SyncRequestDto, SyncStatsDto } from "@/lib/types";

const SYSTEMS = ["HR_SYSTEM", "TAX_RECORDS", "PAYMENT_GATEWAY", "DIRECTORY"] as const;
const SYNC_TYPES = ["USER_SYNC", "FULL_SYNC", "CERTIFICATE_SYNC", "COURSE_SYNC"] as const;
const STATUSES = ["SUCCESS", "FAILED", "PARTIAL", "RUNNING", "PENDING"] as const;
const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  RUNNING: "bg-blue-100 text-blue-700",
  PENDING: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, string> = {
  SUCCESS: "\u2713",
  FAILED: "\u2715",
  PARTIAL: "\u26A0",
  RUNNING: "\u21BB",
  PENDING: "\u23F3",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "\u2014";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function IntegrationLogsSection() {
  const { showToast } = useUIStore();
  const [stats, setStats] = useState<SyncStatsDto | null>(null);
  const [logs, setLogs] = useState<SyncLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [systemFilter, setSystemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<SyncLogDto | null>(null);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [error, setError] = useState("");
  const [triggerForm, setTriggerForm] = useState<SyncRequestDto>({
    systemName: "HR_SYSTEM",
    syncType: "USER_SYNC",
  });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const res = await integrationApi.getStats();
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await integrationApi.getLogs({
        systemName: systemFilter || undefined,
        status: statusFilter || undefined,
        page,
        size: PAGE_SIZE,
      });

      setLogs(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      setLogs([]);
      setTotal(0);
      setError("Failed to load sync logs.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, systemFilter]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, systemFilter]);

  const handleTrigger = async () => {
    setTriggerLoading(true);

    try {
      const res = await integrationApi.triggerSync(triggerForm);
      showToast(`Sync triggered: ${res.data.status}`, "success");
      setShowTriggerForm(false);
      await fetchStats();
      await fetchLogs();
    } catch {
      showToast("Failed to trigger sync.", "error");
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleRetry = async (log: SyncLogDto) => {
    setRetryLoading(log.id);

    try {
      const res = await integrationApi.retrySync(log.id);
      showToast(`Retry completed: ${res.data.status}`, "success");

      if (selectedLog?.id === log.id) {
        setSelectedLog(res.data);
      }

      await fetchStats();
      await fetchLogs();
    } catch {
      showToast("Retry failed.", "error");
    } finally {
      setRetryLoading(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const res = await integrationApi.exportCsv();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `sync-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      showToast("CSV export downloaded.", "success");
    } catch {
      showToast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = async (log: SyncLogDto) => {
    setDetailsLoading(log.id);
    setSelectedLog(log);

    try {
      const res = await integrationApi.getById(log.id);
      setSelectedLog(res.data);
    } catch {
      showToast("Unable to load full sync details.", "error");
    } finally {
      setDetailsLoading(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statCards = useMemo(() => {
    if (!stats) return [];

    return [
      { label: "Total Syncs", value: stats.totalSyncs, icon: "\u21BB", color: "text-blue-600" },
      { label: "Successful", value: stats.successfulSyncs, icon: "\u2714", color: "text-green-600" },
      { label: "Failed", value: stats.failedSyncs, icon: "\u2716", color: "text-red-600" },
      { label: "Pending/Running", value: stats.pendingSyncs, icon: "\u23F3", color: "text-yellow-600" },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <span className="text-3xl" aria-hidden="true">
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {stats && stats.latestPerSystem.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Latest Sync Per System</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.latestPerSystem.map((log) => (
              <div key={log.id} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-700">{formatLabel(log.systemName)}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[log.status] || STATUS_STYLES.PENDING
                    }`}
                  >
                    {STATUS_ICONS[log.status]} {log.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{formatDate(log.startedAt)}</p>
                {log.durationFormatted && (
                  <p className="text-xs text-gray-400">Time: {log.durationFormatted}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Systems</option>
            {SYSTEMS.map((system) => (
              <option key={system} value={system}>
                {formatLabel(system)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => setShowTriggerForm((prev) => !prev)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Trigger Sync
          </button>
        </div>
      </div>

      {showTriggerForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-blue-900">Trigger Manual Sync</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800">System</label>
              <select
                value={triggerForm.systemName}
                onChange={(e) =>
                  setTriggerForm((prev) => ({
                    ...prev,
                    systemName: e.target.value,
                  }))
                }
                className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SYSTEMS.map((system) => (
                  <option key={system} value={system}>
                    {formatLabel(system)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800">Sync Type</label>
              <select
                value={triggerForm.syncType}
                onChange={(e) =>
                  setTriggerForm((prev) => ({
                    ...prev,
                    syncType: e.target.value,
                  }))
                }
                className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SYNC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => void handleTrigger()}
                disabled={triggerLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {triggerLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    Running...
                  </span>
                ) : (
                  "Run Sync"
                )}
              </button>
              <button
                onClick={() => setShowTriggerForm(false)}
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={() => void fetchLogs()} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {["System", "Type", "Status", "Processed", "Failed", "Duration", "Triggered By", "Started At", "Actions"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index}>
                  <td colSpan={9} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon="Logs"
                    title="No sync logs found"
                    description="Try adjusting the filters or trigger a manual sync to create a new log entry."
                    action={{
                      label: "Trigger Sync",
                      onClick: () => setShowTriggerForm(true),
                    }}
                  />
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{formatLabel(log.systemName)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatLabel(log.syncType)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[log.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {STATUS_ICONS[log.status]}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{log.recordsProcessed}</td>
                  <td className="px-4 py-3 text-center text-xs">
                    <span className={log.recordsFailed > 0 ? "font-medium text-red-600" : "text-gray-400"}>
                      {log.recordsFailed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.durationFormatted || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.triggeredByUsername}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{formatDate(log.startedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => void handleViewDetails(log)}
                        className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        {detailsLoading === log.id ? "Loading..." : "Details"}
                      </button>
                      {log.status === "FAILED" && (
                        <button
                          onClick={() => void handleRetry(log)}
                          disabled={retryLoading === log.id}
                          className="rounded-lg border border-orange-200 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                        >
                          {retryLoading === log.id ? "..." : "Retry"}
                        </button>
                      )}
                    </div>
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
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 0}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-3 py-1">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Sync Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
                aria-label="Close sync log details"
              >
                x
              </button>
            </div>

            <div className="space-y-3 px-6 py-4">
              {[
                { label: "Log ID", value: `#${selectedLog.id}` },
                { label: "System", value: formatLabel(selectedLog.systemName) },
                { label: "Sync Type", value: formatLabel(selectedLog.syncType) },
                { label: "Status", value: selectedLog.status },
                { label: "Records Processed", value: selectedLog.recordsProcessed },
                { label: "Records Failed", value: selectedLog.recordsFailed },
                { label: "Duration", value: selectedLog.durationFormatted || "\u2014" },
                { label: "Triggered By", value: selectedLog.triggeredByUsername },
                { label: "Started At", value: formatDate(selectedLog.startedAt) },
                { label: "Finished At", value: formatDate(selectedLog.finishedAt) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-4 border-b border-gray-50 pb-2 text-sm">
                  <span className="font-medium text-gray-500">{item.label}</span>
                  <span className="text-right text-gray-900">{item.value}</span>
                </div>
              ))}

              {selectedLog.errorMessage && (
                <div>
                  <p className="mb-1 text-sm font-medium text-red-700">Error Message</p>
                  <div className="rounded-lg bg-red-50 p-3 font-mono text-xs text-red-700">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
              {selectedLog.status === "FAILED" && (
                <button
                  onClick={() => {
                    void handleRetry(selectedLog);
                    setSelectedLog(null);
                  }}
                  className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                >
                  Retry This Sync
                </button>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
