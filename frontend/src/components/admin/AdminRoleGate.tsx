"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { getRoleHomePath, hasAnyRole } from "@/lib/roles";

type Props = {
  allowedRoles: readonly string[];
  children: ReactNode;
};

export default function AdminRoleGate({ allowedRoles, children }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? "";

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (!hasAnyRole(role, allowedRoles)) {
      router.replace(getRoleHomePath(role));
    }
  }, [allowedRoles, role, router, status]);

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || !hasAnyRole(role, allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
