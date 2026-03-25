"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import NotificationBell from "@/components/notifications/NotificationBell";
import SearchBar from "@/components/search/SearchBar";
import { getNavLinks } from "@/lib/navLinks";
import { canAccessCourses, normalizeRole } from "@/lib/roles";

const ROLE_BADGE_COLORS: Record<string, string> = {
  TAXPAYER: "bg-blue-100 text-blue-700",
  TAX_AGENT: "bg-cyan-100 text-cyan-700",
  MOR_STAFF: "bg-teal-100 text-teal-700",
  MANAGER: "bg-purple-100 text-purple-700",
  CONTENT_ADMIN: "bg-orange-100 text-orange-700",
  TRAINING_ADMIN: "bg-pink-100 text-pink-700",
  COMMUNICATION: "bg-yellow-100 text-yellow-700",
  WEB_ADMIN: "bg-red-100 text-red-700",
  SYSTEM_ADMIN: "bg-red-100 text-red-700",
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setUserMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  if (pathname === "/login") {
    return null;
  }

  if (status === "loading") {
    return <nav className="h-16 border-b border-gray-200 bg-white" />;
  }

  if (!session?.user) {
    return null;
  }

  const role = normalizeRole(session.user.role || "");
  const navLinks = getNavLinks(role);
  const user = session.user;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getInitials = () => {
    const name = user.name || user.email || user.username || "";
    return name
      .split(" ")
      .map((value: string) => value[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleBadgeColor = ROLE_BADGE_COLORS[role] || "bg-gray-100 text-gray-700";
  const dropdownLearningHref = role === "MANAGER" ? "/my-learning" : "/dashboard";
  const showLearningLink = ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"].includes(role);
  const showCertificatesLink = ["TAX_AGENT", "MOR_STAFF", "MANAGER"].includes(role);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-sm font-bold text-white">IT</span>
              </div>
              <span className="hidden text-sm font-bold text-gray-900 sm:block">ITAS Portal</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mx-4 hidden max-w-xl flex-1 items-center gap-4 md:flex">
              {canAccessCourses(role) ? <SearchBar compact={true} /> : null}
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">{getInitials()}</span>
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-medium leading-tight text-gray-900">
                      {user.name || user.email?.split("@")[0] || user.username}
                    </p>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                      {role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                        {role.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="py-1">
                      {showLearningLink && (
                        <Link
                          href={dropdownLearningHref}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>📚</span>
                          My Learning
                        </Link>
                      )}

                      {showCertificatesLink && (
                        <Link
                          href="/certificates"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>🏆</span>
                          Certificates
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {userMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
