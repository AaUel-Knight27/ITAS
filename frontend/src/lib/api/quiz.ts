import type { Assessment, AssessmentAttempt, AssessmentResult } from "@/types";

import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;

  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;

  return payload as T;
}

export async function getAssessment(assessmentId: number | string): Promise<Assessment> {
  const response = await api.get<Assessment | ApiResponse<Assessment>>(`/lms/assessments/${assessmentId}`);
  return unwrap(response.data);
}

export async function submitAssessment(
  assessmentId: number | string,
  answers: Record<string, string | boolean>
): Promise<AssessmentAttempt> {
  const response = await api.post<AssessmentAttempt | ApiResponse<AssessmentAttempt>>(
    `/lms/assessments/${assessmentId}/submit`,
    { answers }
  );
  return unwrap(response.data);
}

export async function getAttemptResult(attemptId: number | string): Promise<AssessmentResult> {
  const response = await api.get<AssessmentResult | ApiResponse<AssessmentResult>>(`/lms/assessments/attempts/${attemptId}`);
  return unwrap(response.data);
}

export async function getUserAttempts(assessmentId: number | string): Promise<AssessmentAttempt[]> {
  const response = await api.get<AssessmentAttempt[] | ApiResponse<AssessmentAttempt[]>>(`/lms/assessments/${assessmentId}/attempts`);
  return unwrap(response.data);
}
