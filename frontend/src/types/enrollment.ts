export interface Enrollment {
  id: number | string;
  courseId: number | string;
  courseSlug: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  courseThumbnail?: string;
  thumbnailUrl?: string;
  progressPercent: number;
  lastLectureId?: number | string;
  enrolledAt?: string;
  updatedAt?: string;
}

export interface VideoProgress {
  id?: number | string;
  lectureId: number | string;
  lectureTitle?: string;
  watchedSeconds: number;
  completionPercentage?: number;
  lastPosition: number;
  lastWatchedAtDisplay?: string | null;
  completed?: boolean;
  updatedAt?: string;
}

export interface LectureCompletion {
  lectureId: number | string;
  completed: boolean;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: number | string;
  percent?: number;
  progressPercent?: number;
  totalLectures?: number;
  completedLectures?: number;
  completedLectureIds?: Array<number | string>;
  lastLectureId?: number | string;
  videoProgress?: VideoProgress[];
}
