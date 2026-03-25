"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CourseCard from "@/components/dashboard/shared/CourseCard";
import StatCard from "@/components/dashboard/shared/StatCard";
import { learnerApi, webinarApi } from "@/lib/api";
import type { EnrollmentDto, WebinarDto } from "@/lib/types";

export default function TaxpayerDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [webinars, setWebinars] = useState<WebinarDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([learnerApi.getMyCourses(), webinarApi.getUpcoming()])
      .then(([coursesResult, webinarsResult]) => {
        if (coursesResult.status === "fulfilled") {
          setEnrollments(coursesResult.value.data);
        } else {
          setError("Failed to load your courses.");
        }

        if (webinarsResult.status === "fulfilled") {
          setWebinars(webinarsResult.value.data.slice(0, 3));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const total = enrollments.length;
  const inProgress = enrollments.filter((e) => e.status === "ACTIVE" && e.progressPercent > 0).length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;

  const lastActive = [...enrollments]
    .filter((e) => e.status === "ACTIVE")
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())[0];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Track your courses and progress</p>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Enrolled" value={total} icon="📚" color="text-blue-600" />
        <StatCard label="In Progress" value={inProgress} icon="▶️" color="text-yellow-600" />
        <StatCard label="Completed" value={completed} icon="✅" color="text-green-600" />
      </div>

      {lastActive && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Continue Learning</h2>
          <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-gray-900">{lastActive.courseTitle}</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{Math.round(lastActive.progressPercent)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${lastActive.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/courses/${lastActive.courseSlug}/learn`)}
              className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">My Courses</h2>
        {enrollments.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-lg font-medium">No courses yet</p>
            <p className="mt-1 text-sm">Browse the catalog to get started</p>
            <button
              type="button"
              onClick={() => router.push("/courses")}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enrollments.map((enrollment) => (
              <CourseCard key={enrollment.id} enrollment={enrollment} showCertBadge={false} />
            ))}
          </div>
        )}
      </div>

      {webinars.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Webinars</h2>
            <button
              type="button"
              onClick={() => router.push("/webinars")}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {webinars.map((webinar) => (
              <button
                key={webinar.id}
                type="button"
                onClick={() => router.push("/webinars")}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-sm"
              >
                <p className="line-clamp-1 text-sm font-medium text-gray-900">{webinar.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  📅{" "}
                  {new Date(webinar.scheduledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  👥 {webinar.registeredCount}
                  {webinar.maxAttendees ? ` / ${webinar.maxAttendees}` : ""} registered
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 h-4 w-48 animate-pulse rounded bg-gray-100" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
