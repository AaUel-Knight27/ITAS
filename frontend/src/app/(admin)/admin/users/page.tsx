"use client";

import AdminRoleGate from "@/components/admin/AdminRoleGate";
import UserManagementSection from "@/components/webadmin/UserManagementSection";
import { WEB_ADMIN_ONLY_ROLES } from "@/lib/roles";

export default function AdminUsersPage() {
  return (
    <AdminRoleGate allowedRoles={WEB_ADMIN_ONLY_ROLES}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform users and their roles.</p>
        </div>
        <UserManagementSection />
      </div>
    </AdminRoleGate>
  );
}
