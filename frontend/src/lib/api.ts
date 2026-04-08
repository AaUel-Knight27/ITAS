import { API_BASE } from "./config";
import axios from "axios";
import type {
  ActivityLogDto,
  AdminCourseDto,
  ActivityLogEntry,
  AnnouncementDto,
  AnnouncementRequest,
  AnalyticsDashboardDto,
  AttendeeDto,
  CampaignDto,
  CertificateDto,
  ContentVersionDto,
  CourseCompletionRateDto,
  CourseProgressDto,
  DailyEnrollmentDto,
  EnrollmentDto,
  FaqDto,
  FaqRequest,
  HelpArticleDto,
  NotificationRequest,
  PagedResponse,
  RoleChangeRequest,
  QuizPassRateDto,
  RoleCountDto,
  ContextualHelpDto,
  SearchFilterDto,
  SearchResponseDto,
  SearchResultDto,
  StatusRequest,
  SyncLogDto,
  SyncRequestDto,
  SyncStatsDto,
  UserDto,
  WebinarDto,
  WebinarRequest,
} from "./types";
import type { Category } from "@/types";

export interface HelpArticleRequest {
  title: string;
  content: string;
  pageId?: string;
  fieldId?: string;
  category?: string;
  tags?: string;
  isPublished?: boolean;
}

type AxiosConfigWithSuppressedStatuses = {
  suppressErrorStatuses?: number[];
};

function readAccessTokenFromStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    // Try custom storage first.
    const raw = window.localStorage.getItem("itas-auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
      const token = parsed?.state?.accessToken;
      if (token) {
        return token;
      }
    }

    // Fallback: try NextAuth-style session keys.
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.startsWith("nextauth.message") || key.includes("session")) {
        try {
          const value = JSON.parse(window.localStorage.getItem(key) ?? "{}") as {
            accessToken?: string;
            user?: { accessToken?: string };
          };
          const token = value?.accessToken ?? value?.user?.accessToken;
          if (token) {
            return token;
          }
        } catch {
          // Skip malformed session entries.
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  if (
    url.includes("/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/api/auth/")
  ) {
    return config;
  }

  const accessToken = readAccessTokenFromStorage();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error)) {
      const configWithSuppressedStatuses = error.config as AxiosConfigWithSuppressedStatuses | undefined;
      const suppressedStatuses = Array.isArray(configWithSuppressedStatuses?.suppressErrorStatuses)
        ? configWithSuppressedStatuses.suppressErrorStatuses
        : [];
      const shouldSuppress = suppressedStatuses.includes(error.response?.status ?? -1);

      if (error.response?.status === 401) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (error.response?.status === 403 && !shouldSuppress) {
        console.error("Access forbidden (403):", error.config?.url);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  getProfile: () => api.get("/auth/profile"),

  logout: (token: string) =>
    api.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
};

export const webinarApi = {
  getAll: () => api.get<WebinarDto[]>("/webinars"),

  getUpcoming: () => api.get<WebinarDto[]>("/webinars/upcoming"),

  getPast: () => api.get<WebinarDto[]>("/webinars/past"),

  getMyRegistrations: () => api.get<WebinarDto[]>("/webinars/my-registrations"),

  register: (id: number) => api.post(`/webinars/${id}/register`),

  create: (data: WebinarRequest) => api.post<WebinarDto>("/webinars", data),

  update: (id: number, data: WebinarRequest) => api.put<WebinarDto>(`/webinars/${id}`, data),

  cancel: (id: number) => api.delete(`/webinars/${id}`),

  getAttendees: (id: number) => api.get<AttendeeDto[]>(`/webinars/${id}/attendees`),
};

export const communicationApi = {
  sendNotification: (data: NotificationRequest) => api.post<CampaignDto>("/notifications/send", data),

  getCampaigns: () => api.get<CampaignDto[]>("/notifications/campaigns"),

  getAllFaqs: () => api.get<FaqDto[]>("/faq"),

  createFaq: (data: FaqRequest) => api.post<FaqDto>("/faq", data),

  updateFaq: (id: number, data: FaqRequest) => api.put<FaqDto>(`/faq/${id}`, data),

  deleteFaq: (id: number) => api.delete(`/faq/${id}`),

  getAllAnnouncements: () => api.get<AnnouncementDto[]>("/announcements"),

  createAnnouncement: (data: AnnouncementRequest) =>
    api.post<AnnouncementDto>("/announcements", data),

  toggleAnnouncement: (id: number) => api.put<AnnouncementDto>(`/announcements/${id}/toggle`),

  deleteAnnouncement: (id: number) => api.delete(`/announcements/${id}`),
};

export const learnerApi = {
  getMyCourses: () => api.get<EnrollmentDto[]>("/lms/my-courses"),

  getCourseProgress: (courseId: number) =>
    api.get<CourseProgressDto>(`/lms/course/${courseId}/progress`),

  getMyCertificates: () => api.get<CertificateDto[]>("/lms/certificate/my"),

  downloadCertificate: (id: number) =>
    api.get(`/lms/certificate/${id}/download`, {
      responseType: "blob",
    }),

  shareCertificate: (id: number) => api.post(`/lms/certificate/${id}/share`),
};

export const progressApi = {
  save: (
    lectureId: number,
    data: {
      watchedSeconds: number;
      completionPercentage: number;
      lastPosition: number;
    }
  ) => api.post(`/lms/video/${lectureId}/progress`, data),

  get: (lectureId: number) => api.get(`/lms/video/${lectureId}/progress`),

  getLastWatched: (courseId: number) => api.get(`/lms/course/${courseId}/last-watched`),

  getCourseProgress: (courseId: number) => api.get(`/lms/course/${courseId}/progress`),

  isSectionUnlocked: (courseId: number, sectionId: number) =>
    api.get(`/lms/course/${courseId}/section/${sectionId}/unlocked`),
};

export const analyticsApi = {
  getDashboard: () => api.get<AnalyticsDashboardDto>("/analytics/dashboard"),

  getEnrollmentsOverTime: (days = 30) =>
    api.get<DailyEnrollmentDto[]>(`/analytics/enrollments-over-time?days=${days}`),

  getCompletionRates: () => api.get<CourseCompletionRateDto[]>("/analytics/completion-rates"),

  getLearnersByRole: () => api.get<RoleCountDto[]>("/analytics/learners-by-role"),

  getQuizPassRates: () => api.get<QuizPassRateDto[]>("/analytics/quiz-pass-rates"),

  getRecentActivity: (limit = 20) =>
    api.get<ActivityLogDto[]>(`/analytics/recent-activity?limit=${limit}`),
};

export const adminCourseApi = {
  getAllCourses: () => api.get<AdminCourseDto[]>("/courses?admin=true"),

  getCategories: () => api.get<Category[]>("/courses/categories"),

  getAllCoursesIncludingArchived: () =>
    api.get<AdminCourseDto[]>("/courses?includeArchived=true"),

  getArchivedCourses: () => api.get<AdminCourseDto[]>("/courses/archived"),

  publishCourse: (id: number) => api.put<AdminCourseDto>(`/courses/${id}/publish`),

  unpublishCourse: (id: number) => api.put<AdminCourseDto>(`/courses/${id}/unpublish`),

  archiveCourse: (id: number) => api.put<AdminCourseDto>(`/courses/${id}/archive`),

  restoreCourse: (id: number) => api.put<AdminCourseDto>(`/courses/${id}/restore`),

  deleteCourse: (id: number) => api.delete(`/courses/${id}`),
};

export const userManagementApi = {
  getAllUsers: (params: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
  }) => api.get<PagedResponse<UserDto>>("/admin/users", { params }),

  changeRole: (id: number, data: RoleChangeRequest) =>
    api.put<UserDto>(`/admin/users/${id}/role`, data),

  toggleStatus: (id: number, data: StatusRequest) =>
    api.put<UserDto>(`/admin/users/${id}/status`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  resetPassword: (id: number) => api.post(`/admin/users/${id}/reset-password`),
};

export const systemLogsApi = {
  getActivityLogs: (params: {
    page?: number;
    size?: number;
    activityType?: string;
    username?: string;
    from?: string;
    to?: string;
  }) => api.get<PagedResponse<ActivityLogEntry>>("/admin/logs/activity", { params }),

  exportActivityLogs: () =>
    api.get("/admin/logs/export", {
      responseType: "blob",
    }),
};

export const integrationApi = {
  getStats: () => api.get<SyncStatsDto>("/admin/integrations/stats"),

  getLogs: (params?: {
    systemName?: string;
    status?: string;
    page?: number;
    size?: number;
  }) => api.get<PagedResponse<SyncLogDto>>("/admin/integrations/logs", { params }),

  getById: (id: number) => api.get<SyncLogDto>(`/admin/integrations/logs/${id}`),

  triggerSync: (data: SyncRequestDto) => api.post<SyncLogDto>("/admin/integrations/trigger", data),

  retrySync: (id: number) => api.post<SyncLogDto>(`/admin/integrations/logs/${id}/retry`),

  exportCsv: () =>
    api.get("/admin/integrations/export", {
      responseType: "blob",
    }),
};

export const versionApi = {
  getVersionHistory: (courseId: number, sectionId: number, lectureId: number) =>
    api.get<ContentVersionDto[]>(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/versions`
    ),


  uploadNewVersion: (
    courseId: number,
    sectionId: number,
    lectureId: number,
    file: File,
    changeNotes: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("changeNotes", changeNotes);
    return api.post<ContentVersionDto>(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/versions`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  rollbackToVersion: (courseId: number, sectionId: number, lectureId: number, versionId: number) =>
    api.put<ContentVersionDto>(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/versions/${versionId}/rollback`
    ),
};

export const searchApi = {
  search: (q: string, limit = 20) =>
    api.get<SearchResponseDto>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  filter: (params: SearchFilterDto) =>
    api.get<SearchResultDto[]>("/search/filter", { params }),

  suggest: (q: string) =>
    api.get<string[]>(`/search/suggest?q=${encodeURIComponent(q)}`),
};

export const helpApi = {
  getByPage: (pageId: string) => api.get<HelpArticleDto[]>(`/help/page/${pageId}`),

  getContextual: (pageId: string, fieldId?: string) =>
    api.get<ContextualHelpDto>(`/help/context?pageId=${pageId}${fieldId ? `&fieldId=${fieldId}` : ""}`),

  getById: (id: number) => api.get<HelpArticleDto>(`/help/${id}`),

  search: (q?: string) =>
    api.get<HelpArticleDto[]>(`/help/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  getAllAdmin: () => api.get<HelpArticleDto[]>("/help/admin/all"),

  create: (data: HelpArticleRequest) => api.post<HelpArticleDto>("/help", data),

  update: (id: number, data: HelpArticleRequest) => api.put<HelpArticleDto>(`/help/${id}`, data),

  toggle: (id: number) => api.put<HelpArticleDto>(`/help/${id}/toggle`),

  delete: (id: number) => api.delete(`/help/${id}`),
};

export default api;
