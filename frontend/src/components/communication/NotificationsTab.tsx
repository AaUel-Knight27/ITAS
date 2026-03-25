"use client";

import { useEffect, useState } from "react";

import { communicationApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { CampaignDto, NotificationRequest } from "@/lib/types";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All Users" },
  { value: "TAXPAYER", label: "Taxpayers Only" },
  { value: "TAX_AGENT", label: "Tax Agents Only" },
  { value: "MOR_STAFF", label: "MOR Staff Only" },
  { value: "ALL_LEARNERS", label: "All Learners" },
];

export default function NotificationsTab() {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<NotificationRequest>({
    title: "",
    message: "",
    audienceType: "ALL",
    sendNow: true,
    scheduledAt: undefined,
  });

  useEffect(() => {
    void fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getCampaigns();
      setCampaigns(res.data);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.message.trim()) {
      setError("Message is required");
      return;
    }
    if (!form.sendNow && !form.scheduledAt) {
      setError("Please select a scheduled time");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await communicationApi.sendNotification(form);
      setSuccess("Notification sent successfully!");
      setForm({
        title: "",
        message: "",
        audienceType: "ALL",
        sendNow: true,
        scheduledAt: undefined,
      });
      await fetchCampaigns();
    } catch (error) {
      setError(getErrorMessage(error) || "Could not send notification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Send Notification</h3>

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
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notification message..."
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">When to Send</label>
            <div className="flex gap-3">
              {[
                { value: true, label: "Send Now" },
                { value: false, label: "Schedule for Later" },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => setForm((prev) => ({ ...prev, sendNow: option.value }))}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    form.sendNow === option.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {!form.sendNow ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt || ""}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : null}

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Past Campaigns</h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No campaigns sent yet</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{campaign.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {AUDIENCE_OPTIONS.find((option) => option.value === campaign.audienceType)?.label ||
                      campaign.audienceType}{" "}
                    · {formatDate(campaign.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    campaign.status === "SENT"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
