"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { adminCourseApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { AdminCourseDto } from "@/lib/types";
import { getFileUrl } from "@/lib/utils";

type Tab = "active" | "archived";

const STATUS_STYLES = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
} as const;

const STATUS_LABELS = {
  PUBLISHED: "✓ Published",
  DRAFT: "⏳ Draft",
  ARCHIVED: "🗂 Archived",
} as const;

export default function ContentAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [activeCourses, setActiveCourses] = useState<AdminCourseDto[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<AdminCourseDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    void fetchAll();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [activeRes, archivedRes] = await Promise.all([
        adminCourseApi.getAllCourses(),
        adminCourseApi.getArchivedCourses(),
      ]);
      setActiveCourses(activeRes.data);
      setArchivedCourses(archivedRes.data);
    } catch (error) {
      setError(getErrorMessage(error) || "Could not load courses. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (course: AdminCourseDto) => {
    setActionLoading(course.id);
    try {
      await adminCourseApi.publishCourse(course.id);
      showToast(`"${course.title}" published`);
      await fetchAll();
    } catch (error) {
      showToast(getErrorMessage(error) || "Could not publish course. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (course: AdminCourseDto) => {
    setActionLoading(course.id);
    try {
      await adminCourseApi.unpublishCourse(course.id);
      showToast(`"${course.title}" moved to draft`);
      await fetchAll();
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (course: AdminCourseDto) => {
    if (
      !window.confirm(
        `Archive "${course.title}"?\n\nArchived courses are hidden from learners but can be restored later.`,
      )
    ) {
      return;
    }

    setActionLoading(course.id);
    try {
      await adminCourseApi.archiveCourse(course.id);
      showToast(`"${course.title}" archived`);
      await fetchAll();
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (course: AdminCourseDto) => {
    setActionLoading(course.id);
    try {
      await adminCourseApi.restoreCourse(course.id);
      showToast(`"${course.title}" restored to draft`);
      await fetchAll();
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (course: AdminCourseDto) => {
    if (
      !window.confirm(
        `Permanently delete "${course.title}"?\n\nThis cannot be undone. All sections, lectures and enrollments will be lost.`,
      )
    ) {
      return;
    }

    setActionLoading(course.id);
    try {
      await adminCourseApi.deleteCourse(course.id);
      showToast(`"${course.title}" permanently deleted`);
      await fetchAll();
    } catch (error) {
      showToast(getErrorMessage(error) || "Could not delete course. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const filterCourses = (courses: AdminCourseDto[]) => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        (course.categoryName || "").toLowerCase().includes(query),
    );
  };

  const displayCourses = filterCourses(activeTab === "active" ? activeCourses : archivedCourses);
  const totalPublished = activeCourses.filter((course) => course.status === "PUBLISHED").length;
  const totalDraft = activeCourses.filter((course) => course.status === "DRAFT").length;
  const totalArchived = archivedCourses.length;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {toast && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create, publish and manage courses</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/courses/new")}
          className="flex items-center gap-2 self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 md:self-auto"
        >
          <span className="text-lg font-bold leading-none">+</span>
          Upload Course
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Courses",
            value: activeCourses.length + totalArchived,
            icon: "📚",
            color: "text-blue-600",
          },
          {
            label: "Published",
            value: totalPublished,
            icon: "✅",
            color: "text-green-600",
          },
          {
            label: "Drafts",
            value: totalDraft,
            icon: "⏳",
            color: "text-yellow-600",
          },
          {
            label: "Archived",
            value: totalArchived,
            icon: "🗂",
            color: "text-gray-500",
            onClick: () => setActiveTab("archived" as Tab),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={`rounded-xl border border-gray-200 bg-white px-5 py-4 ${
              stat.onClick ? "cursor-pointer hover:border-blue-300 hover:shadow-sm" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
            {stat.onClick ? <p className="mt-1 text-xs text-blue-500">Click to view →</p> : null}
          </div>
        ))}
      </div>

      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {[
          { id: "active" as Tab, label: "Active Courses", count: activeCourses.length },
          { id: "archived" as Tab, label: "Archived", count: totalArchived },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearch("");
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={activeTab === "active" ? "Search active courses..." : "Search archived courses..."}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchAll()} className="font-medium underline">
            Retry
          </button>
        </div>
      ) : null}

      {activeTab === "archived" && archivedCourses.length > 0 ? (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          🗂 Archived courses are hidden from learners. Restore a course to make it available again as a draft.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          {activeTab === "archived" ? (
            <>
              <p className="mb-3 text-4xl">🗂</p>
              <p className="text-lg font-medium">No archived courses</p>
              <p className="mt-1 text-sm">Archive a course to hide it from learners</p>
            </>
          ) : search ? (
            <>
              <p className="text-lg font-medium">No courses match "{search}"</p>
              <button type="button" onClick={() => setSearch("")} className="mt-2 text-sm text-blue-600 underline">
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="mb-3 text-4xl">📚</p>
              <p className="text-lg font-medium">No courses yet</p>
              <button
                type="button"
                onClick={() => router.push("/admin/courses/new")}
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create First Course
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["", "Course", "Category", "Status", "Lectures", "Created", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayCourses.map((course) => (
                <tr
                  key={course.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    course.status === "ARCHIVED" ? "opacity-75" : ""
                  }`}
                >
                  <td className="w-12 px-4 py-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                      {course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getFileUrl(course.thumbnailUrl) || ""}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                          <span className="text-xs text-white">📚</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium text-gray-900">{course.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">/{course.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{course.categoryName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[course.status]}`}>
                      {STATUS_LABELS[course.status]}
                    </span>
                    {course.archivedAt ? (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(course.archivedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {course.totalSections}s · {course.totalLectures}L
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(course.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {course.status === "ARCHIVED" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleRestore(course)}
                            disabled={actionLoading === course.id}
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50"
                          >
                            {actionLoading === course.id ? "..." : "↩ Restore"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(course)}
                            disabled={actionLoading === course.id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          {course.status === "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => void handleUnpublish(course)}
                              disabled={actionLoading === course.id}
                              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                            >
                              {actionLoading === course.id ? "..." : "Unpublish"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handlePublish(course)}
                              disabled={actionLoading === course.id}
                              className="rounded-lg border border-green-200 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              {actionLoading === course.id ? "..." : "Publish"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleArchive(course)}
                            disabled={actionLoading === course.id}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                          >
                            {actionLoading === course.id ? "..." : "🗂 Archive"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(course)}
                            disabled={actionLoading === course.id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span>
              Showing {displayCourses.length}
              {search ? " matching" : ""}
              {activeTab === "archived" ? " archived" : ""} courses
            </span>
            {activeTab === "active" ? (
              <span>
                {totalPublished} published · {totalDraft} draft
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
