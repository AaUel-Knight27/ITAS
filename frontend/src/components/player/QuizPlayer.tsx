"use client";

import confetti from "canvas-confetti";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import api from "@/lib/api";

interface Question {
  id: number;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

interface Assessment {
  id: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

interface QuestionResult {
  questionId: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  correct: boolean;
  points: number;
}

interface AttemptResult {
  attemptId: number;
  assessmentId: number;
  score: number;
  passed: boolean;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  passingScore: number;
  attemptNumber: number;
  attemptsRemaining: number;
  questionResults: QuestionResult[];
  certificateId?: number;
  certificateCode?: string;
}

interface Props {
  courseId: number;
  lectureId: number;
  onComplete?: () => void;
}

type QuizMode = "loading" | "error" | "quiz" | "feedback" | "result" | "review";

function normalizeAnswer(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getQuestionOptions(question: Question) {
  if (question.questionType === "TRUE_FALSE") {
    return ["True", "False"];
  }
  return question.options ?? [];
}

function ProgressDots({
  questions,
  currentQuestionId,
  answers,
  results,
}: {
  questions: Question[];
  currentQuestionId: number | null;
  answers: Record<number, string>;
  results: Record<number, boolean>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {questions.map((question) => {
        const answered = answers[question.id] !== undefined;
        const hasResult = Object.prototype.hasOwnProperty.call(results, question.id);
        const isCorrect = results[question.id];
        const isCurrent = question.id === currentQuestionId;

        return (
          <div
            key={question.id}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              isCurrent
                ? "scale-125 bg-blue-500"
                : hasResult
                  ? isCorrect
                    ? "bg-green-500"
                    : "bg-red-500"
                  : answered
                    ? "bg-blue-300"
                    : "bg-gray-600"
            }`}
          />
        );
      })}
    </div>
  );
}

function FeedbackBanner({
  correct,
  correctAnswer,
  explanation,
  onNext,
  isLast,
}: {
  correct: boolean;
  correctAnswer: string;
  explanation?: string;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        correct ? "border-green-700 bg-green-900/30" : "border-red-700 bg-red-900/30"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`text-sm font-semibold ${correct ? "text-green-400" : "text-red-400"}`}>
          {correct ? "Correct" : "Incorrect"}
        </span>
      </div>

      {!correct ? (
        <p className="mb-2 text-sm text-gray-300">
          <span className="text-gray-400">Correct answer: </span>
          <span className="font-medium text-white">{correctAnswer}</span>
        </p>
      ) : null}

      {explanation ? (
        <p className="mt-2 rounded-lg bg-gray-800/60 px-3 py-2 text-sm leading-relaxed text-gray-300">{explanation}</p>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {isLast ? "See Results" : "Next Question"}
      </button>
    </div>
  );
}

function ResultScreen({
  result,
  onRetryAll,
  onRetryWrong,
  onReview,
  onComplete,
}: {
  result: AttemptResult;
  onRetryAll: () => void;
  onRetryWrong: () => void;
  onReview: () => void;
  onComplete: () => void;
}) {
  const wrongCount = result.incorrectAnswers || 0;

  useEffect(() => {
    if (!result.passed) {
      return;
    }

    void confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });
  }, [result.passed]);

  return (
    <div className="flex min-h-96 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <div
          className={`rounded-2xl border p-8 text-center ${
            result.passed ? "border-green-700 bg-green-900/20" : "border-red-700 bg-red-900/20"
          }`}
        >
          <h2 className={`mb-1 text-2xl font-bold ${result.passed ? "text-green-400" : "text-red-400"}`}>
            {result.passed ? "You Passed" : "Not Yet"}
          </h2>

          <div className="my-4">
            <div className={`text-5xl font-bold ${result.passed ? "text-green-400" : "text-red-400"}`}>
              {Math.round(result.score)}%
            </div>
            <p className="mt-1 text-xs text-gray-500">Passing score: {result.passingScore}%</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-900/50 p-4">
            <div>
              <p className="text-2xl font-bold text-green-400">{result.correctAnswers}</p>
              <p className="mt-0.5 text-xs text-gray-500">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{result.incorrectAnswers}</p>
              <p className="mt-0.5 text-xs text-gray-500">Wrong</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-300">{result.totalQuestions}</p>
              <p className="mt-0.5 text-xs text-gray-500">Total</p>
            </div>
          </div>

          {!result.passed ? (
            <p className="mt-3 text-xs text-gray-500">
              {result.attemptsRemaining > 0
                ? `${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remaining`
                : "No attempts remaining"}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          {result.passed ? (
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Continue Learning
            </button>
          ) : null}

          <button
            type="button"
            onClick={onReview}
            className="w-full rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800"
          >
            Review Answers
          </button>

          {!result.passed && result.attemptsRemaining > 0 && wrongCount > 0 ? (
            <button
              type="button"
              onClick={onRetryWrong}
              className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700"
            >
              Retry Wrong Questions Only ({wrongCount})
            </button>
          ) : null}

          {!result.passed && result.attemptsRemaining > 0 ? (
            <button
              type="button"
              onClick={onRetryAll}
              className="w-full rounded-xl border border-gray-600 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-800"
            >
              Retry All Questions
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReviewScreen({
  questions,
  questionResults,
  onBack,
}: {
  questions: Question[];
  questionResults: QuestionResult[];
  onBack: () => void;
}) {
  const resultMap = useMemo(
    () => new Map(questionResults.map((questionResult) => [questionResult.questionId, questionResult])),
    [questionResults]
  );

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
        <h3 className="text-sm font-semibold text-white">Question Review</h3>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
        >
          Back to Results
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {questions.map((question, index) => {
            const row = resultMap.get(question.id);
            const isCorrect = row?.correct ?? false;

            return (
              <div
                key={question.id}
                className={`rounded-xl border p-5 ${
                  isCorrect ? "border-green-800 bg-green-900/10" : "border-red-800 bg-red-900/10"
                }`}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div>
                    <p className="mb-1 text-xs text-gray-500">
                      Question {index + 1}
                      {question.points > 1 ? ` · ${question.points} pts` : ""}
                    </p>
                    <p className="text-sm font-medium leading-snug text-white">{question.questionText}</p>
                  </div>
                </div>

                <div className="ml-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 text-xs text-gray-500">Your answer:</span>
                    <span className={`text-xs font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                      {row?.selectedAnswer || "Not answered"}
                    </span>
                  </div>

                  {!isCorrect ? (
                    <div className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-xs text-gray-500">Correct:</span>
                      <span className="text-xs font-medium text-green-400">{row?.correctAnswer}</span>
                    </div>
                  ) : null}

                  {row?.explanation ? (
                    <div className="mt-3 rounded-lg bg-gray-800/60 p-3 text-xs leading-relaxed text-gray-300">
                      {row.explanation}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const QuizPlayer = memo(function QuizPlayer({ courseId, lectureId, onComplete }: Props) {
  const [mode, setMode] = useState<QuizMode>("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedbackQuestion, setFeedbackQuestion] = useState<Question | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [questionResults, setQuestionResults] = useState<Record<number, boolean>>({});

  const isRetryModeRef = useRef(false);
  const baseAnswersRef = useRef<Record<number, string>>({});
  const lastSubmittedAnswersRef = useRef<Record<number, string>>({});

  const loadAssessment = useCallback(async () => {
    setMode("loading");
    setError("");

    try {
      let data: Assessment | null = null;

      try {
        const lectureResponse = await api.get<Assessment>(`/lms/assessment/lecture/${lectureId}`);
        data = lectureResponse.data;
      } catch (lectureError: unknown) {
        const maybeStatus =
          typeof lectureError === "object" && lectureError !== null && "response" in lectureError
            ? (lectureError as { response?: { status?: number } }).response?.status
            : undefined;
        if (maybeStatus && maybeStatus !== 404) {
          throw lectureError;
        }

        const courseResponse = await api.get<Assessment>(`/lms/assessment/course/${courseId}`);
        data = courseResponse.data;
      }

      if (!data) {
        setError("No quiz found for this lesson.");
        setMode("error");
        return;
      }

      setAssessment(data);
      setActiveQuestions(data.questions ?? []);
      setCurrentIndex(0);
      setAnswers({});
      setFeedbackQuestion(null);
      setQuestionResults({});
      setResult(null);
      isRetryModeRef.current = false;
      baseAnswersRef.current = {};
      lastSubmittedAnswersRef.current = {};
      setMode("quiz");
    } catch {
      setError("Could not load quiz. Please try again.");
      setMode("error");
    }
  }, [courseId, lectureId]);

  useEffect(() => {
    void loadAssessment();
  }, [loadAssessment]);

  const handleAnswer = useCallback((questionId: number, answer: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    const question = activeQuestions[currentIndex];
    if (!question) {
      return;
    }

    const answer = answers[question.id];
    if (!answer) {
      setError("Please select an answer.");
      return;
    }

    const isCorrect = normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);

    setError("");
    setLastAnswerCorrect(isCorrect);
    setFeedbackQuestion(question);
    setQuestionResults((previous) => ({
      ...previous,
      [question.id]: isCorrect,
    }));
    setMode("feedback");
  }, [activeQuestions, answers, currentIndex]);

  const handleFinalSubmit = useCallback(async () => {
    if (!assessment) {
      return;
    }

    const submissionAnswers = assessment.questions.reduce<Record<number, string>>((accumulator, question) => {
      accumulator[question.id] = answers[question.id] ?? baseAnswersRef.current[question.id] ?? "";
      return accumulator;
    }, {});

    setSubmitting(true);
    try {
      const response = await api.post<AttemptResult>("/lms/assessment/submit", {
        assessmentId: assessment.id,
        answers: submissionAnswers,
      });

      lastSubmittedAnswersRef.current = submissionAnswers;
      setResult(response.data);
      setMode("result");
    } catch (submissionError: unknown) {
      const message =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "response" in submissionError &&
        (submissionError as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (submissionError as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Submission failed. Please try again.";
      setError(message ?? "Submission failed. Please try again.");
      setMode("quiz");
    } finally {
      setSubmitting(false);
    }
  }, [answers, assessment]);

  const handleNext = useCallback(() => {
    const isLastQuestion = currentIndex >= activeQuestions.length - 1;

    if (isLastQuestion) {
      void handleFinalSubmit();
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setFeedbackQuestion(null);
    setMode("quiz");
  }, [activeQuestions.length, currentIndex, handleFinalSubmit]);

  const handleRetryAll = useCallback(() => {
    if (!assessment) {
      return;
    }

    isRetryModeRef.current = true;
    baseAnswersRef.current = {};
    setActiveQuestions(assessment.questions ?? []);
    setAnswers({});
    setQuestionResults({});
    setCurrentIndex(0);
    setFeedbackQuestion(null);
    setResult(null);
    setError("");
    setMode("quiz");
  }, [assessment]);

  const handleRetryWrong = useCallback(() => {
    if (!assessment || !result) {
      return;
    }

    const wrongIds = new Set(result.questionResults.filter((question) => !question.correct).map((question) => question.questionId));
    const wrongQuestions = assessment.questions.filter((question) => wrongIds.has(question.id));
    if (wrongQuestions.length === 0) {
      return;
    }

    isRetryModeRef.current = true;
    baseAnswersRef.current = { ...lastSubmittedAnswersRef.current };
    setActiveQuestions(wrongQuestions);
    setAnswers({});
    setQuestionResults({});
    setCurrentIndex(0);
    setFeedbackQuestion(null);
    setResult(null);
    setError("");
    setMode("quiz");
  }, [assessment, result]);

  const question = activeQuestions[currentIndex] ?? null;
  const currentQuestionId = question?.id ?? null;
  const selectedAnswer = currentQuestionId !== null ? answers[currentQuestionId] : undefined;
  const totalQuestions = activeQuestions.length;
  const answeredCount = activeQuestions.filter((entry) => answers[entry.id] !== undefined).length;
  const progressPct = totalQuestions === 0 ? 0 : Math.round((currentIndex / totalQuestions) * 100);

  if (mode === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (mode === "error" || !assessment) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center">
        <div>
          <p className="mb-4 text-sm text-gray-400">{error || "Quiz not available"}</p>
          <button
            type="button"
            onClick={() => void loadAssessment()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (mode === "result" && result) {
    return (
      <ResultScreen
        result={result}
        onRetryAll={handleRetryAll}
        onRetryWrong={handleRetryWrong}
        onReview={() => setMode("review")}
        onComplete={() => onComplete?.()}
      />
    );
  }

  if (mode === "review" && result) {
    return <ReviewScreen questions={assessment.questions} questionResults={result.questionResults} onBack={() => setMode("result")} />;
  }

  if (!question) {
    return null;
  }

  const options = getQuestionOptions(question);

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-6 py-3">
        <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{assessment.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Pass: {assessment.passingScore}% · {answeredCount}/{totalQuestions} answered
              {isRetryModeRef.current ? " · Retry" : ""}
            </p>
          </div>

          <ProgressDots
            questions={activeQuestions}
            currentQuestionId={currentQuestionId}
            answers={answers}
            results={questionResults}
          />
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="h-1.5 w-full rounded-full bg-gray-800">
            <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          {error && mode === "quiz" ? (
            <div className="mb-4 rounded-xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-400">{error}</div>
          ) : null}

          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-blue-400">
            Question {currentIndex + 1} of {totalQuestions}
            {question.points > 1 ? <span className="ml-2 text-gray-500">({question.points} points)</span> : null}
          </p>

          <h3 className="mb-6 text-lg font-medium leading-relaxed text-white">{question.questionText}</h3>

          <div className="mb-6 space-y-3">
            {options.map((option, index) => {
              const letter = question.questionType === "TRUE_FALSE" ? option.charAt(0).toUpperCase() : String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === option;
              const isCorrectOption = mode === "feedback" && normalizeAnswer(feedbackQuestion?.correctAnswer) === normalizeAnswer(option);
              const isWrongSelection = mode === "feedback" && isSelected && !lastAnswerCorrect;

              return (
                <button
                  key={`${question.id}-${index}`}
                  type="button"
                  onClick={() => {
                    if (mode !== "quiz") {
                      return;
                    }
                    handleAnswer(question.id, option);
                  }}
                  disabled={mode === "feedback"}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                    mode === "feedback"
                      ? isCorrectOption
                        ? "border-green-500 bg-green-900/30 text-green-300"
                        : isWrongSelection
                          ? "border-red-500 bg-red-900/30 text-red-300"
                          : "border-gray-700 text-gray-500"
                      : isSelected
                        ? "border-blue-500 bg-blue-900/30 text-blue-300"
                        : "border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                      mode === "feedback"
                        ? isCorrectOption
                          ? "border-green-500 bg-green-500 text-white"
                          : isWrongSelection
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-600 text-gray-500"
                        : isSelected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-600 text-gray-400"
                    }`}
                  >
                    {letter}
                  </span>

                  <span className="flex-1 leading-snug">{option}</span>
                  {mode === "feedback" && isCorrectOption ? <span className="shrink-0 text-green-400">OK</span> : null}
                  {mode === "feedback" && isWrongSelection ? <span className="shrink-0 text-red-400">X</span> : null}
                </button>
              );
            })}
          </div>

          {mode === "feedback" && feedbackQuestion ? (
            <FeedbackBanner
              correct={lastAnswerCorrect}
              correctAnswer={feedbackQuestion.correctAnswer || ""}
              explanation={feedbackQuestion.explanation}
              onNext={handleNext}
              isLast={currentIndex >= totalQuestions - 1}
            />
          ) : null}

          {mode === "quiz" ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Check Answer"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default QuizPlayer;
