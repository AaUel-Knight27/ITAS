"use client";

import { Calendar, Clock, ExternalLink, Users } from "lucide-react";

import type { WebinarDto } from "@/lib/types";

interface Props {
  webinar: WebinarDto;
  isRegistered: boolean;
  onRegister: (id: number) => void;
  registering: boolean;
}

const STATUS_STYLES: Record<WebinarDto["status"], string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  LIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function WebinarCard({ webinar, isRegistered, onRegister, registering }: Props) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (mins: number) => {
    if (!mins) return "";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  const isFull = webinar.maxAttendees ? webinar.registeredCount >= webinar.maxAttendees : false;
  const isPast = new Date(webinar.scheduledAt) < new Date();
  const isInactive = isPast || webinar.status === "CANCELLED" || webinar.status === "COMPLETED";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{webinar.title}</h3>
          {webinar.presenterName ? (
            <p className="mt-0.5 text-sm text-gray-500">
              Presented by <span className="font-medium">{webinar.presenterName}</span>
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
            STATUS_STYLES[webinar.status] || STATUS_STYLES.SCHEDULED
          }`}
        >
          {webinar.status}
        </span>
      </div>

      {webinar.description ? (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{webinar.description}</p>
      ) : null}

      <div className="mb-4 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-base" aria-hidden="true">
            <Calendar className="h-4 w-4" />
          </span>
          <span>{formatDate(webinar.scheduledAt)}</span>
        </div>

        {webinar.durationMinutes ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base" aria-hidden="true">
              <Clock className="h-4 w-4" />
            </span>
            <span>{formatDuration(webinar.durationMinutes)}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-base" aria-hidden="true">
            <Users className="h-4 w-4" />
          </span>
          <span>
            {webinar.registeredCount} registered
            {webinar.maxAttendees ? ` / ${webinar.maxAttendees} max` : ""}
          </span>
          {isFull ? (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">Full</span>
          ) : null}
        </div>

        {webinar.meetingLink && isRegistered ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base" aria-hidden="true">
              <ExternalLink className="h-4 w-4" />
            </span>
            <a
              href={webinar.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-blue-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        ) : null}
      </div>

      <div className="border-t border-gray-100 pt-3">
        {isRegistered ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              Registered
            </span>
            {webinar.meetingLink ? (
              <a
                href={webinar.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Join Webinar
              </a>
            ) : null}
          </div>
        ) : isFull ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-400"
          >
            Webinar Full
          </button>
        ) : isInactive ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-400"
          >
            {webinar.status === "CANCELLED" ? "Cancelled" : "Webinar Ended"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRegister(webinar.id)}
            disabled={registering}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registering ? "Registering..." : "Register for Webinar"}
          </button>
        )}
      </div>
    </div>
  );
}
