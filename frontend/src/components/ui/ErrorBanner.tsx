"use client";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">!</span>
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 shrink-0 font-medium text-red-600 underline hover:text-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}
