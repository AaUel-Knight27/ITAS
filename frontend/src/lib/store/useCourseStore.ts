import { create } from 'zustand';
import type { Course, Category } from '@/types';
import { getCourses, getCategories } from '@/lib/api/courses';

interface CourseState {
  courses: Course[];
  categories: Category[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourses: (role?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setCourse: (course: Course | null) => void;
  updateLocalCourse: (id: number | string, data: Partial<Course>) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  categories: [],
  selectedCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    // Avoid double fetching if already fetching
    if (get().isLoading && get().courses.length > 0) return;
    
    set({ isLoading: true, error: null });
    try {
      const data = await getCourses();
      set({ courses: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch courses', isLoading: false });
    }
  },

  fetchCategories: async () => {
    if (get().categories.length > 0) return; // simple cache
    try {
      const data = await getCategories();
      set({ categories: data });
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  },

  setCourse: (course) => set({ selectedCourse: course }),

  updateLocalCourse: (id, data) => {
    set((state) => ({
      courses: state.courses.map((c) => 
        String(c.id) === String(id) ? { ...c, ...data } : c
      ),
      selectedCourse: state.selectedCourse && String(state.selectedCourse.id) === String(id) 
        ? { ...state.selectedCourse, ...data } 
        : state.selectedCourse
    }));
  }
}));
