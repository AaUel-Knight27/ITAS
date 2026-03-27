import {
  COMMUNICATION,
  CONTENT_ADMIN,
  MANAGER,
  MOR_STAFF,
  TAX_AGENT,
  TAXPAYER,
  TRAINING_ADMIN,
  WEB_ADMIN,
  normalizeRole,
} from "@/lib/roles";

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: Record<string, NavLink[]> = {
  [TAXPAYER]: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Webinars", href: "/webinars" },
    { label: "My Learning", href: "/dashboard" },
  ],

  [TAX_AGENT]: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Webinars", href: "/webinars" },
    { label: "My Learning", href: "/dashboard" },
    { label: "Certificates", href: "/certificates" },
  ],

  [MOR_STAFF]: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Webinars", href: "/webinars" },
    { label: "My Learning", href: "/dashboard" },
    { label: "Certificates", href: "/certificates" },
  ],

  [MANAGER]: [
    { label: "Home", href: "/" },
    { label: "Webinars", href: "/webinars" },
    { label: "My Learning", href: "/my-learning" },
    { label: "Certificates", href: "/certificates" },
    { label: "Analytics", href: "/dashboard" },
  ],

  [CONTENT_ADMIN]: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Courses", href: "/admin/courses" },
  ],

  [TRAINING_ADMIN]: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Webinars", href: "/webinars" },
  ],

  [COMMUNICATION]: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Notifications", href: "/notifications" },
  ],

  [WEB_ADMIN]: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/admin/users" },
    { label: "Courses", href: "/admin/courses" },
    { label: "Webinars", href: "/admin/webinars" },
    { label: "Communications", href: "/admin/communications" },
    { label: "Logs", href: "/admin/logs" },
    { label: "Integrations", href: "/admin/integrations" },
  ],
};

export function getNavLinks(role: string): NavLink[] {
  return NAV_LINKS[normalizeRole(role)] || [];
}
