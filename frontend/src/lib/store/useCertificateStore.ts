import { create } from 'zustand';
import type { Certificate } from '@/types';
import { getMyCertificates, downloadCertificate } from '@/lib/api/certificates';

interface CertificateState {
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCertificates: () => Promise<void>;
  downloadMap: Record<string, boolean>; // track download loading states
  triggerDownload: (id: number | string) => Promise<void>;
}

export const useCertificateStore = create<CertificateState>((set, get) => ({
  certificates: [],
  isLoading: false,
  error: null,
  downloadMap: {},

  fetchCertificates: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMyCertificates();
      set({ certificates: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch certificates', isLoading: false });
    }
  },

  triggerDownload: async (id) => {
    set((state) => ({ downloadMap: { ...state.downloadMap, [String(id)]: true } }));
    try {
      await downloadCertificate(id);
    } catch (err) {
      console.error(`Failed to download certificate ${id}`, err);
    } finally {
      set((state) => ({ downloadMap: { ...state.downloadMap, [String(id)]: false } }));
    }
  }
}));
