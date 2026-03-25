"use client";

import { useEffect, useState } from "react";

import HelpTooltip from "@/components/help/HelpTooltip";
import type { WebinarDto, WebinarRequest } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WebinarRequest) => Promise<void>;
  editData?: WebinarDto | null;
}

const defaultForm: WebinarRequest = {
  title: "",
  description: "",
  scheduledAt: "",
  durationMinutes: 60,
  maxAttendees: 50,
  meetingLink: "",
};

export default function WebinarFormModal({ isOpen, onClose, onSubmit, editData }: Props) {
  const today = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState<WebinarRequest>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title,
        description: editData.description,
        scheduledAt: editData.scheduledAt.slice(0, 16),
        durationMinutes: editData.durationMinutes,
        maxAttendees: editData.maxAttendees,
        meetingLink: editData.meetingLink,
      });
    } else {
      setForm(defaultForm);
    }
    setError("");
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.scheduledAt) {
      setError("Scheduled date is required");
      return;
    }
    if (new Date(form.scheduledAt) <= new Date()) {
      setError("Scheduled date must be in the future");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setError("Failed to save webinar. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editData ? "Edit Webinar" : "Schedule New Webinar"}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
            x
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
          {error ? <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Webinar title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Webinar description"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              Scheduled Date & Time *
              <HelpTooltip pageId="webinar-form" fieldId="scheduledAt" position="right" />
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              min={today}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                value={form.durationMinutes}
                min={15}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Attendees</label>
              <input
                type="number"
                value={form.maxAttendees}
                min={1}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxAttendees: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Meeting Link</label>
            <input
              type="url"
              value={form.meetingLink}
              onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://zoom.us/j/..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : editData ? "Save Changes" : "Schedule Webinar"}
          </button>
        </div>
      </div>
    </div>
  );
}
