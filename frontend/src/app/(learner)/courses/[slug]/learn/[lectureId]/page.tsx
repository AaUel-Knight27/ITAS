"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { VideoPlayerHandle } from "@/components/player/VideoPlayer";
import api, { progressApi } from "@/lib/api";
import { getCourseBySlug } from "@/lib/api/courses";
import { canAccessCourses } from "@/lib/roles";
import { getFileUrl } from "@/lib/utils";
import type { Course, CourseSection, Lecture, VideoProgress } from "@/types";

const VideoPlayer = dynamic(() => import("@/components/player/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-xs text-gray-500">Loading player...</p>
      </div>
    </div>
  ),
});

const PdfViewer = dynamic(() => import("@/components/player/PdfViewer"), { ssr: false });
const ArticleReader = dynamic(() => import("@/components/player/ArticleReader"), { ssr: false });
const QuizPlayer = dynamic(() => import("@/components/player/QuizPlayer"), { ssr: false });

type ProgressEntry = {
  percentage: number;
  lastPosition: number;
  lastWatchedAt: string | null;
  updatedAt?: string;
};

type ProgressMap = Record<string, ProgressEntry>;

type LocalProgressMap = Record<
  string,
  {
    lastPosition: number;
    lastWatchedAt: string | null;
  }
>;

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

