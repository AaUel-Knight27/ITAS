"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "fade" | "fade-up" | "fade-right" | "scale";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  once?: boolean;
  delay?: number;
  variant?: Variant;
};

const baseHidden = "opacity-0 translate-y-4";

const variantMap: Record<Variant, string> = {
  fade: "opacity-100 translate-y-0",
  "fade-up": "opacity-100 translate-y-0",
  "fade-right": "opacity-100 -translate-x-0",
  scale: "opacity-100 translate-y-0 scale-100",
};

export default function ScrollReveal({
  children,
  className = "",
  once = true,
  delay = 0,
  variant = "fade-up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay) {
              window.setTimeout(() => setIsVisible(true), delay);
            } else {
              setIsVisible(true);
            }
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, once]);

  const visibleClasses = variantMap[variant] ?? variantMap["fade-up"];

  return (
    <div
      ref={ref}
      className={`transform transition-all duration-700 ease-out ${isVisible ? visibleClasses : baseHidden} ${className}`}
    >
      {children}
    </div>
  );
}

