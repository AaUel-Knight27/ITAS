import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type SystemSettings = {
  maintenanceMode: boolean;
  enrollmentOpen: boolean;
  emailNotifications: boolean;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await api.get<SystemSettings | ApiResponse<SystemSettings>>("/admin/settings");
  return unwrap(response.data);
}

export async function updateSystemSettings(payload: SystemSettings): Promise<SystemSettings> {
  const response = await api.post<SystemSettings | ApiResponse<SystemSettings>>("/admin/settings", payload);
  return unwrap(response.data);
}
