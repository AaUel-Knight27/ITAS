import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type AnalyticsMetrics = {
  totalUsers: number;
  activeLearners: number;
  totalEnrollments: number;
  completionRate: number;
  certificatesIssued: number;
  averageScore: number;
};

export type AnalyticsTrends = {
  labels: string[];
  enrollments: number[];
  completions: number[];
  certificates: number[];
};

export type AnalyticsDashboard = {
  lastUpdated: string;
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrends;
  coursePopularity: Array<{ courseId: number | string; courseTitle: string; enrollments: number }>;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const response = await api.get<AnalyticsDashboard | ApiResponse<AnalyticsDashboard>>("/analytics/dashboard");
  const payload = unwrap(response.data) as Partial<AnalyticsDashboard>;

  const metrics = payload.metrics ?? (payload as any).summary ?? {};
  const trends = payload.trends ?? (payload as any).series ?? {};

  return {
    lastUpdated: payload.lastUpdated ?? new Date().toISOString(),
    metrics: {
      totalUsers: toNumber(metrics.totalUsers ?? metrics.totalUsersTrained),
      activeLearners: toNumber(metrics.activeLearners ?? metrics.activeUsers),
      totalEnrollments: toNumber(metrics.totalEnrollments ?? metrics.enrollments),
      completionRate: toNumber(metrics.completionRate ?? metrics.completionPercent),
      certificatesIssued: toNumber(metrics.certificatesIssued ?? metrics.certificates),
      averageScore: toNumber(metrics.averageScore ?? metrics.avgScore),
    },
    trends: {
      labels: trends.labels ?? trends.days ?? [],
      enrollments: trends.enrollments ?? [],
      completions: trends.completions ?? [],
      certificates: trends.certificates ?? [],
    },
    coursePopularity: payload.coursePopularity ?? (payload as any).popularCourses ?? [],
  };
}
