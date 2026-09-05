import { useMemo } from 'react';

import { Button } from './Button';

export interface CalendarProps {
  value?: string | null;
  onSelect: (date: string) => void;
}

export function Calendar({ value, onSelect }: CalendarProps): JSX.Element {
  const days = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const length = new Date(year, month + 1, 0).getDate();

    return Array.from({ length }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
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
