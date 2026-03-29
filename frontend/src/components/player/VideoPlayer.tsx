'use client'

import {
    useEffect,
    useRef,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from 'react'

interface Props {
    src: string
    lectureId: number
    resumeAt?: number
    onProgress?: (
        currentTime: number,
        duration: number) => void
    onEnded?: () => void
    autoPlay?: boolean
}

export interface VideoPlayerHandle {
    getCurrentTime: () => number
    getDuration: () => number
    pause: () => void
    play: () => void
    seekTo: (time: number) => void
}

const VideoPlayer = forwardRef<
    VideoPlayerHandle,
    Props
>(function VideoPlayer(
    {
        src,
        lectureId,
        resumeAt = 0,
        onProgress,
        onEnded,
        autoPlay = false,
    },
    ref
) {
    const videoRef =
        useRef<HTMLVideoElement>(null)
    const playerRef = useRef<any>(null)
    const intervalRef =
        useRef<NodeJS.Timeout | undefined>(
            undefined)
    const mountedRef = useRef(false)
    const initializingRef = useRef(false)
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)

    useImperativeHandle(ref, () => ({
        getCurrentTime: () =>
            playerRef.current
                ?.currentTime() || 0,
        getDuration: () =>
            playerRef.current
                ?.duration() || 0,
        pause: () =>
            playerRef.current?.pause(),
        play: () => {
            const playPromise =
                playerRef.current?.play()
            if (playPromise?.catch) {
                void playPromise.catch(() => {})
            }
        },
        seekTo: (time: number) =>
            playerRef.current?.currentTime(
                Math.max(0, time)),
    }))

    const getVideoType = (url: string) => {
        const lower = url.toLowerCase()
        if (lower.includes('.m3u8'))
            return 'application/x-mpegURL'
        if (lower.includes('.webm'))
            return 'video/webm'
        if (lower.includes('.ogg'))
            return 'video/ogg'
        return 'video/mp4'
    }

    const destroyPlayer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = undefined
        }

        if (playerRef.current) {
            try {
                const player =
                    playerRef.current
                playerRef.current = null

                if (!player.isDisposed?.()) {
                    try { player.pause() } catch {}
                    try { player.dispose() } catch {}
                }
            } catch {
                // Ignore disposal errors
            }
        }
    }, [])

    const initPlayer = useCallback(
            async () => {
        if (initializingRef.current) return
        if (!videoRef.current) return
        if (!mountedRef.current) return

        if (!document.body.contains(
                videoRef.current)) {
            return
        }

        initializingRef.current = true
        setLoading(true)
        setError(false)

        destroyPlayer()

        try {
            const vjsModule = await import(
                'video.js')
            const videojs = vjsModule.default

            if (!mountedRef.current) {
                initializingRef.current = false
                return
            }
            if (!videoRef.current) {
                initializingRef.current = false
                return
            }
            if (!document.body.contains(
                    videoRef.current)) {
                initializingRef.current = false
                return
            }

            await new Promise(resolve =>
                setTimeout(resolve, 50))

            if (!videoRef.current?.isConnected) {
                initializingRef.current = false
                return
            }
            if (!document.body.contains(
                    videoRef.current)) {
                initializingRef.current = false
                return
            }
            if (!mountedRef.current ||
                    !videoRef.current ||
                    !document.body.contains(
                        videoRef.current)) {
                initializingRef.current = false
                return
            }

            const player = videojs(
                videoRef.current,
                {
                    controls: true,
                    fluid: true,
                    preload: 'metadata',
                    playbackRates: [
                        0.5, 0.75, 1,
                        1.25, 1.5, 2
                    ],
                    sources: [{
                        src,
                        type: getVideoType(src),
                    }],
                    html5: {
                        vhs: {
                            overrideNative: false,
                        },
                    },
                }
            )

            playerRef.current = player

            player.on('loadedmetadata', () => {
                if (!mountedRef.current ||
                        !videoRef.current?.isConnected) {
                    return
                }
                setLoading(false)
                if (resumeAt > 2) {
                    player.currentTime(resumeAt)
                }
            })

            player.on('loadeddata', () => {
                if (!mountedRef.current ||
                        !videoRef.current?.isConnected) {
                    return
                }
                setLoading(false)
                if (autoPlay) {
                    const playPromise =
                        player?.play()
                    if (playPromise?.catch) {
                        void playPromise
                            .catch(() => {})
                    }
                }
            })

            intervalRef.current = setInterval(
                () => {
                if (!mountedRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current =
                        undefined
                    return
                }
                if (!videoRef.current
                        ?.isConnected) {
                    clearInterval(intervalRef.current)
                    intervalRef.current =
                        undefined
                    return
                }
                if (!playerRef.current) return
                if (playerRef.current
                        .isDisposed?.()) {
                    clearInterval(intervalRef.current)
                    intervalRef.current =
                        undefined
                    return
                }

                try {
                    const paused =
                        playerRef.current
                            .paused()
                    const ended =
                        playerRef.current
                            .ended()

                    if (!paused && !ended) {
                        const current =
                            playerRef.current
                                .currentTime()
                            || 0
                        const duration =
                            playerRef.current
                                .duration()
                            || 0
                        if (duration > 0) {
                            onProgress?.(
                                current,
                                duration)
                        }
                    }
                } catch {
                    clearInterval(intervalRef.current)
                    intervalRef.current =
                        undefined
                }
            }, 10000)

            player.on('pause', () => {
                if (!mountedRef.current ||
                        !videoRef.current?.isConnected) {
                    return
                }
                try {
                    const current =
                        player.currentTime() || 0
                    const duration =
                        player.duration() || 0
                    if (duration > 0) {
                        onProgress?.(
                            current, duration)
                    }
                } catch {
                    // Ignore pause save errors
                }
            })

            player.on('ended', () => {
                if (!mountedRef.current ||
                        !videoRef.current?.isConnected) {
                    return
                }
                try {
                    const duration =
                        player.duration() || 0
                    onProgress?.(
                        duration, duration)
                    onEnded?.()
                } catch {
                    // Ignore ended errors
                }
            })

            player.on('error', () => {
                if (!mountedRef.current ||
                        !videoRef.current?.isConnected) {
                    return
                }
                setError(true)
                setLoading(false)
            })
        } catch (err) {
            console.warn(
                'VideoPlayer init failed:',
                err)
            if (mountedRef.current &&
                    videoRef.current?.isConnected) {
                setError(true)
                setLoading(false)
            }
        } finally {
            initializingRef.current = false
        }
    }, [
        autoPlay,
        destroyPlayer,
        onEnded,
        onProgress,
        resumeAt,
        src,
        lectureId,
    ])

    useEffect(() => {
        mountedRef.current = true

        const rafId = requestAnimationFrame(
            () => {
            if (mountedRef.current) {
                void initPlayer()
            }
        })

        return () => {
            mountedRef.current = false
            cancelAnimationFrame(rafId)
            destroyPlayer()
        }
    }, [initPlayer])

    if (error) {
        return (
            <div className="flex items-center
                justify-center w-full
                aspect-video bg-gray-900">
                <div className="text-center
                    text-gray-500 p-6">
                    <p className="text-4xl mb-3">
                        Video
                    </p>
                    <p className="text-sm
                        font-medium text-gray-400
                        mb-2">
                        Could not load video
                    </p>
                    <p className="text-xs
                        text-gray-600 mb-4">
                        The video file may be
                        unavailable or the format
                        is not supported.
                    </p>
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2
                            bg-blue-600 text-white
                            rounded-lg text-xs
                            hover:bg-blue-700">
                        Try Opening Directly
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full
            bg-black">
            {loading && (
                <div className="absolute
                    inset-0 z-10
                    flex items-center
                    justify-center
                    bg-gray-900">
                    <div className="flex
                        flex-col items-center
                        gap-3">
                        <div className="w-8 h-8
                            border-2
                            border-blue-500
                            border-t-transparent
                            rounded-full
                            animate-spin" />
                        <p className="text-xs
                            text-gray-500">
                            Loading video...
                        </p>
                    </div>
                </div>
            )}

            <div data-vjs-player>
                <video
                    ref={videoRef}
                    className="video-js
                        vjs-big-play-centered
                        vjs-fluid"
                    playsInline
                />
            </div>
        </div>
    )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
