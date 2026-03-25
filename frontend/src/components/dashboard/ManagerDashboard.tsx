"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import CompletionRatesChart from "@/components/analytics/CompletionRatesChart";
import EnrollmentsChart from "@/components/analytics/EnrollmentsChart";
import KpiCardsRow from "@/components/analytics/KpiCardsRow";
import LearnersByRoleChart from "@/components/analytics/LearnersByRoleChart";
import QuizPassRatesChart from "@/components/analytics/QuizPassRatesChart";
import RecentActivityTable from "@/components/analytics/RecentActivityTable";
import { analyticsApi } from "@/lib/api";
import type {
  ActivityLogDto,
  AnalyticsDashboardDto,
  CourseCompletionRateDto,
  DailyEnrollmentDto,
  QuizPassRateDto,
  RoleCountDto,
} from "@/lib/types";

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const [kpi, setKpi] = useState<AnalyticsDashboardDto | null>(null);
  const [enrollments, setEnrollments] = useState<DailyEnrollmentDto[]>([]);
  const [completions, setCompletions] = useState<CourseCompletionRateDto[]>([]);
  const [byRole, setByRole] = useState<RoleCountDto[]>([]);
  const [quizRates, setQuizRates] = useState<QuizPassRateDto[]>([]);
  const [activity, setActivity] = useState<ActivityLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [kpiRes, enrollRes, completionRes, roleRes, quizRes, activityRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getEnrollmentsOverTime(30),
        analyticsApi.getCompletionRates(),
        analyticsApi.getLearnersByRole(),
        analyticsApi.getQuizPassRates(),
        analyticsApi.getRecentActivity(20),
      ]);

      setKpi(kpiRes.data);
      setEnrollments(enrollRes.data);
      setCompletions(completionRes.data);
      setByRole(roleRes.data);
      setQuizRates(quizRes.data);
      setActivity(activityRes.data);
      setLastUpdated(new Date());
      setError("");
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.accessToken) return;
    void fetchAll();
  }, [fetchAll, session?.user?.accessToken, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.accessToken) return;

    const interval = window.setInterval(() => {
      void fetchAll();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchAll, session?.user?.accessToken, status]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time platform performance</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            onClick={() => void fetchAll()}
            className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {kpi && <KpiCardsRow data={kpi} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EnrollmentsChart data={enrollments} />
        <LearnersByRoleChart data={byRole} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompletionRatesChart data={completions} />
        <QuizPassRatesChart data={quizRates} />
      </div>

      <RecentActivityTable data={activity} lastUpdated={lastUpdated} />
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}
