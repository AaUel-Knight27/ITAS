"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Navbar from "@/components/ui/Navbar";

type RootChromeProps = {
  children: ReactNode;
};

export default function RootChrome({ children }: RootChromeProps) {
  const pathname = usePathname();
  const hideNavbar = pathname?.includes("/learn/") ?? false;

  return (
    <>
      {hideNavbar ? null : <Navbar />}
      <main>{children}</main>
    </>
  );
}
