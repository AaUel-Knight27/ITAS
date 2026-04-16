"use client";

import axios from "axios";
import { Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import CourseBuilder from "@/components/admin/CourseBuilder";
import HelpButton from "@/components/help/HelpButton";
import HelpTooltip from "@/components/help/HelpTooltip";
import { useLanguage } from "@/context/LanguageContext";
import { CACHE_KEYS, courseCache } from "@/lib/courseCache";
import { getErrorMessage } from "@/lib/errors";
import { createSlugCandidate, normalizeSlugInput } from "@/lib/slug";
import {
  createCourse,
  getCourseCategories,
  publishCourse,
  uploadCourseThumbnail,
  updateCourse,
} from "@/lib/api/admin-courses";
import type { Category, Course, Lecture } from "@/types";

function isAllowedRole(role: string | null | undefined) {
  const normalized = (role ?? "").replace("ROLE_", "").toUpperCase();
  return normalized === "CONTENT_ADMIN";
}

export default function NewCoursePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>([
    "TAXPAYER",
    "TAX_AGENT",
    "MOR_STAFF",
    "MANAGER",
  ]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    difficulty: "BEGINNER",
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAllowedRole(session?.user?.role)) {
      router.replace("/dashboard");
      return;
    }

    let active = true;
    async function loadCategories() {
      try {
        const data = await getCourseCategories();
        if (!active) return;
        setCategories(data);
        if (!form.categoryId && data[0]) {
          setForm((prev) => ({ ...prev, categoryId: String(data[0].id) }));
        }
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setGeneralError(getErrorMessage(err));
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, [form.categoryId, router, session?.user?.role, status]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.slug) {
        return { ...prev, slug: normalizeSlugInput(prev.title || "") };
      }
      return prev;
    });
  }, [form.title]);

  const steps = [
    { id: 1, label: `${t("admin.step")} 1` },
    { id: 2, label: `${t("admin.step")} 2` },
    { id: 3, label: `${t("admin.step")} 3` },
  ] as const;

  const slugSuggestion = useMemo(() => {
    const source = form.title || form.slug || "";
    if (!normalizeSlugInput(source)) return "";
    return createSlugCandidate(source);
  }, [form.slug, form.title]);

  const summary = useMemo(() => {
    if (!course) {
      return {
        sections: 0,
        lectures: 0,
        video: 0,
        quiz: 0,
        checks: [false, false, false, false],
      };
    }
    const sections = course.sections ?? [];
    if (!sections || sections.length === 0) {
      return {
        sections: 0,
        lectures: 0,
        video: 0,
        quiz: 0,
        checks: [false, false, false, false],
      };
    }

    const lectures = (sections ?? [])
      .flatMap((section) => section.lectures ?? [])
      .filter((lecture): lecture is Lecture => lecture != null);
    const videoLectures = lectures.filter((lecture) => lecture != null && (lecture?.type ?? "VIDEO") === "VIDEO");
    const quizLectures = lectures.filter((lecture) => lecture != null && (lecture?.type ?? "VIDEO") === "QUIZ");

    const hasSection = sections.length > 0;
    const lectureEachSection = (sections ?? []).every(
      (section) => (section.lectures ?? []).filter((lecture) => lecture != null).length > 0
    );
    const allVideosUploaded = videoLectures.every(
      (lecture) => lecture != null && Boolean(lecture?.videoUrl ?? lecture?.contentUrl)
    );
    const allQuizzesConfigured = quizLectures.every(
      (lecture) => lecture != null && Boolean(lecture?.assessmentId) && (lecture?.quizQuestionCount ?? 0) > 0
    );

    return {
      sections: sections.length,
      lectures: lectures.length,
      video: videoLectures.length,
      quiz: quizLectures.length,
      checks: [hasSection, lectureEachSection, allVideosUploaded, allQuizzesConfigured],
    };
  }, [course]);

  const canPublish = summary.checks.every(Boolean);

  async function handleStep1Submit() {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId) {
      setGeneralError(t("admin.required_fields"));
      return;
    }
    if (targetAudience.length === 0) {
      setGeneralError(t("admin.target_audience_required"));
      return;
    }
    try {
      setIsSubmitting(true);
      setGeneralError(null);
      setSlugError("");
      const created = await createCourse({
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description,
        categoryId: Number(form.categoryId),
        difficulty: form.difficulty,
        targetAudience,
      });
      let nextCourse = { ...created, sections: created.sections ?? [] };

      if (thumbnailFile) {
        const uploaded = await uploadCourseThumbnail(created.id, thumbnailFile);
        if (uploaded.thumbnailUrl) {
          nextCourse = { ...nextCourse, thumbnailUrl: uploaded.thumbnailUrl };
        }
      }

      courseCache.invalidate(CACHE_KEYS.courses());
      setCourse(nextCourse);
      setStep(2);
    } catch (error) {
      const message = axios.isAxiosError(error) ? String(error.response?.data?.message ?? "") : "";

      if (message.toLowerCase().includes("slug already exists")) {
        setSlugError(t("admin.slug_taken"));
      } else {
        setGeneralError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!course) return;
    try {
      setIsPublishing(true);
      setPublishError(null);
      await publishCourse(course.id);
      courseCache.invalidate(CACHE_KEYS.courses());
      courseCache.invalidate(CACHE_KEYS.course(course.slug));
      router.push("/admin/courses");
    } catch (error) {
      const message = getErrorMessage(error) || t("admin.publish_failed");
      setPublishError(message);
      console.error("Publish error:", axios.isAxiosError(error) ? error.response?.data : error);
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveDraft() {
    if (!course) return;
    try {
      setIsSavingDraft(true);
      await updateCourse(course.id, {
        title: course.title,
        slug: course.slug,
        description: course.description ?? "",
        difficulty: course.difficulty,
        categoryId: course.categoryId ?? course.category?.id,
        thumbnailUrl: course.thumbnailUrl,
        targetAudience: course.targetAudience,
      });
      courseCache.invalidate(CACHE_KEYS.courses());
      courseCache.invalidate(CACHE_KEYS.course(course.slug));
      router.push("/admin/courses?status=draft");
    } catch (error) {
      setGeneralError(getErrorMessage(error));
    } finally {
      setIsSavingDraft(false);
    }
  }

  function handleRegenerateSlug() {
    setForm((prev) => ({ ...prev, slug: createSlugCandidate(prev.title || prev.slug || "") }));
    setSlugError("");
  }

  function handleThumbnailSelect(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setThumbnailError(t("admin.thumbnail_limit"));
      return;
    }
    setThumbnailError("");
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setThumbnailPreview(String(event.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleAudienceChange(value: string) {
    setTargetAudience((prev) =>
      prev.includes(value) ? prev.filter((role) => role !== value) : [...prev, value]
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t("admin.create_course")}</h1>
        <div className="mt-5 flex items-center gap-2">
          {steps.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= item.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {item.id}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
              {index < steps.length - 1 ? <span className="text-slate-400 dark:text-slate-600">-&gt;</span> : null}
            </div>
          ))}
        </div>

        {generalError ? <p className="mt-4 text-sm text-rose-600">{generalError}</p> : null}

        {step === 1 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                  <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("admin.course_title")}
                  <HelpTooltip pageId="course-builder" fieldId="title" />
                </span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.slug_required")}</span>
                <div className="flex items-start gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, slug: normalizeSlugInput(event.target.value) }));
                      setSlugError("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      slugError
                        ? "border-rose-400 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                        : "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t("admin.regenerate_slug")}
                  </button>
                </div>
                {slugError ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-rose-600">[!] {slugError}</p>
                    {slugSuggestion ? (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, slug: slugSuggestion }));
                          setSlugError("");
                        }}
                        className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {t("admin.try_slug")}: {slugSuggestion}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </label>

              <label className="block sm:col-span-2">
                  <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("admin.description")}
                  <HelpTooltip pageId="course-builder" fieldId="description" />
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.category")}</span>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.difficulty")}</span>
                <select
                  value={form.difficulty}
                  onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="BEGINNER">{t("courses.beginner")}</option>
                  <option value="INTERMEDIATE">{t("courses.intermediate")}</option>
                  <option value="ADVANCED">{t("courses.advanced")}</option>
                </select>
              </label>

              <div className="block sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("admin.target_audience")}
                  <HelpTooltip pageId="course-builder" fieldId="targetAudience" />
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("admin.select_course_visibility")}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "TAXPAYER", label: t("admin.audience.taxpayer") },
                    { value: "TAX_AGENT", label: t("admin.audience.tax_agent") },
                    { value: "MOR_STAFF", label: t("admin.audience.mor_staff") },
                    { value: "MANAGER", label: t("admin.audience.manager") },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={targetAudience.includes(option.value)}
                        onChange={() => handleAudienceChange(option.value)}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.thumbnail")}</span>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    handleThumbnailSelect(file);
                  }}
                  className="hidden"
                />
                {!thumbnailPreview ? (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <Camera className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.upload_thumbnail")}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t("admin.thumbnail_formats")}</p>
                  </button>
                ) : (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailPreview} alt={t("admin.thumbnail_preview")} className="h-40 w-64 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview("");
                        setThumbnailError("");
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white p-1 text-slate-700 shadow dark:bg-slate-900 dark:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {thumbnailError ? <p className="mt-1 text-sm text-rose-600">{thumbnailError}</p> : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleStep1Submit()}
              disabled={isSubmitting}
              className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isSubmitting ? t("admin.saving") : t("admin.save_continue")}
            </button>
          </div>
        ) : null}

        {step === 2 && course ? (
          <div className="mt-6 space-y-4">
            <CourseBuilder course={course} onCourseChange={setCourse} />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("admin.back")}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {t("admin.continue_review")}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && course ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("admin.review_publish")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.course")}: {course.title}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.category")}: {course.category?.name ?? t("common.not_available")}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.difficulty")}: {course.difficulty}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.total_sections")}: {summary.sections}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.total_lectures")}: {summary.lectures}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.total_video_lectures")}: {summary.video}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t("admin.summary.total_quiz_lectures")}: {summary.quiz}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("admin.publish_checklist")}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className={summary.checks[0] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[0] ? t("admin.check.ok") : t("admin.check.missing")} {t("admin.check.section")}
                </li>
                <li className={summary.checks[1] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[1] ? t("admin.check.ok") : t("admin.check.missing")} {t("admin.check.lecture_per_section")}
                </li>
                <li className={summary.checks[2] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[2] ? t("admin.check.ok") : t("admin.check.missing")} {t("admin.check.video_uploaded")}
                </li>
                <li className={summary.checks[3] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[3] ? t("admin.check.ok") : t("admin.check.missing")} {t("admin.check.quiz_questions")}
                </li>
              </ul>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={!canPublish || isPublishing}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPublishing ? t("admin.publishing") : t("admin.publish_course")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveDraft()}
                  disabled={isSavingDraft}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isSavingDraft ? t("admin.saving") : t("admin.save_draft")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("admin.back_builder")}
                </button>
              </div>
              {publishError ? (
                <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  [!] {publishError}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
      <HelpButton pageId="course-builder" />
    </main>
  );
}
