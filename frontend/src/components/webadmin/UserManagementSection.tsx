"use client";

import { useCallback, useEffect, useState } from "react";

import { userManagementApi } from "@/lib/api";
import type { UserDto } from "@/lib/types";

const ALL_ROLES = [
  "TAXPAYER",
  "TAX_AGENT",
  "MOR_STAFF",
  "MANAGER",
  "CONTENT_ADMIN",
  "TRAINING_ADMIN",
  "COMMUNICATION",
  "WEB_ADMIN",
];

const ROLE_COLORS: Record<string, string> = {
  TAXPAYER: "bg-blue-100 text-blue-700",
  TAX_AGENT: "bg-cyan-100 text-cyan-700",
  MOR_STAFF: "bg-teal-100 text-teal-700",
  MANAGER: "bg-purple-100 text-purple-700",
  CONTENT_ADMIN: "bg-orange-100 text-orange-700",
  TRAINING_ADMIN: "bg-pink-100 text-pink-700",
  COMMUNICATION: "bg-yellow-100 text-yellow-700",
  WEB_ADMIN: "bg-red-100 text-red-700",
};

export default function UserManagementSection() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const PAGE_SIZE = 20;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userManagementApi.getAllUsers({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.data.content);
      setTotal(res.data.totalElements);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter]);

  const handleChangeRole = async (user: UserDto, newRole: string) => {
    setActionLoading(user.id);
    try {
      await userManagementApi.changeRole(user.id, { role: newRole });
      showToast(`${user.username}'s role updated to ${newRole}`);
      await fetchUsers();
    } catch {
      showToast("Failed to change role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: UserDto) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(user.id);
    try {
      await userManagementApi.toggleStatus(user.id, { status: newStatus });
      showToast(`${user.username} is now ${newStatus}`);
      await fetchUsers();
    } catch {
      showToast("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (user: UserDto) => {
    if (!window.confirm(`Send password reset email to ${user.email}?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      await userManagementApi.resetPassword(user.id);
      showToast(`Password reset email sent to ${user.email}`);
    } catch {
      showToast("Failed to send reset email.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: UserDto) => {
    if (!window.confirm(`Permanently delete ${user.username}? This cannot be undone.`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      await userManagementApi.deleteUser(user.id);
      showToast(`${user.username} deleted`);
      await fetchUsers();
    } catch {
      showToast("Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-6 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 ${user.status === "INACTIVE" ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.roleName}
                      onChange={(e) => void handleChangeRole(user, e.target.value)}
                      disabled={actionLoading === user.id}
                      className={`cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        ROLE_COLORS[user.roleName] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(user)}
                        disabled={actionLoading === user.id}
                        className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ${
                          user.status === "ACTIVE"
                            ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                            : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResetPassword(user)}
                        disabled={actionLoading === user.id}
                        className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Reset PW
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(user)}
                        disabled={actionLoading === user.id}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-3 py-1">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
