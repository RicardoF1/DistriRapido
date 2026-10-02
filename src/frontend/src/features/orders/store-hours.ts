export function is12HourDraft(value: string) {
  // Allow deletion and incomplete prefixes while typing, never impossible hours/minutes.
  return value === '' || value === '0' || /^(0?[1-9]|1[0-2])(?::(?:[0-5]\d?)?)?$/.test(value);
}

export function to24Hour(time: string, period: string): string | null {
  if (!/^(0?[1-9]|1[0-2]):[0-5]\d$/.test(time) || !['AM', 'PM'].includes(period)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return `${String(hour % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function isStoreHour(time: string, edge: 'inicio' | 'fin') {
  const [hours, minutes] = time.split(':').map(Number);
  const value = hours * 60 + minutes;
  // Closing times may end a window, but cannot start a delivery.
  return (value >= 420 && (edge === 'fin' ? value <= 780 : value < 780)) ||
    (value >= 840 && (edge === 'fin' ? value <= 1200 : value < 1200));
}
