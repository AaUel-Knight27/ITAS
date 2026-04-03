'use client'

import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/ui/AppShell'
import { isAdminRole } from '@/lib/roles'

export default function AdminLayout({
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
        if (!isAdminRole(role)) {
            router.replace('/dashboard')
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
    if (!isAdminRole(role)) {
        return null
    }

    return <AppShell>{children}</AppShell>
}
