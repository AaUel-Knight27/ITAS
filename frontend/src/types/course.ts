export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
}

export interface Lecture {
  id: number | string;
  title: string;
  description?: string;
  durationMinutes?: number;
  durationSeconds?: number | null;
  orderIndex: number;
  type?: "VIDEO" | "PDF" | "TEXT" | "QUIZ" | string;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  content?: string | null;
  contentHtml?: string;
  contentUrl?: string;
  thumbnailUrl?: string | null;
  assessmentId?: number | string;
  quizQuestionCount?: number;
  preview?: boolean;
  isPreview?: boolean;
  isLocked?: boolean;
}

export interface CourseSection {
  id: number | string;
  title: string;
  description?: string;
  orderIndex: number;
  lectures: Lecture[];
}

export interface Course {
  id: number | string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  published: boolean;
  category: Category;
  categoryId?: number | string;
  categoryName?: string;
  categoryDescription?: string;
  targetAudience?: string[];
  sections?: CourseSection[];
  enrolled?: boolean;
}
