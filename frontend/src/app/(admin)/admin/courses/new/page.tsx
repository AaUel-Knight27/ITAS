"use client";

import axios from "axios";
import { Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import CourseBuilder from "@/components/admin/CourseBuilder";
import HelpButton from "@/components/help/HelpButton";
import HelpTooltip from "@/components/help/HelpTooltip";
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
  return normalized === "CONTENT_ADMIN" || normalized === "SYSTEM_ADMIN";
}

export default function NewCoursePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
    { id: 1, label: "Step 1" },
    { id: 2, label: "Step 2" },
    { id: 3, label: "Step 3" },
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
      setGeneralError("Please complete required fields.");
      return;
    }
    if (targetAudience.length === 0) {
      setGeneralError("Please select at least one target audience.");
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

      setCourse(nextCourse);
      setStep(2);
    } catch (error) {
      const message = axios.isAxiosError(error) ? String(error.response?.data?.message ?? "") : "";

      if (message.toLowerCase().includes("slug already exists")) {
        setSlugError("This slug is already taken. Please choose a different one.");
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
      router.push("/admin/courses");
    } catch (error) {
      const message = getErrorMessage(error) || "Could not publish course. Please try again.";
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
        description: course.description ?? "",
        difficulty: course.difficulty,
        categoryId: course.categoryId ?? course.category?.id,
        thumbnailUrl: course.thumbnailUrl,
        targetAudience: course.targetAudience,
      });
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
      setThumbnailError("Thumbnail must be under 5MB");
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
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-slate-900">Create New Course</h1>
        <div className="mt-5 flex items-center gap-2">
          {steps.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= item.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.id}
              </div>
              <span className="text-sm text-slate-700">{item.label}</span>
              {index < steps.length - 1 ? <span className="text-slate-400">-&gt;</span> : null}
            </div>
          ))}
        </div>

        {generalError ? <p className="mt-4 text-sm text-rose-600">{generalError}</p> : null}

        {step === 1 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  Course Title
                  <HelpTooltip pageId="course-builder" fieldId="title" />
                </span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Slug *</span>
                <div className="flex items-start gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, slug: normalizeSlugInput(event.target.value) }));
                      setSlugError("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      slugError ? "border-rose-400" : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Regenerate Slug
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
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Try: {slugSuggestion}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  Description
                  <HelpTooltip pageId="course-builder" fieldId="description" />
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </label>

              <div className="block sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  Target Audience
                  <HelpTooltip pageId="course-builder" fieldId="targetAudience" />
                </span>
                <p className="text-xs text-slate-500">Select who can see this course</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "TAXPAYER", label: "Taxpayers" },
                    { value: "TAX_AGENT", label: "Tax Agents" },
                    { value: "MOR_STAFF", label: "MoR Staff" },
                    { value: "MANAGER", label: "Managers" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
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
                <span className="mb-1 block text-sm font-medium text-slate-700">Thumbnail</span>
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
                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center hover:bg-slate-50"
                  >
                    <Camera className="h-6 w-6 text-slate-500" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Click to upload thumbnail</p>
                    <p className="text-xs text-slate-500">JPG, PNG, WEBP up to 5MB</p>
                  </button>
                ) : (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="h-40 w-64 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview("");
                        setThumbnailError("");
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white p-1 text-slate-700 shadow"
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
              className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save & Continue"}
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
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Continue to Review
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && course ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Review & Publish</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-slate-700">Course: {course.title}</p>
                <p className="text-sm text-slate-700">Category: {course.category?.name ?? "N/A"}</p>
                <p className="text-sm text-slate-700">Difficulty: {course.difficulty}</p>
                <p className="text-sm text-slate-700">Total sections: {summary.sections}</p>
                <p className="text-sm text-slate-700">Total lectures: {summary.lectures}</p>
                <p className="text-sm text-slate-700">Total video lectures: {summary.video}</p>
                <p className="text-sm text-slate-700">Total quiz lectures: {summary.quiz}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Publishing Checklist</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className={summary.checks[0] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[0] ? "[OK]" : "[MISSING]"} At least 1 section
                </li>
                <li className={summary.checks[1] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[1] ? "[OK]" : "[MISSING]"} At least 1 lecture in every section
                </li>
                <li className={summary.checks[2] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[2] ? "[OK]" : "[MISSING]"} All video lectures have uploaded files
                </li>
                <li className={summary.checks[3] ? "text-emerald-700" : "text-rose-700"}>
                  {summary.checks[3] ? "[OK]" : "[MISSING]"} All quiz lectures have at least 1 question
                </li>
              </ul>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={!canPublish || isPublishing}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPublishing ? "Publishing..." : "Publish Course"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveDraft()}
                  disabled={isSavingDraft}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isSavingDraft ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to Builder
                </button>
              </div>
              {publishError ? (
                <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
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
