import type {Entity,EntityKind,AcademicYear,Subject,Category,GradeGroup,GradeItem,CalendarEvent,AgendaTask} from './types';
export function byKind(items:Entity[],kind:'year'):AcademicYear[];
export function byKind(items:Entity[],kind:'subject'):Subject[];
export function byKind(items:Entity[],kind:'category'):Category[];
export function byKind(items:Entity[],kind:'gradeGroup'):GradeGroup[];
export function byKind(items:Entity[],kind:'gradeItem'):GradeItem[];
export function byKind(items:Entity[],kind:'event'):CalendarEvent[];
export function byKind(items:Entity[],kind:'task'):AgendaTask[];
export function byKind(items:Entity[],kind:EntityKind):Entity[] {return items.filter(e=>e.kind===kind);}
export const findSubject=(items:Entity[],id:string|null)=>id?byKind(items,'subject').find(s=>s.id===id):undefined;
export const findCategory=(items:Entity[],id:string|null)=>id?byKind(items,'category').find(s=>s.id===id):undefined;
