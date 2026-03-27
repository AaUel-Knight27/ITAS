"use client";

import { useEffect, useState } from "react";
import { webinarApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { WebinarDto } from "@/lib/types";
import WebinarCard from "@/components/webinars/WebinarCard";

export default function WebinarsPage() {
  const [upcoming, setUpcoming] = useState<WebinarDto[]>([]);
  const [past, setPast] = useState<WebinarDto[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        webinarApi.getUpcoming(),
        webinarApi.getPast(),
      ]);

      setUpcoming(upcomingRes.data);
      setPast(pastRes.data);

      try {
        const myRes = await webinarApi.getMyRegistrations();
        setMyRegistrations((myRes.data || []).map((webinar) => webinar.id));
      } catch (regErr: unknown) {
        const status = (regErr as { response?: { status?: number } })?.response?.status;
        console.warn("Could not load registrations:", status);
        setMyRegistrations([]);
      }
    } catch (error) {
      setError(getErrorMessage(error) || "Could not load webinars. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (webinarId: number) => {
    setRegistering(webinarId);
    try {
      await webinarApi.register(webinarId);
      setMyRegistrations((current) => (current.includes(webinarId) ? current : [...current, webinarId]));
      setToast("Successfully registered! Check your email for details.");
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const message = getErrorMessage(error);

      if (status === 409) {
        setMyRegistrations((current) => (current.includes(webinarId) ? current : [...current, webinarId]));
        setToast("You are already registered for this webinar.");
      } else if (status === 403) {
        setToast("You do not have permission to register for webinars.");
      } else {
        setToast(message || "Registration failed. Please try again.");
      }
    } finally {
      setRegistering(null);
    }
  };

  const displayList = activeTab === "upcoming" ? upcoming : past;
  const myUpcomingCount = upcoming.filter((webinar) => myRegistrations.includes(webinar.id)).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
        <p className="mt-1 text-sm text-gray-500">Browse and register for live training sessions</p>
      </div>

      {myUpcomingCount > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <span className="text-2xl" aria-hidden="true">
            🎯
          </span>
          <div>
            <p className="text-sm font-medium text-blue-900">
              You are registered for {myUpcomingCount} upcoming webinar{myUpcomingCount !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-blue-700">
              Meeting links appear on your registered webinars below
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchAll()} className="ml-4 shrink-0 font-medium underline">
            Retry
          </button>
        </div>
      ) : null}

      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {[
          { id: "upcoming" as const, label: "Upcoming", count: upcoming.length },
          { id: "past" as const, label: "Past", count: past.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="mb-4 text-4xl">{activeTab === "upcoming" ? "📅" : "📚"}</p>
          <p className="text-lg font-medium">
            {activeTab === "upcoming" ? "No upcoming webinars" : "No past webinars"}
          </p>
          <p className="mt-1 text-sm">
            {activeTab === "upcoming" ? "Check back later for new sessions" : "Past webinars will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayList.map((webinar) => (
            <WebinarCard
              key={webinar.id}
              webinar={webinar}
              isRegistered={myRegistrations.includes(webinar.id)}
              onRegister={handleRegister}
              registering={registering === webinar.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
