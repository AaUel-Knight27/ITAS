"use client";

import AnnouncementsTab from "@/components/communication/AnnouncementsTab";
import FaqTab from "@/components/communication/FaqTab";
import HelpArticlesTab from "@/components/communication/HelpArticlesTab";
import NotificationsTab from "@/components/communication/NotificationsTab";
import SingleUserNotification from "@/components/communication/SingleUserNotification";
import { usePersistedTab } from "@/hooks/usePersistedTab";

type Tab = "notifications" | "single" | "faq" | "announcements" | "help";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "notifications", label: "Push Notifications", icon: "📣" },
  { id: "single", label: "Single User", icon: "👤" },
  { id: "faq", label: "FAQ Management", icon: "❓" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "help", label: "Help Articles", icon: "📝" },
];

export default function CommunicationDashboard() {
  const [activeTab, setActiveTab] = usePersistedTab(
    "comms-tab",
    "notifications",
    ["notifications", "single", "faq", "announcements", "help"]
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Communication Hub</h1>
        <p className="mt-1 text-sm text-gray-500">Manage notifications, FAQs, announcements, and help articles</p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "notifications" ? <NotificationsTab /> : null}
      {activeTab === "single" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <SingleUserNotification />
        </div>
      ) : null}
      {activeTab === "faq" ? <FaqTab /> : null}
      {activeTab === "announcements" ? <AnnouncementsTab /> : null}
      {activeTab === "help" ? <HelpArticlesTab /> : null}
    </div>
  );
}
