"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";

import { notificationApi } from "@/lib/api";

type NotificationContextValue = {
  unreadCount: number;
  refresh: () => void;
  pausePolling: () => void;
  resumePolling: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refresh: () => {},
  pausePolling: () => {},
  resumePolling: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const pausedRef = useRef(false);
  const mountedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    if (pausedRef.current) {
      return;
    }
    if (status !== "authenticated") {
      return;
    }
    if (document.hidden) {
      return;
    }

    try {
      const res = await notificationApi.getUnreadCount();
      if (!mountedRef.current) {
        return;
      }

      const count = res.data?.count ?? 0;
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch {
      // Keep notification polling silent and non-blocking.
    }
  }, [status]);

  const pausePolling = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumePolling = useCallback(() => {
    pausedRef.current = false;
    window.setTimeout(() => {
      void fetchCount();
    }, 1000);
  }, [fetchCount]);

  const refresh = useCallback(() => {
    if (!pausedRef.current) {
      void fetchCount();
    }
  }, [fetchCount]);

  useEffect(() => {
    mountedRef.current = true;

    if (status !== "authenticated") {
      setUnreadCount(0);
      return () => {
        mountedRef.current = false;
      };
    }

    const isLearnPage = window.location.pathname.includes("/learn/");
    pausedRef.current = isLearnPage;

    const initialTimer = window.setTimeout(() => {
      const onLearnPage = window.location.pathname.includes("/learn/");
      if (!onLearnPage) {
        void fetchCount();
      }
    }, 3000);

    const intervalId = window.setInterval(() => {
      const onLearnPage = window.location.pathname.includes("/learn/");
      if (onLearnPage) {
        return;
      }

      void fetchCount();
    }, 60000);

    const handlePopState = () => {
      const onLearnPage = window.location.pathname.includes("/learn/");
      pausedRef.current = onLearnPage;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        return;
      }

      const onLearnPage = window.location.pathname.includes("/learn/");
      pausedRef.current = onLearnPage;
      if (!onLearnPage) {
        window.setTimeout(() => {
          void fetchCount();
        }, 1000);
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchCount, status]);

  const value = useMemo(
    () => ({
      unreadCount,
      refresh,
      pausePolling,
      resumePolling,
    }),
    [pausePolling, refresh, resumePolling, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
