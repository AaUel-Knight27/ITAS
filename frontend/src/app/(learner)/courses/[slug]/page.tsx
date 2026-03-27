"use client";

import axios from "axios";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ProgressBar from "@/components/course/ProgressBar";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getCourseBySlug } from "@/lib/api/courses";
import { enrollCourse, getCourseProgress } from "@/lib/api/enrollment";
import { getCourseLearnHref } from "@/lib/learn";
import { canAccessCourses } from "@/lib/roles";
import type { Course, CourseProgress, CourseSection, Lecture } from "@/types";

function prettyDifficulty(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function firstLectureId(sections: CourseSection[]): number | string | null {
  const firstSection = byOrder(sections)[0];
  if (!firstSection) return null;
  const firstLecture = byOrder(firstSection.lectures ?? [])[0];
  return firstLecture?.id ?? null;
}

export default function CourseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const role = session?.user?.role ?? "";
  const canLearn = canAccessCourses(role);

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !canLearn) {
      router.replace("/dashboard");
      return;
    }

    if (!slug) return;

    let active = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        setNeedsLogin(false);

        const data = await getCourseBySlug(slug);
        if (!active) return;

        setCourse(data);

        if (data.enrolled) {
          try {
            const progressData = await getCourseProgress(data.id);
            if (!active) return;
            setProgress(progressData);
          } catch {
            if (!active) return;
            setProgress(null);
          }
        } else {
          setProgress(null);
        }
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setNeedsLogin(true);
          setError(null);
        } else {
          setError("Failed to load this course.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug, status, canLearn, router]);

  const sections = useMemo(() => byOrder<CourseSection>(course?.sections ?? []), [course?.sections]);
  const isEnrolled = Boolean(course?.enrolled);
  const completedLectureIds = new Set((progress?.completedLectureIds ?? []).map(String));

  const firstLecture = firstLectureId(sections);
  const continueLecture = progress?.lastLectureId ?? firstLecture;

  async function handleEnroll() {
    if (!course?.id) return;

    try {
      setIsEnrolling(true);
      setError(null);
      await enrollCourse(course.id);

      setCourse((prev) => (prev ? { ...prev, enrolled: true } : prev));

      if (firstLecture) {
        router.push(getCourseLearnHref(course.slug, firstLecture));
        return;
      }
    } catch {
      setError("Enrollment failed. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  }

  if (status === "authenticated" && !canLearn) {
    return null;
  }

  if (isLoading) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Loading course...</main>;
  }

  if (needsLogin) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <p className="text-slate-700">
          Please{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            sign in
          </Link>{" "}
          to view this course.
        </p>
      </main>
    );
  }

  if (!course) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Course not found.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <ScrollReveal className="mx-auto max-w-5xl space-y-6" variant="fade-up">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{course.category?.name}</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{prettyDifficulty(course.difficulty)}</span>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">{course.title}</h1>
          <p className="mt-3 whitespace-pre-line text-slate-700">{course.description}</p>

          {isEnrolled && progress ? (
            <div className="mt-5 max-w-md">
              <ProgressBar percent={progress.progressPercent ?? 0} />
            </div>
          ) : null}

          {canLearn ? (
            <div className="mt-5">
              {isEnrolled ? (
                continueLecture ? (
                  <Link
                    href={getCourseLearnHref(course.slug, continueLecture)}
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Continue Learning
                  </Link>
                ) : null
              ) : (
                <button
                  type="button"
                  disabled={isEnrolling}
                  onClick={handleEnroll}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Now"}
                </button>
              )}
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Course Content</h2>

          {sections.length === 0 ? (
            <p className="mt-3 text-slate-600">No sections available yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-lg border border-slate-200 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-sm"
                >
                  <h3 className="font-medium text-slate-900">{section.title}</h3>
                  {section.description ? <p className="mt-1 text-sm text-slate-600">{section.description}</p> : null}

                  <ul className="mt-3 space-y-2">
                    {byOrder<Lecture>(section.lectures ?? []).map((lecture) => {
                      const isCompleted = completedLectureIds.has(String(lecture.id));
                      const isLocked = !isEnrolled && !(lecture.preview ?? lecture.isPreview);
                      const rowClass = isLocked ? "opacity-70" : "";

                      return (
                        <li
                          key={lecture.id}
                          className={`rounded-md border border-slate-200 px-3 py-2 transition-colors duration-200 hover:bg-slate-50 ${rowClass}`}
                        >
                          {isLocked ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Lock className="h-4 w-4 text-slate-500" />
                                <span>{lecture.title}</span>
                              </div>
                              <span className="text-xs text-slate-500">{lecture.durationMinutes} min</span>
                            </div>
                          ) : (
                            <Link
                              href={getCourseLearnHref(course.slug, lecture.id)}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-blue-600" />
                                )}
                                <span>{lecture.title}</span>
                              </div>
                              <span className="text-xs text-slate-500">{lecture.durationMinutes} min</span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </article>
      </ScrollReveal>
    </main>
  );
}
