import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type NotificationPayload = {
  subject: string;
  message: string;
  channel?: "EMAIL" | "SMS" | "IN_APP";
  audienceRoles?: string[];
  recipients?: string[];
  scheduleAt?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationLog = {
  id: number | string;
  subject: string;
  message: string;
  channel: string;
  sentAt?: string;
  status?: string;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationLog> {
  const response = await api.post<NotificationLog | ApiResponse<NotificationLog>>("/notifications/send", payload);
  return unwrap(response.data);
}

export async function getNotifications(): Promise<NotificationLog[]> {
  const response = await api.get<NotificationLog[] | ApiResponse<NotificationLog[]>>("/notifications");
  return unwrap(response.data);
}
