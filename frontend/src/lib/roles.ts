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
            return [CONTENT_ADMIN,
                TRAINING_ADMIN, WEB_ADMIN,
                SYSTEM_ADMIN].includes(r)
        case 'webinars':
            return [TRAINING_ADMIN,
                WEB_ADMIN, SYSTEM_ADMIN]
                .includes(r)
        case 'communications':
            return [COMMUNICATION,
                WEB_ADMIN, SYSTEM_ADMIN]
                .includes(r)
        default:
            return false
    }
}
