import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationProps {
  serviceName: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmation({ serviceName, onOpenChange, onConfirm }: DeleteConfirmationProps): JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (serviceName) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      return;
    }

    lastActiveElementRef.current?.focus();
    lastActiveElementRef.current = null;
  }, [serviceName]);

  const confirm = async (): Promise<void> => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog open={Boolean(serviceName)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={shouldReduceMotion ? undefined : isConfirming ? { opacity: 1, scale: 1, x: [0, -5, 5, -3, 0] } : { opacity: 1, scale: 1, x: 0 }}
          transition={shouldReduceMotion
            ? { duration: 0 }
            : isConfirming
              ? { x: { duration: 0.25, ease: 'easeInOut' }, default: { type: 'spring', stiffness: 380, damping: 28 } }
              : { type: 'spring', stiffness: 380, damping: 28 }}
        >
          <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('delete.description', { name: serviceName })}</AlertDialogDescription>
          <div className="form-actions">
            <AlertDialogCancel>{t('service.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void confirm(); }}>{t('delete.confirm')}</AlertDialogAction>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
