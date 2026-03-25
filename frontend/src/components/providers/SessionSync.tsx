"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * SessionSync
 *
 * Bridges the NextAuth JWT session → Zustand useAuthStore.
 *
 * Problem: NextAuth persists the token server-side (JWT cookie), but
 * useAuthStore (Zustand + localStorage) is populated independently.
 * If setAuth() is never called (e.g. after a hard refresh or first login),
 * the Zustand `role` stays null and all role guards redirect wrongly.
 *
 * Solution: Render this component once inside <SessionProvider>. Every time
 * the NextAuth session resolves or changes, we push the role + token from the
 * session into the Zustand store so the rest of the app can read it reliably.
 */
export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      const rawRole: string = user.role ?? "";
      const token: string = user.accessToken ?? "";

      const { role: storedRole, isAuthenticated, setAuth } = useAuthStore.getState();

      // Normalize role (strip ROLE_ prefix if present)
      const normalizedRole = rawRole.replace(/^ROLE_/i, "").toUpperCase();

      // Only call setAuth if something actually changed to avoid infinite loops
      if (!isAuthenticated || storedRole !== normalizedRole) {
        setAuth(
          {
            id: user.id ?? "1",
            email: user.email ?? "",
            username: user.name ?? "",
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            status: user.status ?? "ACTIVE",
            role: rawRole,
          },
          token
        );
      }
    } else if (status === "unauthenticated") {
      const { isAuthenticated, clearAuth } = useAuthStore.getState();
      if (isAuthenticated) {
        clearAuth();
      }
    }
  }, [session, status]);

  // This component renders nothing — it's a side-effect only hook
  return null;
}
