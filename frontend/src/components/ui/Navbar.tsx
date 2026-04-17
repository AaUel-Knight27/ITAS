"use client";

import Link from "next/link";
import { Award, BookOpen, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import SearchBar from "@/components/search/SearchBar";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { courseCache } from "@/lib/courseCache";
import { getNavLinks } from "@/lib/navLinks";
import { canAccessCourses, normalizeRole } from "@/lib/roles";
import { clearUserStorage } from "@/lib/userStorage";

const ROLE_BADGE_COLORS: Record<string, string> = {
  TAXPAYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TAX_AGENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  MOR_STAFF: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  MANAGER: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  CONTENT_ADMIN: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  TRAINING_ADMIN: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  COMMUNICATION: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  WEB_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  SYSTEM_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { t, isAmharic } = useLanguage();
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
    return <nav className="h-16 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />;
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
    const userId = session?.user?.id;
    if (userId) {
      clearUserStorage(String(userId));
    }
    courseCache.clear();
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

  const roleBadgeColor = ROLE_BADGE_COLORS[role] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  const dropdownLearningHref = role === "MANAGER" ? "/my-learning" : "/dashboard";
  const showLearningLink = ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"].includes(role);
  const showCertificatesLink = ["TAX_AGENT", "MOR_STAFF", "MANAGER"].includes(role);
  const translatedTextClass = isAmharic ? "ethiopic-text" : "";

  const getTranslatedLabel = (label: string) => {
    const key = `nav.${label.toLowerCase().replace(/ /g, "_")}`;
    const translated = t(key);
    return translated === key ? label : translated;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700/60 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-sm font-bold text-white">IT</span>
              </div>
              <span className="hidden text-sm font-bold text-gray-900 dark:text-white sm:block">ITAS Portal</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                >
                  <span className={translatedTextClass}>{getTranslatedLabel(link.label)}</span>
                </Link>
              ))}
            </div>

            <div className="mx-4 hidden max-w-xl flex-1 items-center gap-4 md:flex">
              {canAccessCourses(role) ? <SearchBar compact={true} /> : null}
            </div>

            <div className="flex items-center gap-1.5">
              <LanguageToggle />
              <ThemeToggle />

              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">{getInitials()}</span>
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className={`text-xs font-medium leading-tight text-gray-900 dark:text-white ${translatedTextClass}`}>
                      {user.name || user.email?.split("@")[0] || user.username}
                    </p>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                      {role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform dark:text-gray-500 ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className={`text-sm font-medium text-gray-900 dark:text-white ${translatedTextClass}`}>
                        {user.name || user.username}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                        {role.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="py-1">
                      {showLearningLink && (
                        <Link
                          href={dropdownLearningHref}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          <span className={translatedTextClass}>{t("menu.my_learning")}</span>
                        </Link>
                      )}

                      {showCertificatesLink && (
                        <Link
                          href="/certificates"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Award className="h-4 w-4" aria-hidden="true" />
                          <span className={translatedTextClass}>{t("menu.certificates")}</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
                      <p className={`mb-2 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600 ${translatedTextClass}`}>
                        {t("menu.preferences")}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs text-gray-600 dark:text-gray-400 ${translatedTextClass}`}>{t("menu.language")}</span>
                        <LanguageToggle />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs text-gray-600 dark:text-gray-400 ${translatedTextClass}`}>{t("menu.theme")}</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 py-1 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        <span className={translatedTextClass}>{t("auth.sign_out")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              >
                <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-1 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className={translatedTextClass}>{getTranslatedLabel(link.label)}</span>
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 px-1 pt-3 dark:border-gray-700">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <div className="border-t border-gray-100 pt-2 dark:border-gray-700">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <span className={translatedTextClass}>{t("auth.sign_out")}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {userMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
