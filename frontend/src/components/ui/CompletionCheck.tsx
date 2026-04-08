"use client";

import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  onDone?: () => void;
}

export default function CompletionCheck({ show, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!show) {
      return;
    }

    setVisible(true);
    setAnimating(true);

    const timer = window.setTimeout(() => {
      setAnimating(false);
      window.setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 300);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [onDone, show]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        animating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-2xl shadow-green-500/50 transition-transform duration-500 ${
          animating ? "scale-100" : "scale-150"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-12 w-12 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline
            points="20 6 9 17 4 12"
            className={`transition-all duration-700 ${animating ? "opacity-100" : "opacity-0"}`}
            style={{
              strokeDasharray: 20,
              strokeDashoffset: animating ? 0 : 20,
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
