import type { ReactNode } from "react";

import AppShell from "@/components/ui/AppShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
