"use client";

import CommunicationDashboard from "@/components/dashboard/CommunicationDashboard";
import ContentAdminDashboard from "@/components/dashboard/ContentAdminDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import TrainingAdminDashboard from "@/components/dashboard/TrainingAdminDashboard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import IntegrationLogsSection from "@/components/webadmin/IntegrationLogsSection";
import SystemLogsSection from "@/components/webadmin/SystemLogsSection";
import UserManagementSection from "@/components/webadmin/UserManagementSection";

type Section =
  | "overview"
  | "users"
  | "courses"
  | "webinars"
  | "communications"
  | "logs"
  | "integrations";

type Props = {
  initialSection?: Section;
};

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "User Management", icon: "👥" },
  { id: "courses", label: "Course Management", icon: "📚" },
  { id: "webinars", label: "Webinar Management", icon: "🎥" },
  { id: "communications", label: "Communications", icon: "📢" },
  { id: "logs", label: "System Logs", icon: "🗂️" },
  { id: "integrations", label: "Integrations", icon: "🔗" },
];

export default function WebAdminDashboard({ initialSection = "overview" }: Props) {
  const [activeSection, setActiveSection] = usePersistedTab(
    "webadmin-tab",
    initialSection,
    ["overview", "users", "courses", "webinars", "communications", "logs", "integrations"]
  );
  const current = SECTIONS.find((section) => section.id === activeSection);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="flex w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Web Admin</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">Control Panel</p>
          </div>

          <nav className="flex-1 space-y-0.5 px-2 py-3">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">Full system access</p>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{current?.icon}</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{current?.label}</h1>
                <p className="text-xs text-gray-500">
                  {activeSection === "overview" && "Platform-wide analytics"}
                  {activeSection === "users" && "Manage all users and roles"}
                  {activeSection === "courses" && "Manage all courses"}
                  {activeSection === "webinars" && "Manage webinars"}
                  {activeSection === "communications" && "Notifications and FAQs"}
                  {activeSection === "logs" && "System activity logs"}
                  {activeSection === "integrations" && "External system sync history"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeSection === "overview" && <ManagerDashboard />}

            {activeSection === "users" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">All Users</h2>
                </div>
                <UserManagementSection />
              </div>
            )}

            {activeSection === "courses" && <ContentAdminDashboard />}
            {activeSection === "webinars" && <TrainingAdminDashboard />}
            {activeSection === "communications" && <CommunicationDashboard />}

            {activeSection === "logs" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Activity Logs</h2>
                </div>
                <SystemLogsSection />
              </div>
            )}

            {activeSection === "integrations" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Integration Sync Logs</h2>
                </div>
                <IntegrationLogsSection />
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