function formatTimestamp(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getLocalProgressKey(courseId: string | number) {
  return `video_progress_local_${courseId}`;
}

export default function LearnLecturePage() {
  const params = useParams<{ slug: string; lectureId: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const slug = params?.slug ?? "";
  const lectureIdParam = params?.lectureId ?? "";
  const role = session?.user?.role ?? "";
  const canLearn = canAccessCourses(role);

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"video" | "notes">("video");
  const [notes, setNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoPlayLectureId, setAutoPlayLectureId] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lectureSwitchTimeoutRef = useRef<number | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const selectingLectureRef = useRef(false);

  const sections = useMemo(() => byOrder(course?.sections ?? []), [course?.sections]);
  const allLectures = useMemo(() => flattenLectures(sections), [sections]);

  const activeLectureKey = String(activeLecture?.id ?? "");
  const currentProgress = activeLecture ? progressMap[activeLectureKey] : undefined;
  const resumeAt = currentProgress?.lastPosition ?? 0;
  const isCompleted = activeLecture ? completedIds.has(activeLectureKey) : false;

  const activeLectureIndex = activeLecture
    ? allLectures.findIndex((lecture) => String(lecture.id) === String(activeLecture.id))
    : -1;
  const prevLecture = activeLectureIndex > 0 ? allLectures[activeLectureIndex - 1] : null;
  const nextLecture =
    activeLectureIndex >= 0 && activeLectureIndex < allLectures.length - 1 ? allLectures[activeLectureIndex + 1] : null;

  const totalLectures = allLectures.length;
  const completedCount = completedIds.size;
  const courseProgressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const updateProgressEntry = useCallback((lectureId: string, patch: Partial<ProgressEntry>) => {
    setProgressMap((previous) => ({
      ...previous,
      [lectureId]: {
        percentage: previous[lectureId]?.percentage ?? 0,
        lastPosition: previous[lectureId]?.lastPosition ?? 0,
        lastWatchedAt: previous[lectureId]?.lastWatchedAt ?? null,
        updatedAt: previous[lectureId]?.updatedAt,
        ...patch,
      },
    }));
  }, []);

  const persistLocalProgress = useCallback(
    (lectureId: string, currentTime: number) => {
      if (!course || currentTime <= 0) {
        return;
      }

      const key = getLocalProgressKey(course.id);
      const existing = window.localStorage.getItem(key);
      const parsed: LocalProgressMap = existing ? JSON.parse(existing) : {};
      parsed[lectureId] = {
        lastPosition: Math.round(currentTime),
        lastWatchedAt: formatTimestamp(currentTime),
      };
      window.localStorage.setItem(key, JSON.stringify(parsed));
    },
    [course]
  );

  const selectLecture = useCallback(
    (lecture: Lecture) => {
      if (activeLecture) {
        persistLocalProgress(String(activeLecture.id), playerRef.current?.getCurrentTime() ?? 0);
      }
      if (lectureSwitchTimeoutRef.current) {
        clearTimeout(lectureSwitchTimeoutRef.current);
        lectureSwitchTimeoutRef.current = null;
      }
      stopCountdown();
      setAutoPlayLectureId(null);
      selectingLectureRef.current = true;
      setActiveLecture(null);
      lectureSwitchTimeoutRef.current = window.setTimeout(() => {
        setActiveLecture(lecture);
        setActiveTab("video");
        router.push(`/courses/${slug}/learn/${lecture.id}`);
        selectingLectureRef.current = false;
        lectureSwitchTimeoutRef.current = null;
        document.getElementById(`lecture-${lecture.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    },
    [activeLecture, persistLocalProgress, router, slug, stopCountdown]
  );

  const startCountdown = useCallback(
    (targetLecture: Lecture) => {
      stopCountdown();
      setCountdown(5);
      let secondsLeft = 5;
      countdownRef.current = setInterval(() => {
        secondsLeft -= 1;
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          stopCountdown();
          setAutoPlayLectureId(String(targetLecture.id));
          selectLecture(targetLecture);
        }
      }, 1000);
    },
    [selectLecture, stopCountdown]
  );

  const fetchCourse = useCallback(async () => {
    if (!slug) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const courseData = await getCourseBySlug(slug);
      setCourse(courseData);

      const lectures = flattenLectures(courseData.sections ?? []);
      const progressResults = await Promise.allSettled(
        lectures.map(async (lecture) => {
          const response = await progressApi.get(Number(lecture.id));
          return response.data as VideoProgress;
        })
      );

      const nextProgressMap: ProgressMap = {};
      progressResults.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          return;
        }
        const lecture = lectures[index];
        const progress = result.value;
        nextProgressMap[String(lecture.id)] = {
          percentage: Number(progress.completionPercentage ?? 0),
          lastPosition: Number(progress.lastPosition ?? 0),
          lastWatchedAt: progress.lastWatchedAtDisplay ?? null,
          updatedAt: progress.updatedAt,
        };
      });

      const localProgressRaw = window.localStorage.getItem(getLocalProgressKey(courseData.id));
      const localProgress: LocalProgressMap = localProgressRaw ? JSON.parse(localProgressRaw) : {};
      Object.entries(localProgress).forEach(([lectureId, entry]) => {
        const existing = nextProgressMap[lectureId];
        if (!existing || entry.lastPosition > existing.lastPosition) {
          nextProgressMap[lectureId] = {
            percentage: existing?.percentage ?? 0,
            lastPosition: entry.lastPosition,
            lastWatchedAt: entry.lastWatchedAt,
            updatedAt: existing?.updatedAt,
          };
        }
      });
      setProgressMap(nextProgressMap);

      try {
        const completionResponse = await api.get<Array<{ lectureId: number | string }>>(
          `/lms/my-completions/${courseData.id}`
        );
        setCompletedIds(new Set((completionResponse.data ?? []).map((item) => String(item.lectureId))));
      } catch {
        setCompletedIds(new Set());
      }

      const savedNotes = window.localStorage.getItem(`course_notes_${courseData.id}`);
      setNotes(savedNotes ?? "");

      const requestedLecture = lectures.find((lecture) => String(lecture.id) === lectureIdParam) ?? null;
      const lastWatchedResponse = await progressApi
        .getLastWatched(Number(courseData.id))
        .catch((requestError) => (requestError?.response?.status === 204 ? null : Promise.reject(requestError)));

      const targetLecture =
        requestedLecture ??
        lectures.find((lecture) => String(lecture.id) === String(lastWatchedResponse?.data?.lectureId ?? "")) ??
        lectures[0] ??
        null;

      if (!targetLecture) {
        setError("This course does not have any lectures yet.");
        return;
      }

      setActiveLecture(targetLecture);
    } catch {
      setError("Could not load this learning page. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lectureIdParam, slug]);

  useEffect(() => {
    if (status === "authenticated" && !canLearn) {
      router.replace("/dashboard");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    void fetchCourse();
  }, [canLearn, fetchCourse, router, status]);

  useEffect(() => {
    if (!activeLecture || selectingLectureRef.current) {
      return;
    }
    const matchedLecture = allLectures.find((lecture) => String(lecture.id) === lectureIdParam);
    if (matchedLecture && String(matchedLecture.id) !== String(activeLecture.id)) {
      setActiveLecture(matchedLecture);
    }
  }, [activeLecture, allLectures, lectureIdParam]);

  useEffect(() => {
    return () => {
      if (lectureSwitchTimeoutRef.current) {
        clearTimeout(lectureSwitchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "ArrowRight" && nextLecture) {
        event.preventDefault();
        selectLecture(nextLecture);
      }

      if (event.key === "ArrowLeft" && prevLecture) {
        event.preventDefault();
        selectLecture(prevLecture);
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextLecture, prevLecture, selectLecture]);

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  useEffect(() => {
    if (!activeLecture || !course || normalizeLectureType(activeLecture.type) !== "VIDEO") {
      return;
    }

    const saveCurrentPosition = () => {
      persistLocalProgress(String(activeLecture.id), playerRef.current?.getCurrentTime() ?? 0);
    };

    const intervalId = window.setInterval(saveCurrentPosition, 1000);
    window.addEventListener("beforeunload", saveCurrentPosition);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentPosition();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", saveCurrentPosition);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      saveCurrentPosition();
    };
  }, [activeLecture, course, persistLocalProgress]);

  const handleMarkComplete = useCallback(async () => {
    if (!activeLecture || completing || completedIds.has(String(activeLecture.id))) {
      return;
    }

    setCompleting(true);
    try {
      await api.post(`/lms/lesson/${activeLecture.id}/complete`);
      setCompletedIds((previous) => {
        const next = new Set(previous);
        next.add(String(activeLecture.id));
        return next;
      });
      if (nextLecture) {
        startCountdown(nextLecture);
      }
    } catch {
      // Keep the learning flow usable even if completion sync fails.
    } finally {
      setCompleting(false);
    }
  }, [activeLecture, completedIds, completing, nextLecture, startCountdown]);

  const handleVideoProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!activeLecture) {
        return;
      }

      const lectureKey = String(activeLecture.id);
      const percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
      const roundedTime = Math.round(currentTime);

      updateProgressEntry(lectureKey, {
        percentage,
        lastPosition: roundedTime,
        lastWatchedAt: roundedTime > 0 ? formatTimestamp(roundedTime) : null,
        updatedAt: new Date().toISOString(),
      });

      try {
        await progressApi.save(Number(activeLecture.id), {
          watchedSeconds: roundedTime,
          completionPercentage: percentage,
          lastPosition: roundedTime,
        });
      } catch {
        // Silent autosave failure.
      }

      if (percentage >= 90 && !completedIds.has(lectureKey)) {
        await handleMarkComplete();
      }
    },
    [activeLecture, completedIds, handleMarkComplete, updateProgressEntry]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (course) {
        window.localStorage.setItem(`course_notes_${course.id}`, value);
      }
    },
    [course]
  );

  const insertTimestamp = useCallback(() => {
    const currentTime = Math.round(playerRef.current?.getCurrentTime() ?? 0);
    const stamp = `[${formatTimestamp(currentTime)}] `;
    setActiveTab("notes");

    setNotes((previous) => {
      const textarea = notesRef.current;
      const start = textarea?.selectionStart ?? previous.length;
      const end = textarea?.selectionEnd ?? previous.length;
      const nextValue = `${previous.slice(0, start)}${stamp}${previous.slice(end)}`;

      window.requestAnimationFrame(() => {
        const nextCursor = start + stamp.length;
        textarea?.focus();
        textarea?.setSelectionRange(nextCursor, nextCursor);
      });

      if (course) {
        window.localStorage.setItem(`course_notes_${course.id}`, nextValue);
      }

      return nextValue;
    });
  }, [course]);

  const continueWatching = useCallback(() => {
    if (!resumeAt) {
      return;
    }
    playerRef.current?.seekTo(resumeAt);
    playerRef.current?.play();
  }, [resumeAt]);

  const getSectionProgress = useCallback(
    (section: CourseSection) => {
      const lectures = section.lectures ?? [];
      if (lectures.length === 0) {
        return 0;
      }
      const done = lectures.filter((lecture) => completedIds.has(String(lecture.id))).length;
      return Math.round((done / lectures.length) * 100);
    },
    [completedIds]
  );

  if (status === "authenticated" && !canLearn) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-lg font-semibold text-white">{error || "Course not found."}</p>
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

  if (!activeLecture) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
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
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-400">
                {completedCount}/{totalLectures} lessons
              </span>
              <span className="font-medium text-blue-400">{courseProgressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-700">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${courseProgressPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">You're {courseProgressPct}% done 🎯</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="sticky top-0 z-10 bg-gray-800/90 px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-gray-400">{section.title}</p>
                  <span className="ml-2 text-xs text-gray-500">{getSectionProgress(section)}%</span>
                </div>
                <div className="mt-1 h-0.5 w-full rounded-full bg-gray-700">
                  <div
                    className="h-0.5 rounded-full bg-green-500 transition-all"
                    style={{ width: `${getSectionProgress(section)}%` }}
                  />
                </div>
              </div>

              {byOrder(section.lectures ?? []).map((lecture) => {
                const lectureKey = String(lecture.id);
                const isActive = lectureKey === String(activeLecture.id);
                const isDone = completedIds.has(lectureKey);
                const progress = progressMap[lectureKey];

                return (
                  <button
                    key={lecture.id}
                    id={`lecture-${lecture.id}`}
                    type="button"
                    onClick={() => selectLecture(lecture)}
                    className={`group flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-all ${
                      isActive ? "border-l-blue-500 bg-blue-900/30" : "border-l-transparent hover:bg-gray-800/50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-300 group-hover:bg-gray-600"
                      }`}
                    >
                      {isDone ? "OK" : getLectureIcon(lecture.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`line-clamp-2 text-sm ${
                          isActive ? "font-medium text-white" : isDone ? "text-gray-400" : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {lecture.title}
                      </p>

                      {progress?.lastWatchedAt && !isDone ? (
                        <p className="mt-0.5 text-xs text-blue-400">Last watched at {progress.lastWatchedAt}</p>
                      ) : null}

                      {progress && progress.percentage > 0 && !isDone ? (
                        <div className="mt-1.5 h-0.5 w-full rounded-full bg-gray-700">
                          <div className="h-0.5 rounded-full bg-blue-400" style={{ width: `${progress.percentage}%` }} />
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((previous) => !previous)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Toggle sidebar (B)"
            >
              Menu
            </button>

            <div>
              <p className="text-sm font-medium text-white">{activeLecture.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{lectureType}</span>
                {currentProgress?.lastWatchedAt && !isCompleted ? (
                  <span className="text-xs text-blue-400">Last watched at {currentProgress.lastWatchedAt}</span>
                ) : null}
                {isCompleted ? <span className="text-xs text-green-400">Completed</span> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resumeAt > 0 && lectureType === "VIDEO" && !isCompleted ? (
              <button
                type="button"
                onClick={continueWatching}
                className="rounded-lg border border-blue-700 bg-blue-900/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-900/50"
              >
                Continue where you left off ({formatTimestamp(resumeAt)})
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => prevLecture && selectLecture(prevLecture)}
              disabled={!prevLecture}
              title="Previous lesson (←)"
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>

            {!isCompleted ? (
              <button
                type="button"
                onClick={() => void handleMarkComplete()}
                disabled={completing}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? "..." : "✓ Complete"}
              </button>
            ) : null}

            {lectureType === "VIDEO" ? (
              <button
                type="button"
                onClick={insertTimestamp}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
              >
                📝 Note
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => nextLecture && selectLecture(nextLecture)}
              disabled={!nextLecture}
              title="Next lesson (→)"
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`flex flex-col overflow-hidden transition-all duration-300 ${
              lectureType === "VIDEO" && activeTab === "notes" ? "w-1/2" : "flex-1"
            }`}
          >
            {lectureType === "VIDEO" ? (
              <div className="flex shrink-0 gap-1 border-b border-gray-800 bg-gray-900 px-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("video")}
                  className={`border-b-2 px-4 py-2.5 text-xs font-medium ${
                    activeTab === "video" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={`border-b-2 px-4 py-2.5 text-xs font-medium ${
                    activeTab === "notes" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab((previous) => (previous === "notes" ? "video" : "notes"))}
                  className="ml-auto px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
                >
                  ⊞ Split
                </button>
              </div>
            ) : null}

              <div className="flex-1 overflow-y-auto bg-gray-950">
                {lectureType === "VIDEO" ? (
                  <div>
                    {!activeLecture ? (
                      <div className="flex aspect-video w-full items-center justify-center bg-gray-900">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    ) : activeLecture.videoUrl || activeLecture.contentUrl ? (
                      <VideoPlayer
                        key={`video-${activeLecture.id}`}
                        ref={playerRef}
                        src={getFileUrl(activeLecture.videoUrl ?? activeLecture.contentUrl) ?? ""}
                        lectureId={Number(activeLecture.id)}
                        resumeAt={resumeAt}
                        autoPlay={autoPlayLectureId === String(activeLecture.id)}
                        onProgress={(currentTime, duration) => void handleVideoProgress(currentTime, duration)}
                        onEnded={() => void handleMarkComplete()}
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-gray-900">
                        <div className="text-center text-gray-500">
                          <p className="mb-2 text-4xl">Video</p>
                          <p className="text-sm">No video uploaded</p>
                        </div>
                      </div>
                    )}

                    {activeLecture?.description ? (
                      <div className="mx-auto max-w-4xl p-6">
                        <h3 className="mb-2 text-sm font-semibold text-white">About this lesson</h3>
                        <p className="text-sm leading-relaxed text-gray-400">{activeLecture.description}</p>
                      </div>
                    ) : null}
                </div>
              ) : null}

              {lectureType === "PDF" ? (
                <PdfViewer
                  url={getFileUrl(activeLecture.pdfUrl ?? activeLecture.contentUrl) ?? ""}
                  title={activeLecture.title}
                  onComplete={() => void handleMarkComplete()}
                />
              ) : null}

              {lectureType === "TEXT" ? (
                <ArticleReader
                  title={activeLecture.title}
                  content={activeLecture.contentHtml ?? activeLecture.content ?? ""}
                  onComplete={() => void handleMarkComplete()}
                />
              ) : null}

              {lectureType === "QUIZ" ? (
                <QuizPlayer
                  courseId={Number(course.id)}
                  lectureId={Number(activeLecture.id)}
                  onComplete={() => void handleMarkComplete()}
                />
              ) : null}
            </div>
          </div>

          {lectureType === "VIDEO" && activeTab === "notes" ? (
            <div className="flex w-1/2 flex-col border-l border-gray-800 bg-gray-900">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-4 py-3">
                <p className="text-sm font-medium text-white">📝 My Notes</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={insertTimestamp}
                    className="rounded-lg border border-blue-800 px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/30"
                  >
                    + Timestamp
                  </button>
                  <span className="text-xs text-gray-600">Auto-saved</span>
                </div>
              </div>
              <textarea
                ref={notesRef}
                value={notes}
                onChange={(event) => handleNotesChange(event.target.value)}
                placeholder={"Take notes here...\n\nClick \"+ Timestamp\" to insert the current video time."}
                className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-gray-300 focus:outline-none"
              />
            </div>
          ) : null}
        </div>

        {countdown !== null && nextLecture ? (
          <div className="absolute bottom-6 right-6 z-50 min-w-[280px] rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-xl">
            <p className="mb-1 text-sm font-medium text-white">Next lesson in {countdown}s</p>
            <p className="mb-3 line-clamp-1 text-xs text-gray-400">{nextLecture.title}</p>
            <div className="mb-3 h-1 w-full rounded-full bg-gray-700">
              <div
                className="h-1 rounded-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  stopCountdown();
                  setAutoPlayLectureId(String(nextLecture.id));
                  selectLecture(nextLecture);
                }}
                className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Play Now
              </button>
              <button
                type="button"
                onClick={stopCountdown}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 select-none text-xs text-gray-700">
          ← → navigate lessons · B toggle sidebar
        </div>
      </main>
    </div>
  );
}
