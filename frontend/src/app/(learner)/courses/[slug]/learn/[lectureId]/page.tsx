"use client";

import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import VideoPlayer from "@/components/player/VideoPlayer";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { getCourseBySlug } from "@/lib/api/courses";
import { useAuthStore, useEnrollmentStore, useCertificateStore } from "@/lib/store";
import { canAccessCourses } from "@/lib/roles";
import { getFileUrl } from "@/lib/utils";
import type { Course, CourseSection, Lecture } from "@/types";

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function normalizeLectureType(value: string | undefined) {
  return (value ?? "VIDEO").toUpperCase();
}

function findLecture(sections: CourseSection[], lectureId: string) {
  for (const section of sections) {
    for (const lecture of section.lectures ?? []) {
      if (String(lecture.id) === lectureId) return lecture;
    }
  }
  return null;
}

export default function LearnLecturePage() {
  const params = useParams<{ slug: string; lectureId: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const lectureId = params?.lectureId ?? "";
  
  const { isAuthenticated, canGetCertificate, role } = useAuthStore();
  const showCertificateAction = canGetCertificate();
  const canLearn = canAccessCourses(role ?? "");

  const { progressMap, fetchProgress } = useEnrollmentStore();
  const { triggerDownload, downloadMap } = useCertificateStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizCertificateId, setQuizCertificateId] = useState<number | string | null>(null);

  useEffect(() => {
    setQuizPassed(false);
    setQuizCertificateId(null);
  }, [lectureId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!canLearn) {
      router.replace("/dashboard");
      return;
    }

    if (!slug) return;

    let active = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getCourseBySlug(slug);
        if (!active) return;
        setCourse(data);

        if (data.enrolled) {
          await fetchProgress(data.id);
        }
      } catch (err) {
        if (!active) return;
        setError("Failed to load lecture.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug, isAuthenticated, canLearn, router, fetchProgress]);

  const progress = course ? progressMap[String(course.id)] : null;
  const sections = useMemo(() => byOrder<CourseSection>(course?.sections ?? []), [course?.sections]);
  const currentLecture = useMemo(() => findLecture(sections, lectureId), [sections, lectureId]);
  const isEnrolled = Boolean(course?.enrolled);
  const completedLectureIds = new Set((progress?.completedLectureIds ?? []).map(String));

  if (!canLearn) {
    return null;
  }

  if (isLoading) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Loading lecture...</main>;
  }

  if (!course || !currentLecture) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Lecture not found.</main>;
  }

  const lectureType = normalizeLectureType(currentLecture.type);
  const isCurrentLocked = !isEnrolled && !(currentLecture.preview ?? currentLecture.isPreview);
  const isDownloadingCertificate = quizCertificateId ? downloadMap[String(quizCertificateId)] : false;

  async function handleDownloadCertificate() {
    if (!quizCertificateId) return;
    await triggerDownload(quizCertificateId);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-slate-900">{course.title}</h2>
          <p className="mt-1 text-sm text-slate-600">Course content</p>

          <div className="mt-4 space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <h3 className="text-sm font-medium text-slate-800">{section.title}</h3>
                <ul className="mt-2 space-y-1">
                  {byOrder<Lecture>(section.lectures ?? []).map((lecture) => {
                    const lectureIdStr = String(lecture.id);
                    const isActive = lectureIdStr === String(currentLecture.id);
                    const isCompleted = completedLectureIds.has(lectureIdStr);
                    const isLocked = !isEnrolled && !(lecture.preview ?? lecture.isPreview);

                    if (isLocked) {
                      return (
                        <li
                          key={lecture.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-500 opacity-80"
                        >
                          <Lock className="h-4 w-4" />
                          <span className="truncate">{lecture.title}</span>
                        </li>
                      );
                    }

                    return (
                      <li key={lecture.id}>
                        <Link
                          href={`/courses/${course.slug}/learn/${lecture.id}`}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <PlayCircle className="h-4 w-4" />}
                          <span className="truncate">{lecture.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">{currentLecture.title}</h1>
          {currentLecture.description ? <p className="mt-2 text-sm text-slate-600">{currentLecture.description}</p> : null}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

          {isCurrentLocked ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This lecture is locked. Enroll in the course to access all lessons.
            </div>
          ) : (
            <div className="mt-5">
              {lectureType === "VIDEO" ? (
                <VideoPlayer
                  lectureId={currentLecture.id}
                  lectureTitle={currentLecture.title}
                  onComplete={() => {
                    if (course.id) void fetchProgress(course.id);
                  }}
                />
              ) : lectureType === "QUIZ" ? (
                currentLecture.assessmentId ? (
                  <div className="space-y-4">
                    <QuizPlayer
                      assessmentId={currentLecture.assessmentId}
                      canDownloadCertificate={false}
                      onResult={(result) => {
                        setQuizPassed(result.passed);
                        setQuizCertificateId(result.certificateId ?? null);
                        if (course.id) void fetchProgress(course.id);
                      }}
                    />
                    {quizPassed && showCertificateAction ? (
                      <button
                        type="button"
                        onClick={handleDownloadCertificate}
                        disabled={!quizCertificateId || isDownloadingCertificate}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDownloadingCertificate ? "Preparing PDF..." : "Download Certificate 🎓"}
                      </button>
                    ) : null}
                    {quizPassed && !showCertificateAction ? (
                      <div className="rounded border border-green-200 bg-green-50 p-4 text-center">
                        <p className="font-semibold text-green-700">🎉 Congratulations! Course Completed!</p>
                        <p className="mt-1 text-sm text-green-600">Your progress has been recorded.</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Quiz not configured for this lecture.</p>
                )
              ) : lectureType === "PDF" ? (
                <iframe
                  src={getFileUrl(currentLecture.pdfUrl ?? currentLecture.contentUrl) ?? ""}
                  title={currentLecture.title}
                  className="h-[70vh] w-full rounded-lg border border-slate-200"
                />
              ) : (
                <article
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLecture.contentHtml ?? "<p>No content available.</p>" }}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
