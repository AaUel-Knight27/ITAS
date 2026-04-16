"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpen, Award, TrendingUp, Clock, ArrowRight, Play } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { useLanguage } from "@/context/LanguageContext";
import { getCourseLearnHref } from "@/lib/learn";
import { useCertificateStore, useEnrollmentStore } from "@/lib/store";
import { getFileUrl } from "@/lib/utils";

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
  const { t, isAmharic } = useLanguage();
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
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="mb-1 h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-20 w-32 shrink-0 animate-pulse rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-2 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-2 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-gray-200" />
            </div>
          ))}
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
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
              {t("dashboard.title")}
            </h1>
            <p className={`mt-1 text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
              {t("dashboard.subtitle")}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            <span className={isAmharic ? "ethiopic-text" : undefined}>{t("dashboard.browse_courses")}</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t("dashboard.total_enrollments")}
            value={enrollments.length}
            icon={<BookOpen className="h-5 w-5" />}
            color="primary"
          />
          <StatCard
            label={t("dashboard.in_progress")}
            value={activeCount}
            icon={<Clock className="h-5 w-5" />}
            color="warning"
          />
          <StatCard
            label={t("dashboard.completed")}
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
                      <h2 className={`text-lg font-semibold text-card-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                        {t("dashboard.my_certificates")}
                      </h2>
                      <p className={`mt-0.5 text-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                        <span className="font-semibold text-success">{certificates.length}</span>{" "}
                        {certificates.length === 1 ? t("dashboard.certificates_earned") : t("dashboard.certificates_earned_plural")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                    <span className={isAmharic ? "ethiopic-text" : undefined}>{t("dashboard.view_all")}</span>
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
                  <h2 className={`text-lg font-semibold text-card-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                    {t("dashboard.certificates_placeholder_title")}
                  </h2>
                  <p className={`mt-0.5 text-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                    {t("dashboard.certificates_placeholder_desc")}
                  </p>
                </div>
              </div>
            </article>
          )
        )}

        {/* Enrolled Courses */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-semibold text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>{t("dashboard.your_courses")}</h2>
            <span className={`text-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>{enrollments.length} {t("dashboard.enrolled")}</span>
          </div>

          {enrollments.length === 0 ? (
            <article className="rounded-xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className={`text-lg font-semibold text-card-foreground ${isAmharic ? "ethiopic-text" : ""}`}>{t("dashboard.no_enrollments")}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {t("dashboard.subtitle")}
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <span className={isAmharic ? "ethiopic-text" : undefined}>{t("dashboard.explore_courses")}</span>
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
                            src={getFileUrl(course.courseThumbnailUrl) ?? ""}
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
                      href={getCourseLearnHref(course.courseSlug, course.lastLectureId)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Play className="h-4 w-4" />
                      <span className={isAmharic ? "ethiopic-text" : undefined}>
                        {course.progressPercent > 0 ? t("dashboard.continue") : t("dashboard.start")}
                      </span>
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
