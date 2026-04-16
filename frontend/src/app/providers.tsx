"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionSync } from "@/components/providers/SessionSync";
import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/context/LanguageContext";

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
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
        storageKey="itas-theme"
      >
        <LanguageProvider>
          <QueryProvider>
            <SessionSync />
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
