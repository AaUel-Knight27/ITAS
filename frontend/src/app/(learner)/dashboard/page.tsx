"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import {
  isCommunicationRole,
  isContentAdminRole,
  isManagerRole,
  isTrainingAdminRole,
  isWebAdminRole,
  normalizeRole,
} from "@/lib/roles";

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

const TaxpayerDashboard = dynamic(() => import("@/components/dashboard/TaxpayerDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const TaxAgentDashboard = dynamic(() => import("@/components/dashboard/TaxAgentDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const MorStaffDashboard = dynamic(() => import("@/components/dashboard/MorStaffDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const ManagerDashboard = dynamic(() => import("@/components/dashboard/ManagerDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const ContentAdminDashboard = dynamic(() => import("@/components/dashboard/ContentAdminDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const TrainingAdminDashboard = dynamic(() => import("@/components/dashboard/TrainingAdminDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const CommunicationDashboard = dynamic(() => import("@/components/dashboard/CommunicationDashboard"), {
  loading: () => <DashboardSkeleton />,
});
const WebAdminDashboard = dynamic(() => import("@/components/dashboard/WebAdminDashboard"), {
  loading: () => <DashboardSkeleton />,
});

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
    return <DashboardSkeleton />;
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
