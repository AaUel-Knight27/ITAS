'use client'

import {
    memo,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useState,
} from 'react'

export interface VideoPlayerHandle {
    getCurrentTime: () => number
    getDuration: () => number
    pause: () => void
    play: () => void
    seekTo: (time: number) => void
}

interface VideoPlayerProps {
    src: string
    lectureId: number
    resumeAt?: number
    onProgress?: (
        currentTime: number,
        duration: number
    ) => void
    onEnded?: () => void
    onComplete?: () => void
    isCompleted?: boolean
    autoPlay?: boolean
}

const VideoPlayer = forwardRef<
    VideoPlayerHandle,
    VideoPlayerProps
>(function VideoPlayer(
    {
        src,
        lectureId: _lectureId,
        resumeAt = 0,
        onProgress,
        onEnded,
        onComplete,
        isCompleted = false,
        autoPlay = false,
    },
    ref
) {
    const videoRef =
        useRef<HTMLVideoElement>(null)
    const onProgressRef = useRef(onProgress)
    const onEndedRef = useRef(onEnded)
    const onCompleteRef = useRef(onComplete)
    const resumeAtRef = useRef(resumeAt)
    const intervalRef =
        useRef<ReturnType<
            typeof setInterval
        > | null>(null)
    const hasResumedRef = useRef(false)
    const srcRef = useRef(src)
    const [showComplete, setShowComplete] =
        useState(false)
    const [pctWatched, setPctWatched] =
        useState(0)

    useEffect(() => {
        onProgressRef.current = onProgress
    }, [onProgress])

    useEffect(() => {
        onEndedRef.current = onEnded
    }, [onEnded])

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
        resumeAtRef.current = resumeAt
    }, [resumeAt])

    useImperativeHandle(ref, () => ({
        getCurrentTime: () =>
            videoRef.current?.currentTime
                ?? 0,
        getDuration: () =>
            videoRef.current?.duration
                ?? 0,
        pause: () =>
            videoRef.current?.pause(),
        play: () => {
            videoRef.current
                ?.play()
                .catch(() => {})
        },
        seekTo: (time: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime =
                    Math.max(0, time)
            }
        },
    }), [])

    const updateProgressState = useCallback(
        (current: number, duration: number) => {
            if (duration <= 0 || current <= 0) {
                return
            }

            onProgressRef.current?.(
                current, duration)

            const pct = (current / duration) * 100
            setPctWatched(pct)

            if (pct >= 80) {
                setShowComplete(true)
            }
        },
        []
    )

    const startInterval =
        useCallback(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }

            intervalRef.current = setInterval(
                () => {
                    const video = videoRef.current
                    if (!video) return
                    if (video.paused) return
                    if (video.ended) return

                    updateProgressState(
                        video.currentTime,
                        video.duration
                    )
                }, 10000)
        }, [updateProgressState])

    const stopInterval =
        useCallback(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }, [])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        if (!src) return

        if (src !== srcRef.current) {
            hasResumedRef.current = false
            srcRef.current = src
        }

        setShowComplete(false)
        setPctWatched(0)

        video.src = src
        video.load()

        const handleLoadedMetadata = () => {
            const resume =
                resumeAtRef.current
            if (resume > 2 &&
                    !hasResumedRef.current) {
                video.currentTime = resume
                hasResumedRef.current = true
            }
        }

        const handleLoadedData = () => {
            if (autoPlay) {
                video.play().catch(() => {})
            }
        }

        const handlePlay = () => {
            startInterval()
        }

        const handlePause = () => {
            stopInterval()
            updateProgressState(
                video.currentTime,
                video.duration
            )
        }

        const handleEnded = () => {
            stopInterval()
            updateProgressState(
                video.duration,
                video.duration
            )
            setPctWatched(100)
            setShowComplete(true)
            onEndedRef.current?.()
        }

        const handleError = () => {
            stopInterval()
            console.warn(
                'Video load error for src:',
                src
            )
        }

        video.addEventListener(
            'loadedmetadata',
            handleLoadedMetadata)
        video.addEventListener(
            'loadeddata',
            handleLoadedData)
        video.addEventListener(
            'play',
            handlePlay)
        video.addEventListener(
            'pause',
            handlePause)
        video.addEventListener(
            'ended',
            handleEnded)
        video.addEventListener(
            'error',
            handleError)

        return () => {
            stopInterval()

            video.removeEventListener(
                'loadedmetadata',
                handleLoadedMetadata)
            video.removeEventListener(
                'loadeddata',
                handleLoadedData)
            video.removeEventListener(
                'play',
                handlePlay)
            video.removeEventListener(
                'pause',
                handlePause)
            video.removeEventListener(
                'ended',
                handleEnded)
            video.removeEventListener(
                'error',
                handleError)

            video.pause()
            video.src = ''
            video.load()
        }
    }, [
        src,
        autoPlay,
        startInterval,
        stopInterval,
        updateProgressState,
    ])

    return (
        <div className="relative w-full
            bg-black">
            {showComplete &&
            !isCompleted ? (
                <div className="absolute bottom-16
                    right-4 z-10">
                    <button
                        onClick={() => {
                            onCompleteRef.current?.()
                        }}
                        title={`You've watched ${Math.round(
                            pctWatched
                        )}%`}
                        className="flex items-center
                            gap-2 rounded-xl
                            bg-green-600 px-4 py-2
                            text-sm font-medium
                            text-white shadow-lg
                            transition-all
                            duration-200
                            hover:scale-105
                            hover:bg-green-700
                            active:scale-95"
                    >
                        <span className="text-base">
                            ✓
                        </span>
                        Mark as Complete
                    </button>
                </div>
            ) : null}

            {isCompleted ? (
                <div className="absolute bottom-16
                    right-4 z-10">
                    <div className="flex items-center
                        gap-2 rounded-xl
                        border border-green-700
                        bg-green-900/80 px-4 py-2
                        text-sm text-green-400">
                        <span>✓</span>
                        Completed
                    </div>
                </div>
            ) : null}

            <video
                ref={videoRef}
                className="aspect-video w-full"
                controls
                playsInline
                preload="metadata"
                style={{
                    display: 'block',
                    width: '100%',
                    backgroundColor: '#000',
                }}
            />
        </div>
    )
})

VideoPlayer.displayName = 'VideoPlayer'

export default memo(VideoPlayer)
