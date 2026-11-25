export function pad(n: number): string { return String(n).padStart(2, '0'); }
export function dateISO(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
export function localDateTime(d: Date): string { return `${dateISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
export function todayISO(): string { return dateISO(new Date()); }
export function datePlusDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate()+days); return dateISO(date);
}
export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', options || { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
export function formatHour(value: string): string { return value.length >= 16 ? value.slice(11,16) : ''; }
export function sameDay(a: string,b: string) { return a.slice(0,10) === b.slice(0,10); }
export function withinBounds(date: string) { return date.slice(0,10) >= '2026-01-01' && date.slice(0,10) < '2031-01-01'; }
