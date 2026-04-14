"use client";

import { SessionProvider } from "next-auth/react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionSync } from "@/components/providers/SessionSync";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <QueryProvider>
        <SessionSync />
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
