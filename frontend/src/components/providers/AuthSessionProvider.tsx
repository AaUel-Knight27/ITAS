"use client";

import { SessionProvider } from "next-auth/react";

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
