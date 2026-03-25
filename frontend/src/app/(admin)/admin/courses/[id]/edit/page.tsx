"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import CourseBuilder from "@/components/admin/CourseBuilder";
import CourseSettingsForm from "@/components/admin/CourseSettingsForm";
import { getCourseById, publishCourse, unpublishCourse } from "@/lib/api/admin-courses";
import { getErrorMessage } from "@/lib/errors";
import type { Course } from "@/types";

function isAllowedRole(role: string | null | undefined) {
  const normalized = (role ?? "").replace("ROLE_", "").toUpperCase();
  return normalized === "CONTENT_ADMIN" || normalized === "SYSTEM_ADMIN";
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAllowedRole(session?.user?.role)) {
      router.replace("/dashboard");
      return;
    }

    let active = true;
    async function loadCourse() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCourseById(id);
        if (!active) return;
        setCourse(data);
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCourse();
    return () => {
      active = false;
    };
  }, [id, router, session?.user?.role, status]);

  async function handleTogglePublish() {
    if (!course) return;
    try {
      setIsToggling(true);
      if (course.published) {
        await unpublishCourse(course.id);
      } else {
        await publishCourse(course.id);
      }
      setCourse((prev) => (prev ? { ...prev, published: !prev.published } : prev));
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsToggling(false);
    }
  }

  if (status === "loading" || isLoading) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Loading course editor...</main>;
  }

  if (!course) {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Course not found.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Edit Course Upload</h1>
            <p className="mt-1 text-slate-600">{course.title}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleTogglePublish()}
            disabled={isToggling}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              course.published ? "bg-slate-700 hover:bg-slate-800" : "bg-emerald-600 hover:bg-emerald-700"
            } disabled:opacity-60`}
          >
            {isToggling ? "Saving..." : course.published ? "Unpublish" : "Publish"}
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          Status:{" "}
          <span className={course.published ? "text-emerald-700" : "text-slate-600"}>
            {course.published ? "Published" : "Draft"}
          </span>
        </p>
        {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

        <div className="space-y-8">
          <CourseSettingsForm course={course} onCourseUpdated={setCourse} />
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Course Content Builder</h2>
            <CourseBuilder course={course} onCourseChange={setCourse} />
          </div>
        </div>
      </section>
    </main>
  );
}
