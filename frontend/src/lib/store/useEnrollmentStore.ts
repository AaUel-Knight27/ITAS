import { create } from 'zustand';
import type { Enrollment, CourseProgress } from '@/types';
import { getMyCourses, getCourseProgress } from '@/lib/api/enrollment';

interface EnrollmentState {
  enrollments: Enrollment[];
  progressMap: Record<string, CourseProgress>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyEnrollments: () => Promise<void>;
  fetchProgress: (courseId: number | string) => Promise<void>;
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: [],
  progressMap: {},
  isLoading: false,
  error: null,

  fetchMyEnrollments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMyCourses();
      set({ enrollments: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch enrollments', isLoading: false });
    }
  },

  fetchProgress: async (courseId) => {
    try {
      const data = await getCourseProgress(courseId);
      set((state) => ({
        progressMap: {
          ...state.progressMap,
          [String(courseId)]: data
        }
      }));
    } catch (err) {
      console.error(`Failed to fetch progress for course ${courseId}`, err);
    }
  }
}));
