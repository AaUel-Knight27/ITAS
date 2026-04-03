"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Upload, Edit, Eye, EyeOff, Trash2, BookOpen, Search, CheckCircle } from "lucide-react";

import CourseThumbnail from "@/components/course/CourseThumbnail";
import { useUIStore } from "@/lib/store";
import { uploadContent } from "@/lib/api/content";
import { deleteCourse, getAdminCourses, publishCourse, unpublishCourse } from "@/lib/api/admin-courses";
import { getErrorMessage } from "@/lib/errors";
import { normalizeRole } from "@/lib/roles";
import type { Course } from "@/types";

function isAllowedRole(role: string | null | undefined) {
  const normalized = normalizeRole(role ?? "");
  return ["CONTENT_ADMIN", "SYSTEM_ADMIN"].includes(normalized);
}

function AdminCoursesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session, status: sessionStatus } = useSession();
  const role = session?.user?.role;
  const normalizedRole = normalizeRole(role ?? "");
  const canEditContent = ["CONTENT_ADMIN", "SYSTEM_ADMIN"].includes(normalizedRole);
  const { showToast } = useUIStore();

  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [localLoading, setLocalLoading] = useState(true);
  const [localCourses, setLocalCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (!isAllowedRole(role)) {
      router.replace("/dashboard");
      return;
    }

    let active = true;
    async function load() {
      try {
        setLocalLoading(true);
        const data = await getAdminCourses();
        if (!active) return;
        setLocalCourses(data);
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace("/login");
          return;
        }
        showToast(getErrorMessage(err) || "Could not load courses. Please refresh.", "error");
      } finally {
        if (active) setLocalLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, role, showToast, sessionStatus]);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    let type: "VIDEO" | "PDF" | "IMAGE" | "ARTICLE" = "PDF";
    if (name.endsWith(".mp4")) type = "VIDEO";
    else if (name.endsWith(".pdf")) type = "PDF";
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) type = "IMAGE";
    else if (name.endsWith(".html") || name.endsWith(".txt") || name.endsWith(".md")) type = "ARTICLE";

    const form = new FormData();
    form.append("title", file.name);
    form.append("description", "");
    form.append("categoryId", "");
    form.append("type", type);
    form.append("downloadAllowed", "false");
    form.append("file", file);

    try {
      setUploadingFile(file);
      setUploadPercent(0);
      await uploadContent(form, (p) => setUploadPercent(p));
      showToast("Upload successful", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setUploadingFile(null);
      setUploadPercent(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: number | string) {
    const confirmed = window.confirm("Are you sure you want to delete this course?");
    if (!confirmed) return;
    try {
      await deleteCourse(id);
      setLocalCourses((prev: Course[]) => prev.filter((course: Course) => String(course.id) !== String(id)));
      showToast("Course deleted.", "success");
    } catch (error) {
      showToast(getErrorMessage(error) || "Could not delete course. Please try again.", "error");
    }
  }

  async function handleTogglePublish(course: Course) {
    try {
      if (course.published) {
        await unpublishCourse(course.id);
      } else {
        await publishCourse(course.id);
      }
      setLocalCourses((prev: Course[]) =>
        prev.map((item: Course) => (String(item.id) === String(course.id) ? { ...item, published: !course.published } : item))
      );
      showToast("Publish status updated.", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const filteredCourses = localCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sessionStatus === "loading" || localLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading course management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage all courses and publication status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEditContent && (
              <Link
                href="/admin/courses/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Course
              </Link>
            )}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
          </div>
        </div>

        {/* Status Messages */}
        {searchParams.get("status") === "published" && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-sm font-medium text-success">Course published successfully.</p>
          </div>
        )}
        {searchParams.get("status") === "draft" && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Course saved as draft.</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title or category..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring sm:max-w-sm"
          />
        </div>

        {/* Courses Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Course
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Difficulty
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <CourseThumbnail
                            title={course.title}
                            thumbnailUrl={course.thumbnailUrl}
                            className="h-full w-full object-cover"
                            fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700"
                            iconClassName="h-5 w-5 text-white"
                          />
                        </div>
                        <span className="font-medium text-card-foreground">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{course.category?.name ?? "N/A"}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          course.published
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {course.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {canEditContent && (
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleTogglePublish(course)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          title={course.published ? "Unpublish" : "Publish"}
                        >
                          {course.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(course.id)}
                          className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      {searchQuery ? "No courses match your search." : "No courses found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading course management...</p>
          </div>
        </div>
      }
    >
      <AdminCoursesPageContent />
    </Suspense>
  );
}
