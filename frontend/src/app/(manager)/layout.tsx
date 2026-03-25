import type { ReactNode } from "react";

import AppShell from "@/components/ui/AppShell";

type ManagerLayoutProps = {
  children: ReactNode;
};

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
