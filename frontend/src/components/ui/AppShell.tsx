"use client";

import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return <div className="min-h-[calc(100vh-4rem)]">{children}</div>;
}
