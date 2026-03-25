export const TAXPAYER = "TAXPAYER";
export const TAX_AGENT = "TAX_AGENT";
export const MOR_STAFF = "MOR_STAFF";
export const MANAGER = "MANAGER";
export const CONTENT_ADMIN = "CONTENT_ADMIN";
export const TRAINING_ADMIN = "TRAINING_ADMIN";
export const COMMUNICATION = "COMMUNICATION";
export const WEB_ADMIN = "WEB_ADMIN";
export const SYSTEM_ADMIN = "SYSTEM_ADMIN";

export const COURSE_ROLES = [TAXPAYER, TAX_AGENT, MOR_STAFF, MANAGER];

export const CERTIFICATE_ROLES = [TAX_AGENT, MOR_STAFF, MANAGER];

export const ADMIN_ROLES = [
  CONTENT_ADMIN,
  TRAINING_ADMIN,
  COMMUNICATION,
  WEB_ADMIN,
  SYSTEM_ADMIN,
];

export const normalizeRole = (role: string) => role.replace(/^ROLE_/i, "").toUpperCase();

export const canAccessCourses = (role: string) => COURSE_ROLES.includes(normalizeRole(role));

export const canGetCertificate = (role: string) => CERTIFICATE_ROLES.includes(normalizeRole(role));

export const isAdminRole = (role: string) => ADMIN_ROLES.includes(normalizeRole(role));

export const isManagerRole = (role: string) => normalizeRole(role) === MANAGER;

export const isContentAdminRole = (role: string) => normalizeRole(role) === CONTENT_ADMIN;

export const isTrainingAdminRole = (role: string) => normalizeRole(role) === TRAINING_ADMIN;

export const isCommunicationRole = (role: string) => normalizeRole(role) === COMMUNICATION;

export const isWebAdminRole = (role: string) => [WEB_ADMIN, SYSTEM_ADMIN].includes(normalizeRole(role));

export const isLearnerRole = (role: string) => COURSE_ROLES.includes(normalizeRole(role));
