import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface UIState {
  toast: Toast;
  globalLoading: boolean;

  // Actions
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toast: { message: '', type: 'info', visible: false },
  globalLoading: false,

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, visible: true } });
    
    // Auto-hide after 4s
    setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, visible: false } }));
    }, 4000);
  },

  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),
  
  setGlobalLoading: (isLoading) => set({ globalLoading: isLoading })
}));
