"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { courseCache } from "@/lib/courseCache";
import { clearUserStorage } from "@/lib/userStorage";

export default function LogoutButton() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    const userId = session?.user?.id;
    if (userId) {
      clearUserStorage(String(userId));
    }
    courseCache.clear();
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
