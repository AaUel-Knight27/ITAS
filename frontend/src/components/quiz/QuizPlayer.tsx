"use client";

import { useEffect, useMemo } from "react";
import { useAssessmentStore, useCertificateStore } from "@/lib/store";
import type { AssessmentQuestion, AssessmentResult } from "@/types";
import QuizResult from "@/components/quiz/QuizResult";

type QuizPlayerProps = {
  assessmentId: number | string;
  canDownloadCertificate?: boolean;
  onResult?: (result: AssessmentResult) => void;
};

function normalizeOptions(question: AssessmentQuestion): Array<{ key: string; label: string; value: string }> {
  if (!question.options) return [];

  return question.options.map((option, index) => {
    if (typeof option === "string") {
      return { key: `${question.id}-${index}`, label: option, value: option };
    }

    return {
      key: String(option.id ?? `${question.id}-${index}`),
      label: option.label ? `${option.label}. ${option.text}` : option.text,
      value: option.value ?? option.text,
    };
  });
}

export default function QuizPlayer({ assessmentId, canDownloadCertificate = true, onResult }: QuizPlayerProps) {
  const { 
    assessment, 
    answers, 
    result, 
    currentIndex, 
    isLoading, 
    isSubmitting, 
    error,
    loadAssessment, 
    setAnswer, 
    nextQuestion,
    submit, 
    reset 
  } = useAssessmentStore();
  
  const { triggerDownload, downloadMap } = useCertificateStore();
  const isDownloadingCertificate = result?.certificateId ? downloadMap[String(result.certificateId)] : false;

  useEffect(() => {
    void loadAssessment(assessmentId);
    return () => reset(); // Clean up when unmounting
  }, [assessmentId, loadAssessment, reset]);

  const questions = useMemo(() => {
    return [...(assessment?.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [assessment?.questions]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasCurrentAnswer = currentQuestion ? answers[String(currentQuestion.id)] !== undefined : false;
  const progress = totalQuestions === 0 ? 0 : Math.round(((currentIndex + 1) / totalQuestions) * 100);

  function handleSelectAnswer(questionId: number | string, value: string | boolean) {
    setAnswer(questionId, value);
  }

  function handleNext() {
    if (!hasCurrentAnswer || isLastQuestion) return;
    nextQuestion();
  }

  async function handleSubmit() {
    if (!assessment || answeredCount < totalQuestions) return;
    if (!window.confirm("Are you sure you want to submit?")) return;

    const attemptResult = await submit();
    if (attemptResult) {
      onResult?.(attemptResult);
    }
  }

  async function handleDownloadCertificate() {
    if (!result?.certificateId) return;
    await triggerDownload(result.certificateId);
  }

  function handleTryAgain() {
    reset();
    void loadAssessment(assessmentId);
  }

  if (isLoading) {
    return <div className="text-slate-700">Loading quiz...</div>;
  }

  if (!assessment || !currentQuestion) {
    return <div className="text-slate-700">Quiz unavailable.</div>;
  }

  if (result) {
    return (
      <QuizResult
        assessment={assessment}
        result={result}
        answers={answers}
        onTryAgain={handleTryAgain}
        onDownloadCertificate={canDownloadCertificate && result.certificateId ? handleDownloadCertificate : undefined}
        isDownloadingCertificate={isDownloadingCertificate}
      />
    );
  }

  const options = normalizeOptions(currentQuestion);
  const selectedValue = answers[String(currentQuestion.id)];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{currentQuestion.questionText}</h3>

      <div className="mt-4 space-y-3">
        {String(currentQuestion.type).toUpperCase() === "TRUE_FALSE" ? (
          <div className="flex gap-3">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => handleSelectAnswer(currentQuestion.id, value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  selectedValue === value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {value ? "True" : "False"}
              </button>
            ))}
          </div>
        ) : (
          <fieldset className="space-y-2">
            {options.map((option) => (
              <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={selectedValue === option.value}
                  onChange={() => handleSelectAnswer(currentQuestion.id, option.value)}
                />
                <span className="text-sm text-slate-800">{option.label}</span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-6 flex justify-end">
        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={answeredCount < totalQuestions || isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasCurrentAnswer}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
