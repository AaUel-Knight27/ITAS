"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CourseCard from "@/components/dashboard/shared/CourseCard";
import StatCard from "@/components/dashboard/shared/StatCard";
import { learnerApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { CertificateDto, EnrollmentDto } from "@/lib/types";

export default function TaxAgentDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [certificates, setCertificates] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([learnerApi.getMyCourses(), learnerApi.getMyCertificates()])
      .then(([enrollRes, certRes]) => {
        setEnrollments(enrollRes.data);
        setCertificates(certRes.data);
      })
      .catch((error) => setError(getErrorMessage(error) || "Could not load dashboard. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const certCount = certificates.length;
  const quizPassed = certificates.length;
  const quizTotal = enrollments.filter((e) => e.status === "COMPLETED").length;
  const passRate = quizTotal > 0 ? `${quizPassed}/${quizTotal} passed` : "—";

  const lastActive = [...enrollments]
    .filter((e) => e.status === "ACTIVE" && e.progressPercent > 0)
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())[0];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Track your progress and certificates</p>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enrolled" value={total} icon="📚" color="text-blue-600" />
        <StatCard label="Completed" value={completed} icon="✅" color="text-green-600" />
        <StatCard
          label="Certificates Earned"
          value={certCount}
          icon="🏆"
          color="text-yellow-600"
          clickable={certCount > 0}
          onClick={() => {
            if (certCount > 0) {
              router.push("/certificates");
            }
          }}
        />
        <StatCard label="Quiz Pass Rate" value={passRate} icon="📝" color="text-purple-600" />
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
              <CourseCard key={enrollment.id} enrollment={enrollment} showCertBadge />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 h-4 w-48 animate-pulse rounded bg-gray-100" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
