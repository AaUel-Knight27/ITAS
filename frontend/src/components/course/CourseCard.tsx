"use client";

import { Clock, BookOpen, Users } from "lucide-react";
import Link from "next/link";

import type { Course } from "@/types";

type CourseCardProps = {
  course: Course;
  highlightTerm?: string;
};

function prettyDifficulty(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, term?: string) {
  const query = term?.trim();
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-warning/30 px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function getDifficultyColor(difficulty: string) {
  const lower = difficulty.toLowerCase();
  if (lower === "beginner") return "bg-success/10 text-success";
  if (lower === "intermediate") return "bg-warning/10 text-warning-foreground";
  if (lower === "advanced") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

export default function CourseCard({ course, highlightTerm }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Tags */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {course.category?.name ?? "Uncategorized"}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
            {prettyDifficulty(course.difficulty)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {highlightText(course.title, highlightTerm)}
        </h3>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {course.durationMinutes} min
          </span>
          {course.targetAudience && course.targetAudience.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.targetAudience.includes("ALL") ? "All" : course.targetAudience.length}
            </span>
          )}
        </div>

        {/* Audience badges - only show if specific audiences */}
        {course.targetAudience && !course.targetAudience.includes("ALL") && course.targetAudience.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {course.targetAudience.slice(0, 2).map((audience) => (
              <span key={audience} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {audience.replace("_", " ")}
              </span>
            ))}
            {course.targetAudience.length > 2 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{course.targetAudience.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
