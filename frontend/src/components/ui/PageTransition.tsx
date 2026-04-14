'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type PageTransitionProps = {
  children: ReactNode
}

export default function PageTransition({
  children,
}: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      setIsVisible(false)
      const timer = window.setTimeout(() => {
        setIsVisible(true)
        prevPathRef.current = pathname
      }, 80)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(
      () => setIsVisible(true),
      30
    )
    return () => window.clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className="transition-opacity duration-200 ease-in-out"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {children}
    </div>
  )
}
