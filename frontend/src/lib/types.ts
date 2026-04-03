export interface WebinarDto {
  id: number;
  title: string;
  description: string;
  presenterName: string;
  scheduledAt: string;
  durationMinutes: number;
  maxAttendees: number;
  registeredCount: number;
  meetingLink: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface WebinarRequest {
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  maxAttendees: number;
  meetingLink: string;
}

export interface AttendeeDto {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  registeredAt: string;
  attended: boolean;
}

export interface CampaignDto {
  id: number;
  title: string;
  message: string;
  audienceType: string;
  sendNow: boolean;
  scheduledAt: string | null;
  status: string;
  createdByUsername: string;
  createdAt: string;
  deliveryCount: number;
}

export interface NotificationRequest {
  title: string;
  message: string;
  audienceType: string;
  sendNow: boolean;
  scheduledAt?: string;
}

export interface FaqDto {
  id: number;
  question: string;
  answer: string;
  category: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqRequest {
  question: string;
  answer: string;
  category: string;
}

export interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  audienceType: string;
  isActive: boolean;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  audienceType: string;
  isActive: boolean;
}

export interface EnrollmentDto {
  id: number;
  courseId: number;
  courseTitle: string;
  courseThumbnail: string | null;
  courseThumbnailUrl?: string | null;
  thumbnailUrl?: string | null;
  courseSlug: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  progressPercent: number;
  lastLectureId?: number | null;
  enrolledAt: string;
  completedAt: string | null;
}

export interface CertificateDto {
  id: number;
  courseTitle: string;
  certificateCode: string;
  verificationUuid?: string;
  verifyUrl?: string;
  issuedAt: string;
  filePath: string | null;
  status?: string;
}

export interface CourseProgressDto {
  courseId: number;
  progressPercent: number;
  completedLectureIds?: number[];
  lastLectureId: number | null;
  lastLectureTitle: string | null;
  courseSlug: string | null;
}

export interface AnalyticsDashboardDto {
  totalUsers: number;
  activeLearners: number;
  totalCompletions: number;
  totalCertificates: number;
  avgQuizScore: number;
}

export interface DailyEnrollmentDto {
  date: string;
  count: number;
}

export interface CourseCompletionRateDto {
  courseName: string;
  completionRate: number;
}

export interface RoleCountDto {
  role: string;
  count: number;
}

export interface QuizPassRateDto {
  courseName: string;
  passRate: number;
}

export interface ActivityLogDto {
  username: string;
  activityType: string;
  courseName: string;
  timestamp: string;
}

export interface AdminCourseDto {
  id: number;
  title: string;
  slug: string;
  description: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  published: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  totalSections: number;
  totalLectures: number;
  createdAt: string;
  archivedAt: string | null;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  status: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RoleChangeRequest {
  role: string;
}

export interface StatusRequest {
  status: string;
}

export interface ActivityLogEntry {
  id: number;
  username: string;
  activityType: string;
  resourceId: string | null;
  createdAt: string;
}

export interface ContentVersionDto {
  id: number;
  lectureId: number;
  lectureTitle: string;
  versionNumber: number;
  filePath: string;
  fileType: string;
  fileSize: number | null;
  changeNotes: string | null;
  uploadedByUsername: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SearchResultDto {
  type: "COURSE" | "LECTURE" | "CATEGORY";
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  categoryName: string | null;
  slug: string | null;
  relevanceScore: number | null;
  highlight: string | null;
}

export interface SearchResponseDto {
  query: string;
  totalResults: number;
  searchTimeMs: number;
  courses: SearchResultDto[];
  lectures: SearchResultDto[];
  suggestions: string[];
}

export interface SearchFilterDto {
  query?: string;
  category?: string;
  difficulty?: string;
  sortBy?: string;
}

export interface HelpArticleDto {
  id: number;
  title: string;
  content: string;
  pageId: string | null;
  fieldId: string | null;
  category: string | null;
  tags: string | null;
  isPublished: boolean;
  viewCount: number;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextualHelpDto {
  pageId: string;
  fieldId: string | null;
  articles: HelpArticleDto[];
}

export interface SyncLogDto {
  id: number;
  systemName: string;
  syncType: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage: string | null;
  triggeredByUsername: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  durationFormatted: string;
}

export interface SyncStatsDto {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  pendingSyncs: number;
  latestPerSystem: SyncLogDto[];
}

export interface SyncRequestDto {
  systemName: string;
  syncType: string;
}
