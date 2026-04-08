export const TAXPAYER = 'TAXPAYER'
export const TAX_AGENT = 'TAX_AGENT'
export const MOR_STAFF = 'MOR_STAFF'
export const MANAGER = 'MANAGER'
export const CONTENT_ADMIN = 'CONTENT_ADMIN'
export const TRAINING_ADMIN = 'TRAINING_ADMIN'
export const COMMUNICATION = 'COMMUNICATION'
export const WEB_ADMIN = 'WEB_ADMIN'
export const SYSTEM_ADMIN = 'SYSTEM_ADMIN'

export const LEARNER_ROLES = [
    TAXPAYER,
    TAX_AGENT,
    MOR_STAFF,
    MANAGER,
]

export const ADMIN_ROLES = [
    CONTENT_ADMIN,
    TRAINING_ADMIN,
    COMMUNICATION,
    WEB_ADMIN,
    SYSTEM_ADMIN,
]

export const CERTIFICATE_ROLES = [
    TAX_AGENT,
    MOR_STAFF,
    MANAGER,
]

export const COURSE_ROLES = [
    TAXPAYER,
    TAX_AGENT,
    MOR_STAFF,
    MANAGER,
]

export function normalizeRole(
        role: string): string {
    return (role ?? '')
        .replace(/^ROLE_/i, '')
        .toUpperCase()
        .trim()
}

export function canAccessCourses(
        role: string): boolean {
    return COURSE_ROLES.includes(
        normalizeRole(role))
}

export function canGetCertificate(
        role: string): boolean {
    return CERTIFICATE_ROLES.includes(
        normalizeRole(role))
}

export function isAdminRole(
        role: string): boolean {
    return ADMIN_ROLES.includes(
        normalizeRole(role))
}

export function isManagerRole(
        role: string): boolean {
    return normalizeRole(role) === MANAGER
}

export function isLearnerRole(
        role: string): boolean {
    return LEARNER_ROLES.includes(
        normalizeRole(role))
}

export function isContentAdminRole(
        role: string): boolean {
    return normalizeRole(role) ===
        CONTENT_ADMIN
}

export function isTrainingAdminRole(
        role: string): boolean {
    return normalizeRole(role) ===
        TRAINING_ADMIN
}

export function isCommunicationRole(
        role: string): boolean {
    return normalizeRole(role) ===
        COMMUNICATION
}

export function isWebAdminRole(
        role: string): boolean {
    return [WEB_ADMIN, SYSTEM_ADMIN]
        .includes(normalizeRole(role))
}

export function getRoleHomePath(
        role: string): string {
    const normalized =
        normalizeRole(role)

    switch (normalized) {
        case CONTENT_ADMIN:
            return '/admin/courses'
        case TRAINING_ADMIN:
            return '/admin/webinars'
        case COMMUNICATION:
            return '/admin/communications'
        case WEB_ADMIN:
        case SYSTEM_ADMIN:
            return '/admin/users'
        default:
            return '/dashboard'
    }
}

export function canAccessAdminSection(
        role: string,
        section: 'users' | 'logs' |
            'integrations' | 'courses' |
            'webinars' | 'communications'
        ): boolean {
    const r = normalizeRole(role)
    switch (section) {
        case 'users':
        case 'logs':
        case 'integrations':
            return [WEB_ADMIN, SYSTEM_ADMIN]
                .includes(r)
        case 'courses':
            return [CONTENT_ADMIN]
                .includes(r)
        case 'webinars':
            return [TRAINING_ADMIN]
                .includes(r)
        case 'communications':
            return [COMMUNICATION]
                .includes(r)
        default:
            return false
    }
}

/** Learner-facing routes: courses, certificates, webinars, my-learning (aligned with `COURSE_ROLES`). */
export const LEARNER_ROUTE_ROLES = COURSE_ROLES

/** `/admin` layout: admins plus managers (sub-routes apply stricter rules). */
export function getAdminPrefixRoles(): readonly string[] {
    return [...ADMIN_ROLES, MANAGER]
}

export const WEB_ADMIN_ONLY_ROLES = [WEB_ADMIN, SYSTEM_ADMIN] as const

export const TRAINING_ADMIN_ROUTE_ROLES = [TRAINING_ADMIN] as const

export const COMMUNICATION_ROUTE_ROLES = [COMMUNICATION] as const

export const CONTENT_ADMIN_ROUTE_ROLES = [
    CONTENT_ADMIN,
] as const

export function hasAnyRole(
        role: string,
        allowed: readonly string[]): boolean {
    const r = normalizeRole(role)
    return allowed.includes(r)
}

export type MiddlewareRoutingResult =
    | { action: 'allow' }
    | { action: 'redirect'; path: string }

/**
 * Edge-safe authz rules shared with `middleware.ts`.
 * Order matters: public redirects first, then unauthenticated login, then per-route RBAC.
 */
export function resolveMiddlewareRouting(
        pathname: string,
        tokenRole: string | undefined,
        hasToken: boolean): MiddlewareRoutingResult {
    const role = normalizeRole(
        (tokenRole as string) ?? '')
    const homePath = getRoleHomePath(role)

    if (pathname === '/login' && hasToken) {
        return { action: 'redirect', path: homePath }
    }

    if (pathname === '/') {
        if (!hasToken) {
            return { action: 'redirect', path: '/login' }
        }
        return { action: 'redirect', path: homePath }
    }

    if (pathname === '/dashboard' &&
            hasAnyRole(role, ADMIN_ROLES)) {
        return { action: 'redirect', path: homePath }
    }

    if (!hasToken) {
        const qs = new URLSearchParams({
            callbackUrl: pathname,
        })
        return {
            action: 'redirect',
            path: `/login?${qs.toString()}`,
        }
    }

    const deny: MiddlewareRoutingResult = {
        action: 'redirect',
        path: homePath,
    }

    if (pathname === '/admin' ||
            pathname.startsWith('/admin/')) {
        if (!hasAnyRole(role, getAdminPrefixRoles())) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/users')) {
        if (!hasAnyRole(role, WEB_ADMIN_ONLY_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/logs')) {
        if (!hasAnyRole(role, WEB_ADMIN_ONLY_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/integrations')) {
        if (!hasAnyRole(role, WEB_ADMIN_ONLY_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/courses')) {
        if (!hasAnyRole(role, CONTENT_ADMIN_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/webinars')) {
        if (!hasAnyRole(role, TRAINING_ADMIN_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/admin/communications')) {
        if (!hasAnyRole(role, COMMUNICATION_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/courses')) {
        if (!hasAnyRole(role, LEARNER_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/certificates')) {
        if (!hasAnyRole(role, LEARNER_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname === '/webinars' ||
            pathname.startsWith('/webinars/')) {
        if (!hasAnyRole(role, LEARNER_ROUTE_ROLES)) {
            return deny
        }
    }

    if (pathname.startsWith('/my-learning')) {
        if (!hasAnyRole(role, LEARNER_ROUTE_ROLES)) {
            return deny
        }
    }

    return { action: 'allow' }
}
