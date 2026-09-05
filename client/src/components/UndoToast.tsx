import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';

import { UNDO_DURATION_MS } from '@/hooks/useUndoTimer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UndoToastProps {
  expiresAt: number;
  onUndo: () => void;
}

function remainingMilliseconds(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

export function UndoToast({ expiresAt, onUndo }: UndoToastProps): JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [remaining, setRemaining] = useState(() => remainingMilliseconds(expiresAt));
  const seconds = Math.ceil(remaining / 1_000);

  useEffect(() => {
    const update = (): void => setRemaining(remainingMilliseconds(expiresAt));
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return (
    <motion.div
      className="undo-toast"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
    >
      <span>{t('undo.created')}</span>
      <span className="sr-only">{t('undo.countdown', { seconds })}</span>
      <Progress value={(remaining / UNDO_DURATION_MS) * 100} />
      <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}>
        <Button className="toast-action" onClick={onUndo}>{t('undo.action')}</Button>
      </motion.div>
    </motion.div>
  );
}
