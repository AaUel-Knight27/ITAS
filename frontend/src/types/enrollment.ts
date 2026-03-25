export interface Enrollment {
  id: number | string;
  courseId: number | string;
  courseSlug: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  progressPercent: number;
  lastLectureId?: number | string;
  enrolledAt?: string;
  updatedAt?: string;
}

export interface VideoProgress {
  lectureId: number | string;
  watchedSeconds: number;
  lastPosition: number;
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
  percent: number;
  totalLectures?: number;
  completedLectures?: number;
  completedLectureIds?: Array<number | string>;
  lastLectureId?: number | string;
  videoProgress?: VideoProgress[];
}
