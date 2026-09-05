import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    if (kind !== 'error') window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3000);
  }, []);
  const { t } = useTranslation();

  return (
    <ToastContext.Provider value={{ success: (message) => show('success', message), error: (message) => show('error', message), info: (message) => show('info', message) }}>
      {children}
      <div className="toaster" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
            <span>{toast.message}</span>
            <Button className="toast-dismiss" aria-label={t('toast.dismiss')} onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>×</Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastApi {
  const toasts = useContext(ToastContext);
  if (!toasts) throw new Error('useToasts must be used within ToastProvider');
  return toasts;
}
