interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CourseCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  private defaultTtl = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttl = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const courseCache = new CourseCache();

export const CACHE_KEYS = {
  course: (slug: string) => `course:${slug}`,
  courseProgress: (userId: string, courseId: number) => `progress:${userId}:${courseId}`,
  completions: (userId: string, courseId: number) => `completions:${userId}:${courseId}`,
  categories: () => "categories",
  courses: () => "courses:all",
};
