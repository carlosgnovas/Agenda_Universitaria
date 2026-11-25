export type CalendarKind = 'exam' | 'assignment' | 'class' | 'study' | 'reminder';
export type Priority = 'low' | 'medium' | 'high';
export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BaseEntity { id: string; kind: EntityKind; }
export type EntityKind = 'year' | 'subject' | 'category' | 'gradeGroup' | 'gradeItem' | 'event' | 'task';

export interface AcademicYear extends BaseEntity {
  kind: 'year'; name: string; starts: string; ends: string;
}
export interface Subject extends BaseEntity {
  kind: 'subject'; yearId: string; name: string; abbreviation: string;
  color: string; folder: string; description: string; target: number;
}
export interface Category extends BaseEntity {
  kind: 'category'; name: string; color: string; icon: string;
}
export interface GradeGroup extends BaseEntity {
  kind: 'gradeGroup'; subjectId: string; name: string; weight: number;
  minimum: number | null;
}
export interface GradeItem extends BaseEntity {
  kind: 'gradeItem'; groupId: string; name: string; weight: number;
  score: number | null; minimum: number | null; mandatory: boolean;
}
export interface EventException {
  date: string; cancelled?: boolean; title?: string; start?: string; end?: string;
}
export interface CalendarEvent extends BaseEntity {
  kind: 'event'; title: string; description: string; eventKind: CalendarKind;
  subjectId: string | null; categoryId: string | null;
  start: string; end: string; allDay: boolean;
  frequency: RepeatFrequency; interval: number; weekDays: number[];
  until: string | null; exceptions: EventException[];
}
export interface AgendaTask extends BaseEntity {
  kind: 'task'; title: string; description: string; subjectId: string | null;
  categoryId: string | null; priority: Priority; due: string | null;
  completed: boolean;
}
export type Entity = AcademicYear | Subject | Category | GradeGroup | GradeItem | CalendarEvent | AgendaTask;

export type ServerConfig = { url: string; publishableKey: string };
export type SyncStatus = 'local' | 'loading' | 'synced' | 'saving' | 'error';
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'multiMonthYear';

export const KIND_NAMES: Record<CalendarKind, string> = {
  exam: 'Examen', assignment: 'Entrega', class: 'Clase', study: 'Estudio', reminder: 'Recordatorio'
};
export const KIND_COLORS: Record<CalendarKind, string> = {
  exam: '#fb7185', assignment: '#f6b74d', class: '#7aa6ff', study: '#ab8fff', reminder: '#56c6ad'
};
export const PRIORITY_NAMES: Record<Priority, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };
export const REPEAT_NAMES: Record<RepeatFrequency, string> = {
  none: 'No se repite', daily: 'Cada día', weekly: 'Cada semana', monthly: 'Cada mes', yearly: 'Cada año'
};
export const APP_START = '2026-01-01';
export const APP_END_EXCLUSIVE = '2031-01-01';
