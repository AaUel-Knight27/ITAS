"use client";

import { Clock, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CourseThumbnail from "@/components/course/CourseThumbnail";
import { useLanguage } from "@/context/LanguageContext";
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
  const router = useRouter();
  const { t } = useLanguage();
  const categoryLabel = course.category?.name ?? t("courses.uncategorized");
  const difficultyKey = `courses.${course.difficulty.toLowerCase()}`;
  const translatedDifficulty = t(difficultyKey);
  const difficultyLabel =
    translatedDifficulty === difficultyKey ? prettyDifficulty(course.difficulty) : translatedDifficulty;
  const audienceLabel = course.targetAudience?.includes("ALL")
    ? t("common.all")
    : course.targetAudience?.length;

  return (
    <Link
      href={`/courses/${course.slug}`}
      onMouseEnter={() => router.prefetch(`/courses/${course.slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <CourseThumbnail
          title={course.title}
          thumbnailUrl={course.thumbnailUrl}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700"
          iconClassName="h-12 w-12 text-white"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {categoryLabel}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
            {difficultyLabel}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {highlightText(course.title, highlightTerm)}
        </h3>

        <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {course.durationMinutes} {t("courses.duration_min")}
          </span>
          {course.targetAudience && course.targetAudience.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {audienceLabel}
            </span>
          )}
        </div>

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
