"use client";

import AdminRoleGate from "@/components/admin/AdminRoleGate";
import CommunicationDashboard from "@/components/dashboard/CommunicationDashboard";
import { COMMUNICATION_ROUTE_ROLES } from "@/lib/roles";

export default function AdminCommunicationsPage() {
  return (
    <AdminRoleGate allowedRoles={COMMUNICATION_ROUTE_ROLES}>
      <CommunicationDashboard />
    </AdminRoleGate>
  );
}
