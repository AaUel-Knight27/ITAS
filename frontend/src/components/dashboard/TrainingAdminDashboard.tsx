"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import EmptyState from "@/components/ui/EmptyState";
import AttendeesModal from "@/components/webinars/AttendeesModal";
import WebinarFormModal from "@/components/webinars/WebinarFormModal";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { webinarApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { normalizeRole } from "@/lib/roles";
import type { WebinarDto, WebinarRequest } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  LIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function TrainingAdminDashboard() {
  const { data: session, status } = useSession();
  const [upcoming, setUpcoming] = useState<WebinarDto[]>([]);
  const [past, setPast] = useState<WebinarDto[]>([]);
  const [activeTab, setActiveTab] = usePersistedTab(
    "trainingadmin-tab",
    "upcoming",
    ["upcoming", "past"]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<WebinarDto | null>(null);
  const [attendeesWebinarId, setAttendeesWebinarId] = useState<number | null>(null);
  const [attendeesTitle, setAttendeesTitle] = useState("");
  const normalizedRole = useMemo(
    () => normalizeRole(session?.user?.role ?? ""),
    [session?.user?.role]
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [upRes, pastRes] = await Promise.all([
        webinarApi.getUpcoming(),
        webinarApi.getPast(),
      ]);
      setUpcoming(Array.isArray(upRes.data) ? upRes.data : []);
      setPast(Array.isArray(pastRes.data) ? pastRes.data : []);
    } catch (requestError) {
      setUpcoming([]);
      setPast([]);
      setError(getErrorMessage(requestError) || "Failed to load webinars. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (normalizedRole !== "TRAINING_ADMIN") {
      setLoading(false);
      setError("This dashboard is available only to Training Admin users.");
      return;
    }
    void fetchAll();
  }, [fetchAll, normalizedRole, status]);

  const handleCreate = async (data: WebinarRequest) => {
    await webinarApi.create(data);
    await fetchAll();
  };

  const handleUpdate = async (data: WebinarRequest) => {
    if (!editData) return;
    await webinarApi.update(editData.id, data);
    await fetchAll();
  };

  const handleCancel = async (webinar: WebinarDto) => {
    if (
      !window.confirm(
        `Cancel "${webinar.title}"?\n\nRegistered attendees will be notified.`
      )
    ) {
      return;
    }

    try {
      await webinarApi.cancel(webinar.id);
      await fetchAll();
    } catch {
      window.alert("Failed to cancel webinar. Please try again.");
    }
  };

  const handleEdit = (webinar: WebinarDto) => {
    setEditData(webinar);
    setFormOpen(true);
  };

  const handleOpenCreate = () => {
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

  const formatDuration = (mins: number) => {
    if (!mins) return "-";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const displayList = activeTab === "upcoming" ? upcoming : past;
  const totalRegistered = [...upcoming, ...past].reduce(
    (sum, webinar) => sum + webinar.registeredCount,
    0
  );

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webinar Management</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage training webinars</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span className="text-lg font-bold leading-none">+</span>
          Schedule New Webinar
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          {
            label: "Upcoming Webinars",
            value: upcoming.length,
            icon: "UP",
            color: "text-blue-600",
          },
          {
            label: "Past Webinars",
            value: past.length,
            icon: "PA",
            color: "text-gray-600",
          },
          {
            label: "Total Registered",
            value: totalRegistered,
            icon: "RG",
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white px-5 py-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => void fetchAll()} className="ml-4 shrink-0 font-medium underline">
            Retry
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {[
          { id: "upcoming" as const, label: "Upcoming", count: upcoming.length },
          { id: "past" as const, label: "Past", count: past.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <EmptyState
          icon="🎥"
          title={`No ${activeTab} webinars`}
          description={
            activeTab === "upcoming"
              ? 'Click "Schedule New Webinar" to create one.'
              : "Past webinars will appear here once sessions are completed."
          }
          action={
            activeTab === "upcoming"
              ? {
                  label: "Schedule New Webinar",
                  onClick: handleOpenCreate,
                }
              : undefined
          }
        />
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

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span>Date: {formatDate(webinar.scheduledAt)}</span>
                    <span>Duration: {formatDuration(webinar.durationMinutes)}</span>
                    <span>
                      Registered: {webinar.registeredCount}
                      {webinar.maxAttendees ? ` / ${webinar.maxAttendees}` : ""} registered
                    </span>
                    {webinar.meetingLink ? (
                      <a
                        href={webinar.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="text-blue-500 hover:underline"
                      >
                        Meeting Link
                      </a>
                    ) : null}
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
                    {webinar.registeredCount > 0 ? (
                      <span className="ml-1 rounded-full bg-blue-100 px-1 text-blue-700">
                        {webinar.registeredCount}
                      </span>
                    ) : null}
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
                        onClick={() => void handleCancel(webinar)}
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
