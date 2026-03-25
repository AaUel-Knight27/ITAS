import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type Faq = {
  id: number | string;
  question: string;
  answer: string;
  category?: string;
  updatedAt?: string;
};

export type FaqRequest = Omit<Faq, "id" | "updatedAt">;

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export async function getFaqs(): Promise<Faq[]> {
  const response = await api.get<Faq[] | ApiResponse<Faq[]>>("/faqs");
  return unwrap(response.data);
}

export async function createFaq(payload: FaqRequest): Promise<Faq> {
  const response = await api.post<Faq | ApiResponse<Faq>>("/faqs", payload);
  return unwrap(response.data);
}
