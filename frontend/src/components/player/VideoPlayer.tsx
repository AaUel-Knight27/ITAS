"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

type VideoPlayerProps = {
  src: string;
  lectureId: number | string;
  lectureTitle?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  resumeAt?: number;
};

function getVideoType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".m3u8")) return "application/x-mpegURL";
  if (lower.includes(".webm")) return "video/webm";
  return "video/mp4";
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  lectureId,
  lectureTitle,
  onProgress,
  resumeAt = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeActionTakenRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showResumeToast, setShowResumeToast] = useState(resumeAt > 10);

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setShowResumeToast(resumeAt > 10);
    resumeActionTakenRef.current = false;
  }, [lectureId, resumeAt]);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    let player: Player | null = null;
    let timeUpdateHandler: (() => void) | null = null;
    let loadedMetadataHandler: (() => void) | null = null;

    const timer = setTimeout(() => {
      if (!videoRef.current) return;

      const createdPlayer = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: "auto",
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        sources: [{ src, type: getVideoType(src) }],
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

      loadedMetadataHandler = () => {
        if (resumeAt > 0 && !resumeActionTakenRef.current) {
          createdPlayer.currentTime(resumeAt);
        }
      };

      timeUpdateHandler = () => {
        setCurrentTime(Number(createdPlayer.currentTime() ?? 0));
        setDuration(Number(createdPlayer.duration() ?? 0));
      };

      createdPlayer.on("loadedmetadata", loadedMetadataHandler);
      createdPlayer.on("timeupdate", timeUpdateHandler);

      heartbeatRef.current = setInterval(() => {
        if (!onProgress || !playerRef.current) return;
        const currentPlayer = playerRef.current;
        if (currentPlayer.paused() || currentPlayer.ended()) return;

        const current = Number(currentPlayer.currentTime() ?? 0);
        const total = Number(currentPlayer.duration() ?? 0);
        if (total > 0) {
          onProgress(current, total);
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
        if (loadedMetadataHandler) {
          player.off("loadedmetadata", loadedMetadataHandler);
        }
        if (timeUpdateHandler) {
          player.off("timeupdate", timeUpdateHandler);
        }
        player.dispose();
      }

      playerRef.current = null;
    };
  }, [onProgress, resumeAt, src]);

  useEffect(() => {
    if (!showResumeToast || resumeActionTakenRef.current) return;

    const timeout = setTimeout(() => {
      const player = playerRef.current;
      if (player && resumeAt > 0) {
        player.currentTime(resumeAt);
      }
      resumeActionTakenRef.current = true;
      setShowResumeToast(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [resumeAt, showResumeToast]);

  function handleResume() {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime(resumeAt);
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

  if (!src) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Video source unavailable.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm" data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline aria-label={lectureTitle ?? String(lectureId)} />

        {showResumeToast ? (
          <div className="absolute left-4 top-4 z-20 rounded-lg bg-slate-900/90 px-3 py-2 text-sm text-white">
            <p>Resume from {formatClock(resumeAt)}?</p>
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
