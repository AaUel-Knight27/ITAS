import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  ADMIN_ROLES,
  CERTIFICATE_ROLES,
  LEARNER_ROLES,
  canAccessAdminSection,
} from '@/lib/roles';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  
  // Helpers
  isAdmin: () => boolean;
  isLearner: () => boolean;
  canManageCourses: () => boolean;
  canGetCertificate: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const roleName = typeof user.role === 'string' 
          ? user.role.replace(/^ROLE_/i, "").toUpperCase() 
          : null;
          
        set({
          user: { ...user, role: roleName },
          accessToken: token,
          role: roleName,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          role: null,
          isAuthenticated: false,
        });
      },

      isAdmin: () => {
        const role = get().role;
        return role ? ADMIN_ROLES.includes(role) : false;
      },

      isLearner: () => {
        const role = get().role;
        return role ? LEARNER_ROLES.includes(role) : false;
      },

      canManageCourses: () => {
        const role = get().role;
        return role ? canAccessAdminSection(role, 'courses') : false;
      },

      canGetCertificate: () => {
        const role = get().role;
        return role ? CERTIFICATE_ROLES.includes(role) : false;
      },
    }),
    {
      name: 'itas-auth-storage',
      // Only persist the token and role for quick initial checks
      // Full user data will be refreshed via NextAuth session sync
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        role: state.role,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
