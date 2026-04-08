"use client";

import AdminRoleGate from "@/components/admin/AdminRoleGate";
import TrainingAdminDashboard from "@/components/dashboard/TrainingAdminDashboard";
import { TRAINING_ADMIN_ROUTE_ROLES } from "@/lib/roles";

export default function AdminWebinarsPage() {
  return (
    <AdminRoleGate allowedRoles={TRAINING_ADMIN_ROUTE_ROLES}>
      <TrainingAdminDashboard />
    </AdminRoleGate>
  );
}
