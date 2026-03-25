"use client";

import { useEffect, useState } from "react";

import WebinarFormModal from "@/components/webinars/WebinarFormModal";
import AttendeesModal from "@/components/webinars/AttendeesModal";
import { webinarApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { WebinarDto, WebinarRequest } from "@/lib/types";

const STATUS_COLORS: Record<WebinarDto["status"], string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  LIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function TrainingAdminDashboard() {
  const [upcoming, setUpcoming] = useState<WebinarDto[]>([]);
  const [past, setPast] = useState<WebinarDto[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<WebinarDto | null>(null);
  const [attendeesWebinarId, setAttendeesWebinarId] = useState<number | null>(null);
  const [attendeesTitle, setAttendeesTitle] = useState("");

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [upRes, pastRes] = await Promise.all([webinarApi.getUpcoming(), webinarApi.getPast()]);
      setUpcoming(upRes.data);
      setPast(pastRes.data);
    } catch (error) {
      setError(getErrorMessage(error) || "Could not load webinars. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: WebinarRequest) => {
    await webinarApi.create(data);
    await fetchAll();
  };

  const handleUpdate = async (data: WebinarRequest) => {
    if (!editData) return;
    await webinarApi.update(editData.id, data);
    await fetchAll();
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this webinar?")) return;

    try {
      await webinarApi.cancel(id);
      await fetchAll();
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  const handleEdit = (webinar: WebinarDto) => {
    setEditData(webinar);
    setFormOpen(true);
  };

  const handleOpenForm = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const displayList = activeTab === "upcoming" ? upcoming : past;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webinar Management</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage training webinars</p>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Schedule New Webinar
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming", value: upcoming.length, color: "text-blue-600" },
          { label: "Past", value: past.length, color: "text-gray-600" },
          {
            label: "Total Registered",
            value: [...upcoming, ...past].reduce((sum, webinar) => sum + webinar.registeredCount, 0),
            color: "text-green-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {(["upcoming", "past"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab} ({tab === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p className="text-lg font-medium">No {activeTab} webinars</p>
          {activeTab === "upcoming" ? (
            <p className="mt-1 text-sm">Click &quot;Schedule New Webinar&quot; to create one</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((webinar) => (
            <div
              key={webinar.id}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-semibold text-gray-900">{webinar.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[webinar.status] || STATUS_COLORS.SCHEDULED
                      }`}
                    >
                      {webinar.status}
                    </span>
                  </div>
                  {webinar.description ? (
                    <p className="mb-2 line-clamp-1 text-sm text-gray-500">{webinar.description}</p>
                  ) : null}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>📅 {formatDate(webinar.scheduledAt)}</span>
                    <span>⏱ {webinar.durationMinutes} min</span>
                    <span>
                      👥 {webinar.registeredCount}
                      {webinar.maxAttendees ? ` / ${webinar.maxAttendees}` : ""} registered
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => {
                      setAttendeesWebinarId(webinar.id);
                      setAttendeesTitle(webinar.title);
                    }}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                  >
                    Attendees
                  </button>
                  {webinar.status !== "CANCELLED" && webinar.status !== "COMPLETED" ? (
                    <>
                      <button
                        onClick={() => handleEdit(webinar)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleCancel(webinar.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WebinarFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        onSubmit={editData ? handleUpdate : handleCreate}
        editData={editData}
      />

      <AttendeesModal
        webinarId={attendeesWebinarId}
        webinarTitle={attendeesTitle}
        onClose={() => setAttendeesWebinarId(null)}
      />
    </div>
  );
}
