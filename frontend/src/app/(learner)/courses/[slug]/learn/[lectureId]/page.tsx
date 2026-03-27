"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import ArticleReader from "@/components/player/ArticleReader";
import PdfViewer from "@/components/player/PdfViewer";
import QuizPlayer from "@/components/player/QuizPlayer";
import VideoPlayer from "@/components/player/VideoPlayer";
import { getCourseBySlug } from "@/lib/api/courses";
import { getCourseProgress } from "@/lib/api/enrollment";
import api from "@/lib/api";
import { getCourseLearnHref } from "@/lib/learn";
import { canAccessCourses } from "@/lib/roles";
import { getFileUrl } from "@/lib/utils";
import type { Course, CourseSection, Lecture } from "@/types";

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function flattenLectures(sections: CourseSection[]) {
  return byOrder(sections).flatMap((section) => byOrder(section.lectures ?? []));
}

function normalizeLectureType(value: string | undefined) {
  return (value ?? "VIDEO").toUpperCase();
}

function getLectureIcon(type: string | undefined) {
  switch (normalizeLectureType(type)) {
    case "VIDEO":
      return "VID";
    case "PDF":
      return "PDF";
    case "TEXT":
      return "TXT";
    case "QUIZ":
      return "QZ";
    default:
      return "L";
  }
}

