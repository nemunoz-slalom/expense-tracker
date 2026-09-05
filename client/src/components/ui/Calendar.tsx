import { useEffect, useMemo, useState } from 'react';

import { Button } from './Button';

export interface CalendarProps {
  value?: string | null;
  onSelect: (date: string) => void;
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Calendar({ value, onSelect }: CalendarProps): JSX.Element {
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const anchor = value ? parseLocalDate(value) : new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  useEffect(() => {
    if (!value) {
      return;
    }

    const nextMonth = parseLocalDate(value);
    const monthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    setMonthCursor((currentMonth) => {
      const currentStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      return currentStart.getTime() === monthStart.getTime() ? currentMonth : monthStart;
    });
  }, [value]);

  const days = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const length = new Date(year, month + 1, 0).getDate();

    return Array.from({ length }, (_, index) => {
      const date = new Date(year, month, index + 1);
      return formatDateKey(date);
    });
  }, [monthCursor]);

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="calendar" role="grid">
      <div className="calendar-header">
        <Button
          aria-label="Previous month"
          className="calendar-nav"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
        >
          ←
        </Button>
        <span className="calendar-month-label">{monthLabel}</span>
        <Button
          aria-label="Next month"
          className="calendar-nav"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
        >
          →
        </Button>
      </div>
      {days.map((day) => (
        <Button
          key={day}
          className={value === day ? 'calendar-day selected' : 'calendar-day'}
          aria-pressed={value === day}
          onClick={() => onSelect(day)}
        >
          {parseLocalDate(day).getDate()}
        </Button>
      ))}
    </div>
  );
}
