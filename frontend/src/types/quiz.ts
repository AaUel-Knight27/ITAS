export type QuestionType = "MCQ" | "TRUE_FALSE" | string;

export interface AssessmentQuestionOption {
  id: number | string;
  label?: string;
  text: string;
  value?: string;
}

export interface AssessmentQuestion {
  id: number | string;
  questionText: string;
  type: QuestionType;
  options?: AssessmentQuestionOption[] | string[];
  orderIndex: number;
}

export interface Assessment {
  id: number | string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts?: number;
  totalQuestions?: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentAttempt {
  id: number | string;
  assessmentId: number | string;
  score?: number;
  passed?: boolean;
  submittedAt?: string;
}

export interface AssessmentResultQuestion {
  questionId: number | string;
  questionText?: string;
  selectedAnswer?: string | boolean;
  correctAnswer?: string | boolean;
  correct: boolean;
}

export interface AssessmentResult {
  attemptId: number | string;
  assessmentId: number | string;
  score: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  attemptsRemaining?: number;
  certificateId?: number | string;
  certificateCode?: string;
  questionResults?: AssessmentResultQuestion[];
}

export interface Certificate {
  id: number | string;
  code: string;
  learnerName?: string;
  courseName: string;
  issuedAt: string;
  downloadUrl?: string;
}
