import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const scrollPositions = new Map<string, number>()

export function useScrollMemory(
  containerRef?: RefObject<HTMLElement | null>
) {
  const pathname = usePathname()
  const savedPositionRef = useRef(0)

  useEffect(() => {
    const saved = scrollPositions.get(pathname) ?? 0
    savedPositionRef.current = saved

    return () => {
      const element = containerRef?.current
      const scrollY = element
        ? element.scrollTop
        : window.scrollY
      scrollPositions.set(pathname, scrollY)
    }
  }, [containerRef, pathname])

  useEffect(() => {
    const restore = () => {
      const saved =
        scrollPositions.get(pathname) ?? 0
      const element = containerRef?.current
      if (element) {
        element.scrollTop = saved
        return
      }
      window.scrollTo(0, saved)
    }

    const timer = window.setTimeout(restore, 50)
    return () => window.clearTimeout(timer)
  }, [containerRef, pathname])
}
