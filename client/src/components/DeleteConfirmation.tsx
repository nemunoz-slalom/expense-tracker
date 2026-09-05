import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (serviceName) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      return;
    }

    lastActiveElementRef.current?.focus();
    lastActiveElementRef.current = null;
  }, [serviceName]);

  return (
    <AlertDialog open={Boolean(serviceName)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
        <AlertDialogDescription>{t('delete.description', { name: serviceName })}</AlertDialogDescription>
        <div className="form-actions">
          <AlertDialogCancel>{t('service.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={(event) => { event.preventDefault(); void onConfirm(); }}>{t('delete.confirm')}</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
