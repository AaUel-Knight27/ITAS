"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import CommunicationDashboard from "@/components/dashboard/CommunicationDashboard";
import ContentAdminDashboard from "@/components/dashboard/ContentAdminDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import MorStaffDashboard from "@/components/dashboard/MorStaffDashboard";
import TaxAgentDashboard from "@/components/dashboard/TaxAgentDashboard";
import TaxpayerDashboard from "@/components/dashboard/TaxpayerDashboard";
import TrainingAdminDashboard from "@/components/dashboard/TrainingAdminDashboard";
import WebAdminDashboard from "@/components/dashboard/WebAdminDashboard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import {
  isCommunicationRole,
  isContentAdminRole,
  isManagerRole,
  isTrainingAdminRole,
  isWebAdminRole,
  normalizeRole,
} from "@/lib/roles";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const rawRole = session?.user?.role ?? "";
  const normalizedRole = normalizeRole(rawRole);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, sessionStatus]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  let dashboard = null;

  if (isManagerRole(normalizedRole)) {
    dashboard = <ManagerDashboard />;
  } else if (isContentAdminRole(normalizedRole)) {
    dashboard = <ContentAdminDashboard />;
  } else if (isTrainingAdminRole(normalizedRole)) {
    dashboard = <TrainingAdminDashboard />;
  } else if (isCommunicationRole(normalizedRole)) {
    dashboard = <CommunicationDashboard />;
  } else if (isWebAdminRole(normalizedRole)) {
    dashboard = <WebAdminDashboard />;
  } else if (normalizedRole === "TAXPAYER") {
    dashboard = <TaxpayerDashboard />;
  } else if (normalizedRole === "TAX_AGENT") {
    dashboard = <TaxAgentDashboard />;
  } else if (normalizedRole === "MOR_STAFF") {
    dashboard = <MorStaffDashboard />;
  } else {
    dashboard = <TaxpayerDashboard />;
  }

  return (
    <ErrorBoundary>
      {dashboard}
    </ErrorBoundary>
  );
}
