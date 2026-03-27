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

  if (isManagerRole(normalizedRole)) {
    return (
      <ErrorBoundary>
        <ManagerDashboard />
      </ErrorBoundary>
    );
  }

  if (isContentAdminRole(normalizedRole)) {
    return (
      <ErrorBoundary>
        <ContentAdminDashboard />
      </ErrorBoundary>
    );
  }

  if (normalizedRole === "TRAINING_ADMIN" || isTrainingAdminRole(normalizedRole)) {
    return (
      <ErrorBoundary>
        <TrainingAdminDashboard />
      </ErrorBoundary>
    );
  }

  if (isCommunicationRole(normalizedRole)) {
    return (
      <ErrorBoundary>
        <CommunicationDashboard />
      </ErrorBoundary>
    );
  }

  if (isWebAdminRole(normalizedRole)) {
    return (
      <ErrorBoundary>
        <WebAdminDashboard />
      </ErrorBoundary>
    );
  }

  if (normalizedRole === "TAXPAYER") {
    return (
      <ErrorBoundary>
        <TaxpayerDashboard />
      </ErrorBoundary>
    );
  }

  if (normalizedRole === "TAX_AGENT") {
    return (
      <ErrorBoundary>
        <TaxAgentDashboard />
      </ErrorBoundary>
    );
  }

  if (normalizedRole === "MOR_STAFF") {
    return (
      <ErrorBoundary>
        <MorStaffDashboard />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <TaxpayerDashboard />
    </ErrorBoundary>
  );
}
