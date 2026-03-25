"use client";

import { useState } from "react";

import AnnouncementsTab from "@/components/communication/AnnouncementsTab";
import FaqTab from "@/components/communication/FaqTab";
import HelpArticlesTab from "@/components/communication/HelpArticlesTab";
import NotificationsTab from "@/components/communication/NotificationsTab";

type Tab = "notifications" | "faq" | "announcements" | "help";

const TABS: { id: Tab; label: string }[] = [
  { id: "notifications", label: "Push Notifications" },
  { id: "faq", label: "FAQ Management" },
  { id: "announcements", label: "Announcements" },
  { id: "help", label: "Help Articles" },
];

export default function CommunicationDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("notifications");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Communication Hub</h1>
        <p className="mt-1 text-sm text-gray-500">Manage notifications, FAQs, announcements, and help articles</p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "notifications" ? <NotificationsTab /> : null}
      {activeTab === "faq" ? <FaqTab /> : null}
      {activeTab === "announcements" ? <AnnouncementsTab /> : null}
      {activeTab === "help" ? <HelpArticlesTab /> : null}
    </div>
  );
}
