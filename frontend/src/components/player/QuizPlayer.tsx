"use client";

import { useEffect, useState } from "react";

import api from "@/lib/api";

interface Question {
  id: number;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE";
  options: string[];
  points: number | null;
}

interface Assessment {
  id: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

interface AssessmentResult {
  score: number;
  passed: boolean;
  correctAnswers?: Record<string, string>;
}

interface Props {
  courseId: number;
  lectureId: number;
  onComplete: () => void;
}

export default function QuizPlayer({ courseId, lectureId, onComplete }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchAssessment() {
      try {
        setLoading(true);
        setError("");
        setResult(null);
        setAnswers({});
        setCurrentQuestion(0);

        try {
          const response = await api.get<Assessment>(`/lms/assessment/lecture/${lectureId}`);
          if (active) setAssessment(response.data);
        } catch (lectureError: any) {
          if (lectureError?.response?.status !== 404) {
            throw lectureError;
          }

          const response = await api.get<Assessment>(`/lms/assessment/course/${courseId}`);
          if (active) setAssessment(response.data);
        }
      } catch (fetchError: any) {
        if (!active) return;
        if (fetchError?.response?.status === 404) {
          setError("No quiz was found for this lecture.");
        } else {
          setError("Could not load quiz. Please try again.");
        }
        setAssessment(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchAssessment();

    return () => {
      active = false;
    };
  }, [courseId, lectureId]);

  function handleAnswer(questionId: number, answer: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  }

  async function handleSubmit() {
    if (!assessment) return;

    const unanswered = assessment.questions.filter((question) => !answers[question.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post<AssessmentResult>("/lms/assessment/submit", {
        assessmentId: assessment.id,
        answers,
      });

      setResult(response.data);
      if (response.data.passed) {
        onComplete();
      }
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message ?? "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setError("");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center">
        <div>
          <p className="mb-3 text-4xl">Quiz</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const questions = assessment.questions ?? [];
  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  if (result) {
    const correctCount = Object.entries(result.correctAnswers ?? {}).filter(
      ([questionId, correctAnswer]) => answers[Number(questionId)] === correctAnswer
    ).length;

    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <div
          className={`w-full max-w-md rounded-2xl border p-8 text-center ${
            result.passed ? "border-green-700 bg-green-900/20" : "border-red-700 bg-red-900/20"
          }`}
        >
          <div className="mb-4 text-6xl">{result.passed ? "Pass" : "Retry"}</div>
          <h2 className={`mb-2 text-2xl font-bold ${result.passed ? "text-green-400" : "text-red-400"}`}>
            {result.passed ? "Congratulations!" : "Not Quite There"}
          </h2>
          <p className="mb-6 text-sm text-gray-400">
            {result.passed
              ? "You passed the quiz and completed this lecture."
              : `You need ${assessment.passingScore}% to pass. Review the lesson and try again.`}
          </p>

          <div className="mb-6 rounded-xl bg-gray-900 p-4">
            <p className="mb-1 text-sm text-gray-400">Your Score</p>
            <p className={`text-4xl font-bold ${result.passed ? "text-green-400" : "text-red-400"}`}>
              {Math.round(result.score)}%
            </p>
            <p className="mt-1 text-xs text-gray-500">Passing score: {assessment.passingScore}%</p>
          </div>

          <p className="mb-6 text-sm text-gray-400">
            {correctCount} / {totalQuestions} correct answers
          </p>

          {result.passed ? (
            <div className="rounded-xl border border-green-700 bg-green-600/20 px-6 py-2.5 text-sm text-green-400">
              Lecture Completed
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-xl border border-gray-600 px-6 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{assessment.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Passing score: {assessment.passingScore}% · {answeredCount}/{totalQuestions} answered
            </p>
          </div>

          <div className="flex gap-1">
            {questions.map((entry, index) => (
              <button
                key={`dot-${entry.id}-${index}`}
                type="button"
                onClick={() => setCurrentQuestion(index)}
                className={`h-2.5 w-2.5 rounded-full ${
                  index === currentQuestion ? "bg-blue-500" : answers[entry.id] ? "bg-green-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-2 max-w-3xl">
          <div className="h-1 w-full rounded-full bg-gray-800">
            <div
              className="h-1 rounded-full bg-blue-500 transition-all"
              style={{ width: totalQuestions === 0 ? "0%" : `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {error ? (
            <div className="mb-6 rounded-xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          {question ? (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-blue-400">
                Question {currentQuestion + 1} of {totalQuestions}
                {question.points && question.points > 1 ? (
                  <span className="ml-2 text-gray-500">({question.points} points)</span>
                ) : null}
              </p>

              <h3 className="mb-6 text-lg font-medium leading-relaxed text-white">{question.questionText}</h3>

              <div className="space-y-3">
                {(question.questionType === "TRUE_FALSE" ? ["True", "False"] : question.options ?? []).map(
                  (option, index) => {
                    const selected = answers[question.id] === option;
                    const badge =
                      question.questionType === "TRUE_FALSE" ? option.charAt(0).toUpperCase() : String.fromCharCode(65 + index);

                    return (
                      <button
                        key={
                          question.questionType === "TRUE_FALSE"
                            ? `q${question.id}-tf-${index}`
                            : `q${question.id}-opt-${index}`
                        }
                        type="button"
                        onClick={() => handleAnswer(question.id, option)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                          selected
                            ? "border-blue-500 bg-blue-900/30 text-blue-300"
                            : "border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                            selected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-600 text-gray-400"
                          }`}
                        >
                          {badge}
                        </span>
                        {option}
                      </button>
                    );
                  }
                )}
              </div>
            </>
          ) : null}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestion((previous) => Math.max(0, previous - 1))}
              disabled={currentQuestion === 0}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestion < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestion((previous) => previous + 1)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || answeredCount < totalQuestions}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : `Submit Quiz (${answeredCount}/${totalQuestions})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
