"use client";

import confetti from "canvas-confetti";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

import type { Assessment, AssessmentResult } from "@/types";

type QuizResultProps = {
  assessment: Assessment;
  result: AssessmentResult;
  answers: Record<string, string | boolean>;
  onTryAgain: () => void;
  onDownloadCertificate?: () => void;
  isDownloadingCertificate?: boolean;
};

export default function QuizResult({
  assessment,
  result,
  answers,
  onTryAgain,
  onDownloadCertificate,
  isDownloadingCertificate = false,
}: QuizResultProps) {
  useEffect(() => {
    if (!result.passed) return;
    void confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.65 },
    });
  }, [result.passed]);

  const questionResultsMap = new Map((result.questionResults ?? []).map((item) => [String(item.questionId), item]));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-5xl font-bold text-slate-900">{Math.round(result.score)}%</p>
        <p className={`mt-2 text-lg font-semibold ${result.passed ? "text-emerald-600" : "text-rose-600"}`}>
          {result.passed ? "PASSED" : "FAILED"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Correct: {result.correctCount} | Incorrect: {result.incorrectCount}
        </p>

        {result.passed ? (
          <button
            type="button"
            onClick={onDownloadCertificate}
            disabled={!onDownloadCertificate || isDownloadingCertificate}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloadingCertificate ? "Preparing PDF..." : "Download Certificate"}
          </button>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-600">Attempts remaining: {result.attemptsRemaining ?? "N/A"}</p>
            <button
              type="button"
              onClick={onTryAgain}
              className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Question Review</h3>
        <ul className="mt-4 space-y-3">
          {assessment.questions.map((question, index) => {
            const row = questionResultsMap.get(String(question.id));
            const selectedAnswer = row?.selectedAnswer ?? answers[String(question.id)];
            const isCorrect = row?.correct ?? false;

            return (
              <li key={question.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 text-rose-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Q{index + 1}. {question.questionText}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Your answer: {String(selectedAnswer ?? "Not answered")}</p>
                    {row?.correctAnswer !== undefined ? (
                      <p className="text-xs text-slate-600">Correct answer: {String(row.correctAnswer)}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
