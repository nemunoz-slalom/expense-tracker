import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';

import { DateFilter, DateFilterValue } from './DateFilter';
import { TypeFilter } from './TypeFilter';
import { Button } from '@/components/ui/button';
import { ServiceType } from '@/types/services';

interface FilterPanelProps {
  dateFilter: DateFilterValue;
  type?: ServiceType;
  onDateFilterChange: (value: DateFilterValue) => void;
  onTypeChange: (value?: ServiceType) => void;
  onReset: () => void;
}

export function FilterPanel({ dateFilter, type, onDateFilterChange, onTypeChange, onReset }: FilterPanelProps): JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>();

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    if (!window.ResizeObserver) return undefined;

    const updateHeight = (): void => {
      const panel = content.parentElement;
      if (!panel) return;
      const styles = window.getComputedStyle(panel);
      const verticalChrome = (Number.parseFloat(styles.paddingTop) || 0)
        + (Number.parseFloat(styles.paddingBottom) || 0)
        + (Number.parseFloat(styles.borderTopWidth) || 0)
        + (Number.parseFloat(styles.borderBottomWidth) || 0);
      setContentHeight(content.getBoundingClientRect().height + verticalChrome);
    };

    updateHeight();
    const observer = new window.ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.section
      className="filter-panel"
      aria-label={t('filter.title')}
      animate={contentHeight === undefined ? undefined : { height: contentHeight }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.32, ease: 'easeInOut' }}
      style={contentHeight === undefined ? undefined : { overflow: 'hidden' }}
    >
      <div ref={contentRef} className="filter-panel-content">
        <DateFilter value={dateFilter} onChange={onDateFilterChange} />
        <TypeFilter value={type} onChange={onTypeChange} />
        <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}>
          <Button variant="outline" onClick={onReset}>{t('filter.reset')}</Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