export default function LearnLecturePage() {
  const params = useParams<{ slug: string; lectureId: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const slug = params?.slug ?? "";
  const lectureId = params?.lectureId ?? "";
  const role = session?.user?.role ?? "";
  const canLearn = canAccessCourses(role);

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [resumePositions, setResumePositions] = useState<Record<string, number>>({});

  const sections = useMemo(() => byOrder(course?.sections ?? []), [course?.sections]);
  const allLectures = useMemo(() => flattenLectures(sections), [sections]);

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
        setError("");

        const courseData = await getCourseBySlug(slug);
        if (!active) return;

        setCourse(courseData);

        const orderedLectures = flattenLectures(courseData.sections ?? []);
        let targetLecture = orderedLectures.find((lecture) => String(lecture.id) === lectureId) ?? null;

        if (courseData.enrolled) {
          try {
            const progress = await getCourseProgress(courseData.id);
            if (!active) return;

            if (!targetLecture) {
              targetLecture =
                orderedLectures.find((lecture) => String(lecture.id) === String(progress.lastLectureId ?? "")) ?? null;
            }
            setCompletedIds(new Set((progress.completedLectureIds ?? []).map((id) => String(id))));
            setProgressMap(
              Object.fromEntries(
                (progress.videoProgress ?? []).map((item) => [
                  String(item.lectureId),
                  Math.max(0, Math.min(100, Number(item.completed ? 100 : 0))),
                ])
              )
            );
            setResumePositions(
              Object.fromEntries(
                (progress.videoProgress ?? []).map((item) => [String(item.lectureId), Number(item.lastPosition ?? 0)])
              )
            );
          } catch {
            // Progress improves routing, but the lesson can still render without it.
          }
        }

        if (courseData.enrolled) {
          try {
            const completionResponse = await api.get<Array<{ lectureId: number | string }>>(
              `/lms/my-completions/${courseData.id}`
            );
            if (!active) return;
            setCompletedIds(new Set((completionResponse.data ?? []).map((item) => String(item.lectureId))));
          } catch {
            // Completion state is non-blocking.
          }
        }

        if (!targetLecture) {
          targetLecture = orderedLectures[0] ?? null;
        }

        if (!targetLecture) {
          setError("This course does not have any lectures yet.");
          return;
        }

        setActiveLecture(targetLecture);

        if (String(targetLecture.id) !== lectureId) {
          router.replace(getCourseLearnHref(courseData.slug, targetLecture.id));
        }
      } catch {
        if (!active) return;
        setError("Could not load this learning page. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [canLearn, lectureId, router, slug, status]);

  useEffect(() => {
    if (!course) return;
    const nextLecture = allLectures.find((lecture) => String(lecture.id) === lectureId) ?? null;
    if (nextLecture) {
      setActiveLecture(nextLecture);
    }
  }, [allLectures, course, lectureId]);

  const activeLectureIndex = activeLecture
    ? allLectures.findIndex((lecture) => String(lecture.id) === String(activeLecture.id))
    : -1;
  const prevLecture = activeLectureIndex > 0 ? allLectures[activeLectureIndex - 1] : null;
  const nextLecture =
    activeLectureIndex >= 0 && activeLectureIndex < allLectures.length - 1 ? allLectures[activeLectureIndex + 1] : null;

  const totalLectures = allLectures.length;
  const completedCount = completedIds.size;
  const progressPercent = totalLectures === 0 ? 0 : Math.round((completedCount / totalLectures) * 100);
  const isCompleted = activeLecture ? completedIds.has(String(activeLecture.id)) : false;

  const markLectureCompleteInState = useCallback((targetLectureId: number | string) => {
    setCompletedIds((previous) => {
      const next = new Set(previous);
      next.add(String(targetLectureId));
      return next;
    });
  }, []);

  const handleLectureSelect = useCallback(
    (lecture: Lecture) => {
      setActiveLecture(lecture);
      router.push(getCourseLearnHref(slug, lecture.id));
    },
    [router, slug]
  );

  const handleMarkComplete = useCallback(async () => {
    if (!activeLecture || completing) return;
    if (completedIds.has(String(activeLecture.id))) return;

    try {
      setCompleting(true);
      await api.post(`/lms/lesson/${activeLecture.id}/complete`);
      markLectureCompleteInState(activeLecture.id);

      if (nextLecture) {
        window.setTimeout(() => {
          handleLectureSelect(nextLecture);
        }, 1000);
      }
    } catch {
      // Ignore transient completion issues so the lesson stays usable.
    } finally {
      setCompleting(false);
    }
  }, [activeLecture, completedIds, completing, handleLectureSelect, markLectureCompleteInState, nextLecture]);

  const handleVideoProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!activeLecture || !course) return;

      const pct = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
      const lectureKey = String(activeLecture.id);

      setProgressMap((previous) => ({
        ...previous,
        [lectureKey]: pct,
      }));

      setResumePositions((previous) => ({
        ...previous,
        [lectureKey]: Math.round(currentTime),
      }));

      try {
        await api.post(`/lms/video/${activeLecture.id}/progress`, {
          watchedSeconds: Math.round(currentTime),
          completionPercentage: pct,
          lastPosition: Math.round(currentTime),
        });

        if (pct >= 90 && !completedIds.has(lectureKey)) {
          await handleMarkComplete();
        }
      } catch {
        // Progress save failure is not critical.
      }
    },
    [activeLecture, completedIds, course, handleMarkComplete]
  );

  if (status === "authenticated" && !canLearn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-lg font-semibold text-white">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/courses")}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course || !activeLecture) {
    return null;
  }

  const lectureType = normalizeLectureType(activeLecture.type);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <aside
        className={`shrink-0 overflow-hidden border-r border-gray-800 bg-gray-900 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0"
        }`}
      >
        <div className="border-b border-gray-800 px-4 py-4">
          <button
            type="button"
            onClick={() => router.push(`/courses/${slug}`)}
            className="mb-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
          >
            Back to course
          </button>
          <h2 className="line-clamp-2 text-sm font-semibold text-white">{course.title}</h2>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>
                {completedCount}/{totalLectures} completed
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-700">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="bg-gray-800/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </div>

              {byOrder(section.lectures ?? []).map((lecture) => {
                const isActive = String(activeLecture.id) === String(lecture.id);
                const done = completedIds.has(String(lecture.id));

                return (
                  <button
                    key={lecture.id}
                    type="button"
                    onClick={() => handleLectureSelect(lecture)}
                    className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                      isActive ? "border-l-blue-500 bg-blue-900/30" : "border-l-transparent hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                        done ? "bg-green-500 text-white" : isActive ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {done ? "OK" : getLectureIcon(lecture.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`line-clamp-2 text-sm ${
                          isActive ? "font-medium text-white" : done ? "text-gray-400" : "text-gray-300"
                        }`}
                      >
                        {lecture.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{normalizeLectureType(lecture.type)}</span>
                        {lecture.durationSeconds ? (
                          <span className="text-xs text-gray-500">· {Math.round(lecture.durationSeconds / 60)}m</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((previous) => !previous)}
              className="rounded p-1 text-gray-400 hover:text-white"
            >
              Menu
            </button>

            <div>
              <p className="text-sm font-medium text-white">{activeLecture.title}</p>
              <p className="text-xs text-gray-500">{normalizeLectureType(activeLecture.type)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevLecture && handleLectureSelect(prevLecture)}
              disabled={!prevLecture}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>

            {!isCompleted ? (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={completing}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? "Saving..." : "Mark Complete"}
              </button>
            ) : (
              <span className="rounded-lg border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs text-green-400">
                Completed
              </span>
            )}

            <button
              type="button"
              onClick={() => nextLecture && handleLectureSelect(nextLecture)}
              disabled={!nextLecture}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-950">
          {lectureType === "VIDEO" ? (
            <div className="h-full p-6">
              <div className="mx-auto max-w-5xl">
                <VideoPlayer
                  src={getFileUrl(activeLecture.videoUrl ?? activeLecture.contentUrl) ?? ""}
                  lectureId={activeLecture.id}
                  lectureTitle={activeLecture.title}
                  onProgress={handleVideoProgress}
                  resumeAt={resumePositions[String(activeLecture.id)] ?? 0}
                />

                {activeLecture.description ? (
                  <div className="mt-6">
                    <h3 className="mb-2 font-semibold text-white">About this lecture</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{activeLecture.description}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {lectureType === "PDF" ? (
            <PdfViewer
              url={getFileUrl(activeLecture.pdfUrl ?? activeLecture.contentUrl) ?? ""}
              title={activeLecture.title}
              onComplete={handleMarkComplete}
            />
          ) : null}

          {lectureType === "TEXT" ? (
            <ArticleReader
              title={activeLecture.title}
              content={activeLecture.contentHtml ?? activeLecture.content ?? ""}
              onComplete={handleMarkComplete}
            />
          ) : null}

          {lectureType === "QUIZ" ? (
            <QuizPlayer courseId={Number(course.id)} lectureId={Number(activeLecture.id)} onComplete={handleMarkComplete} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
