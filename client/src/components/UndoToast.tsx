import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/Button';
import { Progress } from './ui/Progress';

interface UndoToastProps {
  expiresAt: number;
  onUndo: () => void;
}

const undoDurationMs = 8_000;

function remainingMilliseconds(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

export function UndoToast({ expiresAt, onUndo }: UndoToastProps): JSX.Element {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() => remainingMilliseconds(expiresAt));
  const seconds = Math.ceil(remaining / 1_000);

  useEffect(() => {
    const update = (): void => setRemaining(remainingMilliseconds(expiresAt));
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="undo-toast">
      <span>{t('undo.created')}</span>
      <span className="sr-only">{t('undo.countdown', { seconds })}</span>
      <Progress value={(remaining / undoDurationMs) * 100} />
      <Button className="toast-action" onClick={onUndo}>{t('undo.action')}</Button>
    </div>
  );
}
