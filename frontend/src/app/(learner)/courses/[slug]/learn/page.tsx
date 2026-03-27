"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { getCourseBySlug } from "@/lib/api/courses";
import { getCourseProgress } from "@/lib/api/enrollment";
import { getCourseLearnHref } from "@/lib/learn";
import type { CourseSection } from "@/types";

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function getFirstLectureId(sections: CourseSection[]): number | string | null {
  for (const section of byOrder(sections)) {
    const lecture = byOrder(section.lectures ?? [])[0];
    if (lecture?.id !== undefined && lecture?.id !== null) {
      return lecture.id;
    }
  }

  return null;
}

export default function LearnRedirectPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  useEffect(() => {
    if (!slug) return;

    let active = true;

    async function redirectToLecture() {
      try {
        const course = await getCourseBySlug(slug);
        if (!active) return;

        let targetLectureId: number | string | null = null;

        if (course.enrolled) {
          try {
            const progress = await getCourseProgress(course.id);
            if (!active) return;
            targetLectureId = progress.lastLectureId ?? null;
          } catch {
            targetLectureId = null;
          }
        }

        if (!targetLectureId) {
          targetLectureId = getFirstLectureId(course.sections ?? []);
        }

        router.replace(getCourseLearnHref(course.slug, targetLectureId));
      } catch {
        router.replace(`/courses/${slug}`);
      }
    }

    void redirectToLecture();

    return () => {
      active = false;
    };
  }, [router, slug]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-700">
      Redirecting to your lesson...
    </main>
  );
}
