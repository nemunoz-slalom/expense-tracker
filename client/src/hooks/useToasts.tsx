import { createContext, ReactNode, useContext } from 'react';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  showUndo: (content: ReactNode) => string | number;
  dismiss: (id: string | number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ToastContext.Provider value={{
      success: (message) => { toast.success(message); },
      error: (message) => { toast.error(message); },
      info: (message) => { toast(message); },
      showUndo: (content) => toast(content, { duration: Infinity }),
      dismiss: toast.dismiss,
    }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastApi {
  const toasts = useContext(ToastContext);
  if (!toasts) throw new Error('useToasts must be used within ToastProvider');
  return toasts;
}
