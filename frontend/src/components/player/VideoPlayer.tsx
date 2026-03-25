"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";

type VideoStreamPayload = {
  mp4Url?: string | null;
  hlsUrl?: string | null;
  captionsUrl?: string | null;
};

type CourseProgressItem = {
  lectureId?: number | string;
  lastPosition?: number;
};

type CourseProgressPayload =
  | {
      lastPosition?: number;
      videoProgress?: CourseProgressItem[];
      lectureProgress?: CourseProgressItem[];
      progress?: CourseProgressItem[];
      items?: CourseProgressItem[];
    }
  | CourseProgressItem[]
  | null;

type VideoPlayerProps = {
  lectureId: number | string;
  lectureTitle: string;
  onComplete?: () => void;
};

function getVideoType(url: string): string {
  if (url.includes(".m3u8")) return "application/x-mpegURL";
  if (url.includes(".webm")) return "video/webm";
  return "video/mp4";
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function extractLastPosition(payload: CourseProgressPayload, lectureId: number | string): number {
  if (!payload) return 0;
  if (Array.isArray(payload)) {
    const row = payload.find((item) => String(item.lectureId) === String(lectureId));
    return Math.floor(Number(row?.lastPosition ?? 0));
  }

  const collection = payload.videoProgress ?? payload.lectureProgress ?? payload.progress ?? payload.items;
  if (Array.isArray(collection)) {
    const row = collection.find((item) => String(item.lectureId) === String(lectureId));
    return Math.floor(Number(row?.lastPosition ?? 0));
  }

  return Math.floor(Number(payload.lastPosition ?? 0));
}

export default function VideoPlayer({ lectureId, lectureTitle, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const resumeActionTakenRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [sourceUrl, setSourceUrl] = useState("");
  const [captionsUrl, setCaptionsUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumePosition, setResumePosition] = useState(0);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setIsLoading(true);
        const [streamRes, progressRes] = await Promise.all([
          api.get<VideoStreamPayload>(`/content/video/${lectureId}/stream`),
          api.get<CourseProgressPayload>("/lms/course-progress").catch(() => ({ data: null as CourseProgressPayload })),
        ]);

        if (!active) return;

        const stream = streamRes.data ?? {};

        const resolvedHls = getFileUrl(stream.hlsUrl ?? null) ?? "";
        const resolvedMp4 = getFileUrl(stream.mp4Url ?? null) ?? "";
        const chosenSource = resolvedHls || resolvedMp4 || "";

        setSourceUrl(chosenSource);
        setCaptionsUrl(getFileUrl(stream.captionsUrl ?? null));

        const lastPos = extractLastPosition(progressRes.data, lectureId);
        setResumePosition(lastPos);
        setShowResumeToast(lastPos > 10);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [lectureId]);

  useEffect(() => {
    if (!sourceUrl || isLoading || !videoRef.current) return;

    let player: Player | null = null;
    let timeUpdateHandler: (() => void) | null = null;

    const timer = setTimeout(() => {
      if (!videoRef.current) return;

      const createdPlayer = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: "auto",
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        sources: [{ src: sourceUrl, type: getVideoType(sourceUrl) }],
        controlBar: {
          volumePanel: { inline: false },
          fullscreenToggle: true,
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          progressControl: true,
        },
      });

      player = createdPlayer;
      playerRef.current = createdPlayer;

      if (captionsUrl) {
        createdPlayer.ready(() => {
          createdPlayer.addRemoteTextTrack(
            {
              kind: "captions",
              srclang: "en",
              label: "English",
              src: captionsUrl,
              default: true,
            },
            false
          );
        });
      }

      timeUpdateHandler = async () => {
        const now = Number(createdPlayer.currentTime() ?? 0);
        const total = Number(createdPlayer.duration() ?? 0);
        setCurrentTime(now);
        setDuration(total);

        if (!completedRef.current && total > 0 && now / total >= 0.9) {
          completedRef.current = true;
          try {
            await api.post(`/lms/lesson/${lectureId}/complete`);
            onComplete?.();
            setShowCompleteOverlay(true);
            setTimeout(() => setShowCompleteOverlay(false), 2000);
          } catch {
            // Keep playback uninterrupted.
          }
        }
      };

      createdPlayer.on("timeupdate", timeUpdateHandler);

      heartbeatRef.current = setInterval(async () => {
        const currentPlayer = playerRef.current;
        if (!currentPlayer || currentPlayer.paused()) return;
        const now = Math.floor(Number(currentPlayer.currentTime() ?? 0));
        try {
          await api.post(`/content/video/${lectureId}/progress`, {
            watchedSeconds: now,
            lastPosition: now,
          });
        } catch {
          // Ignore heartbeat errors during playback.
        }
      }, 15000);
    }, 0);

    return () => {
      clearTimeout(timer);

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      if (player) {
        if (timeUpdateHandler) {
          player.off("timeupdate", timeUpdateHandler);
        }
        player.dispose();
      }

      playerRef.current = null;
    };
  }, [captionsUrl, isLoading, lectureId, onComplete, sourceUrl]);

  useEffect(() => {
    if (!showResumeToast || resumeActionTakenRef.current) return;
    const timeout = setTimeout(() => {
      const player = playerRef.current;
      if (player && resumePosition > 0) {
        player.currentTime(resumePosition);
      }
      resumeActionTakenRef.current = true;
      setShowResumeToast(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [resumePosition, showResumeToast]);

  function handleResume() {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime(resumePosition);
    resumeActionTakenRef.current = true;
    setShowResumeToast(false);
  }

  function handleStartOver() {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime(0);
    resumeActionTakenRef.current = true;
    setShowResumeToast(false);
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    const player = playerRef.current;
    if (!player || !duration) return;
    const ratio = Number(event.target.value) / 100;
    player.currentTime(ratio * duration);
  }

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading video...</div>;
  }

  if (!sourceUrl) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Video source unavailable.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm" data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline aria-label={lectureTitle} />

        {showResumeToast ? (
          <div className="absolute left-4 top-4 z-20 rounded-lg bg-slate-900/90 px-3 py-2 text-sm text-white">
            <p>Resume from {formatClock(resumePosition)}?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={handleResume} className="rounded bg-emerald-600 px-2 py-1 text-xs">
                Resume
              </button>
              <button type="button" onClick={handleStartOver} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-900">
                Start Over
              </button>
            </div>
          </div>
        ) : null}

        {showCompleteOverlay ? (
          <div className="absolute inset-x-0 top-4 z-20 mx-auto w-fit rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
            Lecture Complete [OK]
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="range"
          min={0}
          max={100}
          value={progressPercent}
          onChange={handleSeek}
          className="w-full accent-blue-600"
          aria-label="Video progress"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
          <span>{formatClock(currentTime)}</span>
          <span>{formatClock(duration)}</span>
        </div>
      </div>
    </div>
  );
}
