import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './ui/AlertDialog';

interface DeleteConfirmationProps {
  serviceName: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmation({ serviceName, onOpenChange, onConfirm }: DeleteConfirmationProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <AlertDialog open={Boolean(serviceName)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
        <AlertDialogDescription>{t('delete.description', { name: serviceName })}</AlertDialogDescription>
        <div className="form-actions">
          <AlertDialogCancel className="button secondary">{t('service.cancel')}</AlertDialogCancel>
          <AlertDialogAction className="button destructive" onClick={(event) => { event.preventDefault(); void onConfirm(); }}>{t('delete.confirm')}</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
