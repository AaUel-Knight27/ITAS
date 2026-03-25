import { create } from 'zustand';
import type { Assessment, AssessmentResult } from '@/types';
import { getAssessment, submitAssessment, getAttemptResult } from '@/lib/api/quiz';

interface AssessmentState {
  assessment: Assessment | null;
  answers: Record<string, string | boolean>;
  result: AssessmentResult | null;
  currentIndex: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  loadAssessment: (id: number | string) => Promise<void>;
  setAnswer: (questionId: number | string, value: string | boolean) => void;
  nextQuestion: () => void;
  submit: () => Promise<AssessmentResult | null>;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessment: null,
  answers: {},
  result: null,
  currentIndex: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadAssessment: async (id) => {
    set({ isLoading: true, error: null, answers: {}, result: null, currentIndex: 0 });
    try {
      const data = await getAssessment(id);
      set({ assessment: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load assessment', isLoading: false });
    }
  },

  setAnswer: (questionId, value) => {
    set((state) => ({
      answers: { ...state.answers, [String(questionId)]: value }
    }));
  },

  nextQuestion: () => {
    set((state) => ({ currentIndex: state.currentIndex + 1 }));
  },

  submit: async () => {
    const { assessment, answers } = get();
    if (!assessment) return null;

    set({ isSubmitting: true, error: null });
    try {
      const attempt = await submitAssessment(assessment.id, answers);
      const attemptResult = await getAttemptResult(attempt.id);
      set({ result: attemptResult, isSubmitting: false });
      return attemptResult;
    } catch (err: any) {
      const message = err.response?.status === 400 
        ? "Submission rejected. Please ensure all answers are selected." 
        : "Failed to submit quiz.";
      set({ error: message, isSubmitting: false });
      return null;
    }
  },

  reset: () => {
    set({ result: null, answers: {}, currentIndex: 0, error: null });
  }
}));
