"use client";

import { useRouter } from "next/navigation";

import { getFileUrl } from "@/lib/utils";
import type { EnrollmentDto } from "@/lib/types";

interface Props {
  enrollment: EnrollmentDto;
  showCertBadge?: boolean;
}

export default function CourseCard({ enrollment, showCertBadge = false }: Props) {
  const router = useRouter();
  const progress = enrollment.progressPercent;

  const handleClick = () => {
    router.push(`/courses/${enrollment.courseSlug}/learn`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md"
    >
      <div className="relative h-36 bg-gray-100">
        {enrollment.courseThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getFileUrl(enrollment.courseThumbnail) || ""}
            alt={enrollment.courseTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
            <span className="text-3xl text-white">📚</span>
          </div>
        )}

        <div className="absolute right-2 top-2">
          {enrollment.status === "COMPLETED" ? (
            <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
              ✓ Completed
            </span>
          ) : (
            <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white">
              In Progress
            </span>
          )}
        </div>

        {showCertBadge && enrollment.status === "COMPLETED" && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
              🏆 Certified
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600">
          {enrollment.courseTitle}
        </h3>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full transition-all ${
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className={`mt-3 w-full rounded-lg py-1.5 text-xs font-medium transition-colors ${
            enrollment.status === "COMPLETED"
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {enrollment.status === "COMPLETED"
            ? "Review Course"
            : progress > 0
              ? "Continue"
              : "Start"}
        </button>
      </div>
    </div>
  );
}
