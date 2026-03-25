"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useSession } from "next-auth/react";

/**
 * Admin Dashboard Page
 * 
 * This page serves as the root entry point for the /admin route.
 * It ensures the user is an admin and then redirects them to the 
 * course management page, which is the primary admin function.
 */
export default function AdminPage() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuthStore();
  const { status: sessionStatus } = useSession();

  function isAllowedRole(role: string | null | undefined) {
    const normalized = (role ?? "").replace("ROLE_", "").toUpperCase();
    return ["CONTENT_ADMIN", "SYSTEM_ADMIN"].includes(normalized);
  }

  useEffect(() => {
    // Wait for session and store to be ready
    if (sessionStatus === "loading") return;

    if (!isAuthenticated && sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (!isAllowedRole(role)) {
      router.replace("/dashboard");
      return;
    }

    // Default admin behavior: go to course management
    router.replace("/admin/courses");
  }, [router, role, isAuthenticated, sessionStatus]);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-slate-600 font-medium">
        Redirecting to Admin Dashboard...
      </div>
    </main>
  );
}
