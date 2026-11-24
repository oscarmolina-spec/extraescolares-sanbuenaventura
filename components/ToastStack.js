'use client';

import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const STYLES = {
  exito: {
    container: 'bg-slate-900 text-white border-emerald-500/40 dark:bg-slate-800',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  },
  error: {
    container: 'bg-slate-900 text-white border-red-500/40 dark:bg-slate-800',
    icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
  },
  advertencia: {
    container: 'bg-slate-900 text-white border-amber-500/40 dark:bg-slate-800',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  },
  info: {
    container: 'bg-slate-900 text-white border-blue-500/40 dark:bg-slate-800',
    icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  },
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2rem))] pointer-events-none"
    >
      {toasts.map((toast) => {
        const theme = STYLES[toast.tipo] || STYLES.info;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium leading-snug ${theme.container}`}
          >
            <div className="mt-0.5">{theme.icon}</div>
            <span className="flex-1">{toast.mensaje}</span>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="text-slate-400 hover:text-white transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
