"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import TaxAgentDashboard from "@/components/dashboard/TaxAgentDashboard";
import { useAuthStore } from "@/lib/store";
import { isManagerRole, normalizeRole } from "@/lib/roles";

export default function ManagerLearningPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: session, status } = useSession();
  const role = normalizeRole(session?.user?.role ?? "");

  useEffect(() => {
    if (!isAuthenticated && status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && !isManagerRole(role)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, status, role, router]);

  if (status === "loading") {
    return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">Loading...</main>;
  }

  if (!isManagerRole(role)) {
    return null;
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">My Learning</h1>
        <p className="text-sm text-gray-500">Your personal courses and certificates</p>
      </div>
      <TaxAgentDashboard />
    </div>
  );
}
