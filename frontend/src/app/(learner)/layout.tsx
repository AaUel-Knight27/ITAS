'use client'

import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/ui/AppShell'
import PageTransition from '@/components/ui/PageTransition'
import { canAccessCourses,
    getRoleHomePath,
    isManagerRole } from '@/lib/roles'

export default function LearnerLayout({
    children,
}: {
    children: ReactNode
}) {
    const { data: session, status } =
        useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'loading') return

        if (status === 'unauthenticated') {
            router.replace('/login')
            return
        }

        const role =
            session?.user?.role ?? ''

        const allowed =
            canAccessCourses(role) ||
            isManagerRole(role)

        if (!allowed) {
            router.replace(getRoleHomePath(role))
        }
    }, [status, session, router])

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen
                items-center justify-center
                bg-gray-50">
                <div className="h-8 w-8
                    animate-spin rounded-full
                    border-2 border-blue-500
                    border-t-transparent" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return null
    }

    const role = session?.user?.role ?? ''
    const allowed =
        canAccessCourses(role) ||
        isManagerRole(role)

    if (!allowed) {
        return null
    }

    return (
        <AppShell>
            <PageTransition>
                {children}
            </PageTransition>
        </AppShell>
    )
}
