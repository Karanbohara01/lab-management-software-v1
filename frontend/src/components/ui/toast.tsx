import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  notify: (tone: ToastTone, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-success/30 text-success',
  error: 'border-danger/30 text-danger',
  info: 'border-primary/30 text-primary',
};

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++seq;
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (m) => notify('success', m),
      error: (m) => notify('error', m),
      info: (m) => notify('info', m),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface p-3 text-sm shadow-popover animate-fade-in',
                TONE_CLASS[toast.tone],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1 text-foreground">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-muted hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
