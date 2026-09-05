const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dateFromKey(value: string): Date | undefined {
  if (!value || !DATE_KEY_RE.test(value)) return undefined;

  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return undefined;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;

  // Guard against Date() normalization (e.g. 2026-13-01 => 2027-01-01).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;

  return date;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];

export function dateLabel(value: string): string {
  if (!value) return '';
  const date = dateFromKey(value);
  if (!date) return value;
  return `${weekdays[date.getDay()]} ${String(date.getDate()).padStart(2, '0')}, ${months[date.getMonth()]}`;
}
