"use client";

import AdminRoleGate from "@/components/admin/AdminRoleGate";
import IntegrationLogsSection from "@/components/webadmin/IntegrationLogsSection";
import { WEB_ADMIN_ONLY_ROLES } from "@/lib/roles";

export default function AdminIntegrationsPage() {
  return (
    <AdminRoleGate allowedRoles={WEB_ADMIN_ONLY_ROLES}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor synchronization and external integration activity.</p>
        </div>
        <IntegrationLogsSection />
      </div>
    </AdminRoleGate>
  );
}
