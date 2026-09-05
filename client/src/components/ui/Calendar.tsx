import { useMemo } from 'react';

import { Button } from './Button';

export interface CalendarProps {
  value?: string | null;
  onSelect: (date: string) => void;
}

export function Calendar({ value, onSelect }: CalendarProps): JSX.Element {
  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 31 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }, []);

  return (
    <div className="calendar" role="grid">
      {days.map((day) => (
        <Button
          key={day}
          className={value === day ? 'calendar-day selected' : 'calendar-day'}
          aria-pressed={value === day}
          onClick={() => onSelect(day)}
        >
          {new Date(`${day}T00:00:00`).getDate()}
        </Button>
      ))}
    </div>
  );
}
