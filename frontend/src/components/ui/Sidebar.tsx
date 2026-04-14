"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Award,
  LayoutDashboard,
  GraduationCap,
  Settings,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  LogOut,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

import {
  canAccessCourses,
  getRoleHomePath,
  canGetCertificate,
  isAdminRole,
  isCommunicationRole,
  isContentAdminRole,
  isManagerRole,
  isTrainingAdminRole,
  isWebAdminRole,
  normalizeRole,
} from "@/lib/roles";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function getNavSections(role: string): NavSection[] {
  const normalizedRole = normalizeRole(role);
  const sections: NavSection[] = [];

  // Main section for everyone
  const mainItems: NavItem[] = [
    {
      label: "Dashboard",
      href: getRoleHomePath(normalizedRole),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  ];

  // Manager specific - My Learning
  if (isManagerRole(normalizedRole)) {
    mainItems.push({
      label: "My Learning",
      href: "/my-learning",
      icon: <GraduationCap className="h-5 w-5" />,
    });
  }

  sections.push({ title: "Main", items: mainItems });

  // Learning section for learner roles
  if (canAccessCourses(role)) {
    const learningItems: NavItem[] = [
      {
        label: "Course Catalog",
        href: "/courses",
        icon: <BookOpen className="h-5 w-5" />,
      },
    ];

    if (canGetCertificate(role)) {
      learningItems.push({
        label: "Certificates",
        href: "/certificates",
        icon: <Award className="h-5 w-5" />,
      });
    }

    sections.push({ title: "Learning", items: learningItems });
  }

  // Admin sections based on role
  if (isContentAdminRole(normalizedRole)) {
    sections.push({
      title: "Content Management",
      items: [
        {
          label: "Manage Courses",
          href: "/admin/courses",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          label: "Create Course",
          href: "/admin/courses/new",
          icon: <BookOpen className="h-5 w-5" />,
        },
      ],
    });
  }

  if (isTrainingAdminRole(normalizedRole)) {
    sections.push({
      title: "Training",
      items: [
        {
          label: "Webinar Scheduler",
          href: "/dashboard#webinars",
          icon: <Calendar className="h-5 w-5" />,
        },
      ],
    });
  }

  if (isCommunicationRole(normalizedRole)) {
    sections.push({
      title: "Communications",
      items: [
        {
          label: "Notifications",
          href: "/dashboard#communications",
          icon: <Bell className="h-5 w-5" />,
        },
        {
          label: "FAQ Management",
          href: "/dashboard#communications",
          icon: <HelpCircle className="h-5 w-5" />,
        },
        {
          label: "Support Responses",
          href: "/dashboard#communications",
          icon: <MessageSquare className="h-5 w-5" />,
        },
      ],
    });
  }

  if (isWebAdminRole(normalizedRole)) {
    sections.push({
      title: "System Admin",
      items: [
        {
          label: "Platform Controls",
          href: "/dashboard#admin",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          label: "User Analytics",
          href: "/dashboard#admin",
          icon: <BarChart3 className="h-5 w-5" />,
        },
      ],
    });
  }

  if (isManagerRole(normalizedRole)) {
    sections.push({
      title: "Team Management",
      items: [
        {
          label: "Team Analytics",
          href: "/dashboard",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          label: "Team Members",
          href: "/dashboard",
          icon: <Users className="h-5 w-5" />,
        },
      ],
    });
  }

  return sections;
}

function getRoleBadgeColor(role: string): string {
  const normalizedRole = normalizeRole(role);
  
  if (isWebAdminRole(normalizedRole)) return "bg-destructive/10 text-destructive";
  if (isContentAdminRole(normalizedRole)) return "bg-primary/10 text-primary";
  if (isTrainingAdminRole(normalizedRole)) return "bg-warning/10 text-warning-foreground";
  if (isCommunicationRole(normalizedRole)) return "bg-accent text-accent-foreground";
  if (isManagerRole(normalizedRole)) return "bg-success/10 text-success";
  return "bg-muted text-muted-foreground";
}

function getRoleDisplayName(role: string): string {
  const normalized = normalizeRole(role);
  return normalized.replace(/_/g, " ");
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userName = session?.user?.name ?? session?.user?.username ?? "User";
  const role = session?.user?.role ?? "";
  const sections = getNavSections(role);

  useEffect(() => {
    setMounted(true);
    // Restore collapsed state from localStorage
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { collapsed: newState },
      })
    );
  };

  if (!session?.user) {
    return null;
  }

  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar" />
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`flex h-16 items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">TEP</span>
              <span className="text-[10px] text-muted-foreground">Education Portal</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* User Section */}
      <div className={`border-b border-sidebar-border p-4 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </span>
              <span className={`mt-0.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${getRoleBadgeColor(role)}`}>
                {getRoleDisplayName(role)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href.split("#")[0] + "/");
                  return (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className={`flex-shrink-0 ${isActive ? "" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"}`}>
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={handleCollapse}
          className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? (collapsed ? "Expand" : "Collapse") : undefined}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export function SidebarSpacer({ collapsed }: { collapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed ?? false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      setIsCollapsed(stored === "true");
    } catch {
      // Ignore localStorage access issues.
    }

    const handleToggle = (
      event: Event
    ) => {
      const customEvent = event as CustomEvent<{
        collapsed: boolean;
      }>;
      setIsCollapsed(customEvent.detail.collapsed);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "sidebar-collapsed") {
        setIsCollapsed(event.newValue === "true");
      }
    };

    window.addEventListener("sidebar-toggle", handleToggle);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("sidebar-toggle", handleToggle);
      window.removeEventListener("storage", handleStorage);
    };
  }, [collapsed]);

  return (
    <div
      className={`flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    />
  );
}
