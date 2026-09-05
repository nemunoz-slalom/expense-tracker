import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  content: ReactNode;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  showUndo: (content: ReactNode) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const show = useCallback((kind: ToastKind, content: ReactNode, autoDismiss = true): number => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, content }]);
    if (autoDismiss && kind !== 'error') window.setTimeout(() => dismiss(id), 3000);
    return id;
  }, [dismiss]);
  const { t } = useTranslation();

  return (
    <ToastContext.Provider value={{
      success: (message) => { show('success', message); },
      error: (message) => { show('error', message); },
      info: (message) => { show('info', message); },
      showUndo: (content) => show('info', content, false),
      dismiss,
    }}>
      {children}
      <div className="toaster" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
            {toast.content}
            <Button className="toast-dismiss" aria-label={t('toast.dismiss')} onClick={() => dismiss(toast.id)}>×</Button>
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
