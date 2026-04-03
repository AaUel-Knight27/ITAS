'use client'

import {
    memo,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
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
        autoPlay = false,
    },
    ref
) {
    const videoRef =
        useRef<HTMLVideoElement>(null)
    const onProgressRef = useRef(onProgress)
    const onEndedRef = useRef(onEnded)
    const resumeAtRef = useRef(resumeAt)
    const intervalRef =
        useRef<ReturnType<
            typeof setInterval
        > | null>(null)
    const hasResumedRef = useRef(false)
    const srcRef = useRef(src)

    useEffect(() => {
        onProgressRef.current = onProgress
    }, [onProgress])

    useEffect(() => {
        onEndedRef.current = onEnded
    }, [onEnded])

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

                    const current =
                        video.currentTime
                    const duration =
                        video.duration

                    if (duration > 0 &&
                            current > 0) {
                        onProgressRef.current?.(
                            current, duration)
                    }
                }, 10000)
        }, [])

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
            const current =
                video.currentTime
            const duration =
                video.duration
            if (duration > 0 &&
                    current > 0) {
                onProgressRef.current?.(
                    current, duration)
            }
        }

        const handleEnded = () => {
            stopInterval()
            const duration =
                video.duration
            if (duration > 0) {
                onProgressRef.current?.(
                    duration, duration)
            }
            onEndedRef.current?.()
        }

        const handleError = () => {
            stopInterval()
            console.warn(
                'Video load error for src:',
                src)
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
    }, [src, autoPlay, startInterval,
        stopInterval])

    return (
        <div className="relative w-full
            bg-black">
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
