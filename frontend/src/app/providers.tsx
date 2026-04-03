"use client";

import { SessionProvider } from "next-auth/react";
import { SessionSync } from "@/components/providers/SessionSync";

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
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
