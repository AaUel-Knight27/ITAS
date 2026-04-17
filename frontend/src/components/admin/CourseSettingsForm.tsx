"use client";

import axios from "axios";
import { Camera, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { updateCourse, getCourseCategories, saveCourseThumbnailUrl, uploadCourseThumbnail } from "@/lib/api/admin-courses";
import { CACHE_KEYS, courseCache } from "@/lib/courseCache";
import { getErrorMessage } from "@/lib/errors";
import { createSlugCandidate, normalizeSlugInput } from "@/lib/slug";
import { getFileUrl } from "@/lib/utils";
import type { Category, Course } from "@/types";
import { useUIStore } from "@/lib/store";

type CourseSettingsFormProps = {
  course: Course;
  onCourseUpdated: (course: Course) => void;
};

export default function CourseSettingsForm({ course, onCourseUpdated }: CourseSettingsFormProps) {
  const { showToast } = useUIStore();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description ?? "",
    categoryId: course.category?.id ?? course.categoryId ?? "",
    difficulty: course.difficulty,
  });

  const [targetAudience, setTargetAudience] = useState<string[]>(
    course.targetAudience ?? ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"]
  );

  const [slugError, setSlugError] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(course.thumbnailUrl ?? "");
  const [thumbnailError, setThumbnailError] = useState("");
  const [thumbnailUrlMode, setThumbnailUrlMode] = useState(false);
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState(course.thumbnailUrl ?? "");
  const courseIdRef = useRef(course.id);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const data = await getCourseCategories();
        if (!active) return;
        setCategories(data);
        setForm((prev) => {
          if (prev.categoryId) return prev;
          if (data.length === 0) return prev;
          return {
            ...prev,
            categoryId: String(data[0].id),
          };
        });
      } catch (error) {
        if (active) showToast(getErrorMessage(error), "error");
      }
    }
    void loadCategories();
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (course.id === courseIdRef.current) {
      return;
    }
    courseIdRef.current = course.id;
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description ?? "",
      categoryId: course.category?.id ?? course.categoryId ?? "",
      difficulty: course.difficulty,
    });
    setTargetAudience(course.targetAudience ?? ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"]);
    setThumbnailPreview(course.thumbnailUrl ?? "");
    setThumbnailFile(null);
    setThumbnailUrlMode(false);
    setThumbnailUrlInput(course.thumbnailUrl ?? "");
  }, [course.id]);

  function handleRegenerateSlug() {
    setForm((prev) => ({ ...prev, slug: createSlugCandidate(prev.title || prev.slug || "") }));
    setSlugError("");
  }

  function handleAudienceChange(value: string) {
    setTargetAudience((prev) =>
      prev.includes(value) ? prev.filter((role) => role !== value) : [...prev, value]
    );
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
    setThumbnailUrlMode(false);
    setThumbnailUrlInput("");
  }

  async function handleSaveSettings() {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId) {
      showToast(t("admin.required_fields_course"), "error");
      return;
    }
    if (targetAudience.length === 0) {
      showToast(t("admin.target_audience_required"), "error");
      return;
    }

    try {
      setIsSaving(true);
      setSlugError("");

      const updatedCourse = await updateCourse(course.id, {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description,
        categoryId: form.categoryId,
        difficulty: form.difficulty,
        targetAudience,
        thumbnailUrl: thumbnailUrlMode
          ? thumbnailUrlInput.trim() || undefined
          : !thumbnailFile && !thumbnailPreview
            ? ""
            : course.thumbnailUrl || undefined,
      });

      let nextCourse: Course = {
        ...course,
        ...updatedCourse,
        sections: course.sections ?? [],
        thumbnailUrl: thumbnailFile
          ? updatedCourse.thumbnailUrl ?? course.thumbnailUrl
          : thumbnailPreview
            ? course.thumbnailUrl
            : updatedCourse.thumbnailUrl ?? course.thumbnailUrl,
      };

      if (thumbnailFile) {
        const uploaded = await uploadCourseThumbnail(course.id, thumbnailFile);
        if (uploaded.thumbnailUrl) {
          nextCourse = { ...nextCourse, thumbnailUrl: uploaded.thumbnailUrl };
        }
      } else if (thumbnailUrlMode && thumbnailUrlInput.trim()) {
        const uploaded = await saveCourseThumbnailUrl(course.id, thumbnailUrlInput.trim());
        if (uploaded.thumbnailUrl) {
          nextCourse = { ...nextCourse, thumbnailUrl: uploaded.thumbnailUrl };
        }
      } else if (!thumbnailPreview && course.thumbnailUrl) {
        // Assume they removed it
        nextCourse.thumbnailUrl = "";
      }

      courseCache.invalidate(CACHE_KEYS.courses());
      courseCache.invalidate(CACHE_KEYS.course(course.slug));
      if (nextCourse.slug && nextCourse.slug !== course.slug) {
        courseCache.invalidate(CACHE_KEYS.course(nextCourse.slug));
      }
      onCourseUpdated(nextCourse);
      showToast(t("admin.course_settings_saved"), "success");
    } catch (error) {
      const message = axios.isAxiosError(error) ? String(error.response?.data?.message ?? "") : "";
      if (message.toLowerCase().includes("slug already exists")) {
        setSlugError(t("admin.slug_taken"));
      } else {
        showToast(getErrorMessage(error), "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">{t("admin.course_settings")}</h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.title_required")}</span>
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
          {slugError ? <p className="mt-1 text-xs text-rose-600">[!] {slugError}</p> : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.description")}</span>
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
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.target_audience")}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("admin.select_course_visibility")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { value: "TAXPAYER", label: t("admin.audience.taxpayer") },
              { value: "TAX_AGENT", label: t("admin.audience.tax_agent") },
              { value: "MOR_STAFF", label: t("admin.audience.mor_staff") },
              { value: "MANAGER", label: t("admin.audience.manager") },
            ].map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
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
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setThumbnailUrlMode(false)}
              className={`rounded px-2 py-1 text-xs ${
                !thumbnailUrlMode
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setThumbnailUrlMode(true);
                setThumbnailFile(null);
                if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
              }}
              className={`rounded px-2 py-1 text-xs ${
                thumbnailUrlMode
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Paste URL
            </button>
          </div>
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
          {thumbnailUrlMode ? (
            <input
              type="url"
              value={thumbnailUrlInput}
              onChange={(event) => {
                setThumbnailUrlInput(event.target.value);
                setThumbnailPreview(event.target.value.trim());
                setThumbnailError("");
              }}
              placeholder="https://res.cloudinary.com/..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          ) : !thumbnailPreview ? (
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
              <img
                src={getFileUrl(thumbnailPreview) ?? ""}
                alt={t("admin.thumbnail_preview")}
                className="h-40 w-64 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setThumbnailFile(null);
                  setThumbnailPreview("");
                  setThumbnailUrlInput("");
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

      <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => void handleSaveSettings()}
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {isSaving ? t("admin.saving") : t("admin.save_course_details")}
        </button>
      </div>
    </div>
  );
}
