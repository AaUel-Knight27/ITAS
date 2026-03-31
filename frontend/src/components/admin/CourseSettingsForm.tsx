"use client";

import axios from "axios";
import { Camera, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { updateCourse, getCourseCategories, uploadCourseThumbnail } from "@/lib/api/admin-courses";
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

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const data = await getCourseCategories();
        if (active) {
          setCategories(data);
          if (!form.categoryId && data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: String(data[0].id) }));
          }
        }
      } catch (error) {
        if (active) showToast(getErrorMessage(error), "error");
      }
    }
    void loadCategories();
    return () => {
      active = false;
    };
  }, [form.categoryId, showToast]);

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
      setThumbnailError("Thumbnail must be under 5MB");
      return;
    }
    setThumbnailError("");
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setThumbnailPreview(String(event.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function handleSaveSettings() {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId) {
      showToast("Please complete required fields (Title, Slug, Category).", "error");
      return;
    }
    if (targetAudience.length === 0) {
      showToast("Please select at least one target audience.", "error");
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
      });

      let nextCourse = { ...updatedCourse, sections: course.sections ?? [] };

      if (thumbnailFile) {
        const uploaded = await uploadCourseThumbnail(course.id, thumbnailFile);
        if (uploaded.thumbnailUrl) {
          nextCourse = { ...nextCourse, thumbnailUrl: uploaded.thumbnailUrl };
        }
      } else if (!thumbnailPreview && course.thumbnailUrl) {
        // Assume they removed it
        nextCourse.thumbnailUrl = "";
      }

      onCourseUpdated(nextCourse);
      showToast("Course settings updated successfully.", "success");
    } catch (error) {
      const message = axios.isAxiosError(error) ? String(error.response?.data?.message ?? "") : "";
      if (message.toLowerCase().includes("slug already exists")) {
        setSlugError("This slug is already taken. Please choose a different one.");
      } else {
        showToast(getErrorMessage(error), "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Course Settings</h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Title *</span>
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
          {slugError ? <p className="mt-1 text-xs text-rose-600">[!] {slugError}</p> : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
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
          <span className="mb-1 block text-sm font-medium text-slate-700">Target Audience</span>
          <p className="text-xs text-slate-500">Select who can see this course</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { value: "TAXPAYER", label: "Taxpayers" },
              { value: "TAX_AGENT", label: "Tax Agents" },
              { value: "MOR_STAFF", label: "MoR Staff" },
              { value: "MANAGER", label: "Managers" },
            ].map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
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
              <img
                src={getFileUrl(thumbnailPreview) ?? ""}
                alt="Thumbnail preview"
                className="h-40 w-64 rounded-lg object-cover"
              />
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

      <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => void handleSaveSettings()}
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Course Details"}
        </button>
      </div>
    </div>
  );
}
