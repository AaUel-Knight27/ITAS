"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpen, Award, TrendingUp, Clock, ArrowRight, Play } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { useCertificateStore, useEnrollmentStore } from "@/lib/store";

type LearnerDashboardProps = {
  showCertificates: boolean;
  isTaxpayer: boolean;
};

function StatCard({
  label,
  value,
  icon,
  trend,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "primary" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning-foreground",
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-soft-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
    </article>
  );
}

export default function LearnerDashboard({ showCertificates, isTaxpayer }: LearnerDashboardProps) {
  const { enrollments, isLoading: enrollmentsLoading, error: enrollmentsError, fetchMyEnrollments } = useEnrollmentStore();
  const { certificates, isLoading: certsLoading, fetchCertificates } = useCertificateStore();

  useEffect(() => {
    void fetchMyEnrollments();
    if (showCertificates) {
      void fetchCertificates();
    }
  }, [fetchMyEnrollments, fetchCertificates, showCertificates]);

  const isLoading = enrollmentsLoading || (showCertificates && certsLoading);
  const error = enrollmentsError;

  const completedCount = enrollments.filter((course) => course.progressPercent >= 100).length;
  const activeCount = enrollments.filter((course) => course.progressPercent > 0 && course.progressPercent < 100).length;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Learning Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Track your progress and continue your learning journey.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Enrollments"
            value={enrollments.length}
            icon={<BookOpen className="h-5 w-5" />}
            color="primary"
          />
          <StatCard
            label="In Progress"
            value={activeCount}
            icon={<Clock className="h-5 w-5" />}
            color="warning"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            icon={<Award className="h-5 w-5" />}
            trend={completedCount > 0 ? "Great progress!" : undefined}
            color="success"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Certificates Section - hidden entirely for taxpayers */}
        {!isTaxpayer && (
          showCertificates ? (
            <Link href="/certificates" className="block">
              <article className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-primary/5 p-6 shadow-soft transition-all hover:shadow-soft-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-success/10 p-3 text-success">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">My Certificates</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        You have earned <span className="font-semibold text-success">{certificates.length}</span> certificate{certificates.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Link>
          ) : (
            <article className="rounded-xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3 text-muted-foreground">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Certificates</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">Certificates will appear here once available.</p>
                </div>
              </div>
            </article>
          )
        )}

        {/* Enrolled Courses */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Courses</h2>
            <span className="text-sm text-muted-foreground">{enrollments.length} enrolled</span>
          </div>

          {enrollments.length === 0 ? (
            <article className="rounded-xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">No enrollments yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Start your learning journey by exploring our course catalog and enrolling in your first course.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ) : (
            <div className="space-y-3">
              {enrollments.map((course) => (
                <article
                  key={course.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:shadow-soft-lg"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {course.courseThumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.courseThumbnailUrl}
                            alt={course.courseTitle}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <BookOpen className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-card-foreground">{course.courseTitle}</h3>
                        <div className="mt-3 max-w-xs">
                          <ProgressBar percent={course.progressPercent} />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={
                        course.lastLectureId
                          ? `/courses/${course.courseSlug}/learn/${course.lastLectureId}`
                          : `/courses/${course.courseSlug}`
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Play className="h-4 w-4" />
                      {course.progressPercent > 0 ? "Continue" : "Start"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
