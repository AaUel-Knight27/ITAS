"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { normalizeRole } from "@/lib/roles";

/**
 * Admin Dashboard Page
 * 
 * This page serves as the root entry point for the /admin route.
 * It ensures the user is an admin and then redirects them to the 
 * course management page, which is the primary admin function.
 */
export default function AdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  function isAllowedRole(role: string | null | undefined) {
    const normalized = normalizeRole(role ?? "");
    return [
      "CONTENT_ADMIN",
      "TRAINING_ADMIN",
      "COMMUNICATION",
      "WEB_ADMIN",
      "SYSTEM_ADMIN",
    ].includes(normalized);
  }

  function getAdminLandingPage(role: string | null | undefined) {
    const normalized = normalizeRole(role ?? "");

    switch (normalized) {
      case "CONTENT_ADMIN":
        return "/admin/courses";
      case "TRAINING_ADMIN":
        return "/admin/webinars";
      case "COMMUNICATION":
        return "/admin/communications";
      case "WEB_ADMIN":
      case "SYSTEM_ADMIN":
        return "/admin/users";
      default:
        return "/dashboard";
    }
  }

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const role = session?.user?.role;
    if (!isAllowedRole(role)) {
      router.replace("/dashboard");
      return;
    }

    router.replace(getAdminLandingPage(role));
  }, [router, session?.user?.role, sessionStatus]);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-slate-600 font-medium">
        Redirecting to Admin Dashboard...
      </div>
    </main>
  );
}
