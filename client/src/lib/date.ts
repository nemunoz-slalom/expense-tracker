export function dateFromKey(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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
  const date = dateFromKey(value);
  if (!date) return '';
  return `${weekdays[date.getDay()]} ${String(date.getDate()).padStart(2, '0')}, ${months[date.getMonth()]}`;
}
