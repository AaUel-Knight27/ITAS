import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type SupportResponse = {
  id: number | string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  message: string;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt?: string;
};

export type ReplyPayload = {
  responseId: number | string;
  message: string;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export async function getResponses(): Promise<SupportResponse[]> {
  const response = await api.get<SupportResponse[] | ApiResponse<SupportResponse[]>>("/responses");
  return unwrap(response.data);
}

export async function replyToResponse(payload: ReplyPayload): Promise<SupportResponse> {
  const response = await api.post<SupportResponse | ApiResponse<SupportResponse>>(`/responses/${payload.responseId}/reply`, {
    message: payload.message,
  });
  return unwrap(response.data);
}
