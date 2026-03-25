"use client";

import { useEffect, useState } from "react";

import { communicationApi } from "@/lib/api";
import type { AnnouncementDto, AnnouncementRequest } from "@/lib/types";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All Users" },
  { value: "TAXPAYER", label: "Taxpayers Only" },
  { value: "TAX_AGENT", label: "Tax Agents Only" },
  { value: "MOR_STAFF", label: "MOR Staff Only" },
  { value: "ALL_LEARNERS", label: "All Learners" },
];

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<AnnouncementRequest>({
    title: "",
    content: "",
    audienceType: "ALL",
    isActive: true,
  });

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getAllAnnouncements();
      setAnnouncements(res.data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await communicationApi.createAnnouncement(form);
      setSuccess("Announcement published successfully!");
      setForm({
        title: "",
        content: "",
        audienceType: "ALL",
        isActive: true,
      });
      await fetchAll();
    } catch {
      setError("Failed to publish announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await communicationApi.toggleAnnouncement(id);
      setAnnouncements((prev) => prev.map((announcement) => (announcement.id === id ? res.data : announcement)));
    } catch {
      window.alert("Failed to toggle announcement.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await communicationApi.deleteAnnouncement(id);
      await fetchAll();
    } catch {
      window.alert("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">New Announcement</h3>

        {error ? <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}
        {success ? (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your announcement here..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target Audience</label>
            <select
              value={form.audienceType}
              onChange={(e) => setForm((prev) => ({ ...prev, audienceType: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => void handlePublish()}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Announcement"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">All Announcements</h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No announcements yet</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">{announcement.title}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          announcement.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {announcement.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-500">{announcement.content}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {AUDIENCE_OPTIONS.find((option) => option.value === announcement.audienceType)?.label} ·{" "}
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => void handleToggle(announcement.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        announcement.isActive
                          ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {announcement.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => void handleDelete(announcement.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
