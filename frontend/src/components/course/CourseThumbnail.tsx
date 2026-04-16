"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";

import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";

type CourseThumbnailProps = {
  title: string;
  thumbnailUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  alt?: string;
};

export default function CourseThumbnail({
  title,
  thumbnailUrl,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700",
  iconClassName = "h-10 w-10 text-white",
  alt,
}: CourseThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const { resolvedUrl } = useProtectedMediaUrl(thumbnailUrl);

  if (!thumbnailUrl || !resolvedUrl || hasError) {
    return (
      <div className={fallbackClassName}>
        <BookOpen className={iconClassName} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={alt ?? title}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
