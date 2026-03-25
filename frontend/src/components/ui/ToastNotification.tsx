"use client";

import { useUIStore } from "@/lib/store";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export function ToastNotification() {
  const { toast, hideToast } = useUIStore();

  if (!toast.visible) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-rose-50 border-rose-200 text-rose-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[toast.type]} max-w-sm`}>
        {icons[toast.type]}
        <p className="text-sm font-medium flex-1 mr-2">{toast.message}</p>
        <button 
          onClick={hideToast}
          className="text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
