"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpen, Award, ArrowRight, Play } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { getCourseLearnHref } from "@/lib/learn";
import { useCertificateStore, useEnrollmentStore } from "@/lib/store";
import { getFileUrl } from "@/lib/utils";

export default function ManagerLearning() {
  const { enrollments, isLoading: enrollmentsLoading, error: enrollmentsError, fetchMyEnrollments } = useEnrollmentStore();
  const { certificates, isLoading: certsLoading, fetchCertificates } = useCertificateStore();

  useEffect(() => {
    void fetchMyEnrollments();
    void fetchCertificates();
  }, [fetchMyEnrollments, fetchCertificates]);

  const isLoading = enrollmentsLoading || certsLoading;
  const error = enrollmentsError;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading my learning...</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Learning</h1>
            <p className="mt-1 text-muted-foreground">
              Continue your courses and access your certificates.
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

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Certificates Card */}
        <Link href="/certificates" className="block">
          <article className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-success/5 p-6 shadow-soft transition-all hover:shadow-soft-lg">
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
                Start by browsing the course catalog and enrolling in your first course.
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
