import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type Webinar = {
  id: number | string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  presenter: string;
  maxAttendees?: number;
  audienceRoles?: string[];
  courseId?: number | string;
  status?: string;
};

export type WebinarRequest = Omit<Webinar, "id" | "status">;

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export async function getWebinars(): Promise<Webinar[]> {
  const response = await api.get<Webinar[] | ApiResponse<Webinar[]>>("/webinars");
  return unwrap(response.data);
}

export async function scheduleWebinar(payload: WebinarRequest): Promise<Webinar> {
  const response = await api.post<Webinar | ApiResponse<Webinar>>("/webinars/schedule", payload);
  return unwrap(response.data);
}
