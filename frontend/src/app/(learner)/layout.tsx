import type { ReactNode } from "react";

import AppShell from "@/components/ui/AppShell";

type LearnerLayoutProps = {
  children: ReactNode;
};

export default function LearnerLayout({ children }: LearnerLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
