import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth }
    from 'next-auth/middleware'
import { getRoleHomePath }
    from '@/lib/roles'

const LEARNER_ROLES = [
    'TAXPAYER',
    'TAX_AGENT',
    'MOR_STAFF',
    'MANAGER',
]

const ADMIN_ROLES = [
    'CONTENT_ADMIN',
    'TRAINING_ADMIN',
    'COMMUNICATION',
    'WEB_ADMIN',
    'SYSTEM_ADMIN',
]

const WEB_ADMIN_ONLY = [
    'WEB_ADMIN',
    'SYSTEM_ADMIN',
]

const TRAINING_ADMIN_ROLES = [
    'TRAINING_ADMIN',
    'WEB_ADMIN',
    'SYSTEM_ADMIN',
]

const COMMUNICATION_ROLES = [
    'COMMUNICATION',
    'WEB_ADMIN',
    'SYSTEM_ADMIN',
]

const CONTENT_ADMIN_ROLES = [
    'CONTENT_ADMIN',
    'TRAINING_ADMIN',
    'WEB_ADMIN',
    'SYSTEM_ADMIN',
]

function normalizeRole(role: string):
        string {
    return (role ?? '')
        .replace(/^ROLE_/i, '')
        .toUpperCase()
}

function hasRole(
        role: string,
        allowed: string[]): boolean {
    return allowed.includes(
        normalizeRole(role))
}

export default withAuth(
    function middleware(
            req: NextRequestWithAuth) {

        const token = req.nextauth.token
        const pathname = req.nextUrl.pathname
        const role = normalizeRole(
            (token?.role as string) ?? '')
        const homePath =
            getRoleHomePath(role)

        if (pathname === '/login' && token) {
            return NextResponse.redirect(
                new URL(homePath, req.url))
        }

        if (pathname === '/') {
            if (!token) {
                return NextResponse.redirect(
                    new URL('/login', req.url))
            }
            return NextResponse.redirect(
                new URL(homePath, req.url))
        }

        if (pathname === '/dashboard' &&
                hasRole(role, ADMIN_ROLES)) {
            return NextResponse.redirect(
                new URL(homePath, req.url))
        }

        if (!token) {
            const loginUrl = new URL(
                '/login', req.url)
            loginUrl.searchParams.set(
                'callbackUrl',
                pathname)
            return NextResponse.redirect(
                loginUrl)
        }

        if (pathname.startsWith('/admin/') ||
                pathname === '/admin') {
            if (!hasRole(role,
                    [...ADMIN_ROLES,
                     'MANAGER'])) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/users')) {
            if (!hasRole(role,
                    WEB_ADMIN_ONLY)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/logs')) {
            if (!hasRole(role,
                    WEB_ADMIN_ONLY)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/integrations')) {
            if (!hasRole(role,
                    WEB_ADMIN_ONLY)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/courses')) {
            if (!hasRole(role,
                    CONTENT_ADMIN_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/webinars')) {
            if (!hasRole(role,
                    TRAINING_ADMIN_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/admin/communications')) {
            if (!hasRole(role,
                    COMMUNICATION_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith('/courses')) {
            if (!hasRole(role,
                    LEARNER_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/certificates')) {
            if (!hasRole(role,
                    LEARNER_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname === '/webinars' ||
                pathname.startsWith(
                    '/webinars/')) {
            if (!hasRole(role,
                    LEARNER_ROLES)) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        if (pathname.startsWith(
                '/my-learning')) {
            if (!hasRole(role,
                    [...LEARNER_ROLES,
                     'MANAGER'])) {
                return NextResponse.redirect(
                    new URL(
                        '/dashboard',
                        req.url))
            }
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized({ token }) {
                return true
            }
        }
    }
)

export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|verify).*)',
    ]
}
