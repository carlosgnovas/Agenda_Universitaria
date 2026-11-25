import type { CalendarEvent, EventException } from './types';
import {dateISO,localDateTime} from './dates';

export interface EventOccurrence {
  id: string; eventId: string; title: string; start: string; end: string;
  date: string; allDay: boolean; recurring: boolean;
}
const dayAt=(date:string)=>new Date(`${date}T12:00:00`);
const daysBetween=(a:Date,b:Date)=>Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);
const weekStart=(d:Date)=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};

export function matchesRepeat(ev:CalendarEvent, day:Date):boolean {
  const base=dayAt(ev.start.slice(0,10));
  const diff=daysBetween(base,day);
  if (diff<0) return false;
  if (ev.until && dateISO(day)>ev.until) return false;
  const step=Math.max(1,Math.trunc(ev.interval||1));
  switch(ev.frequency){
    case 'none': return diff===0;
    case 'daily': return diff%step===0;
    case 'weekly':{
      const weeks=Math.floor(daysBetween(weekStart(base),weekStart(day))/7);
      const weekdays=ev.weekDays.length?ev.weekDays:[base.getDay()];
      return weeks%step===0 && weekdays.includes(day.getDay());
    }
    case 'monthly':{
      const months=(day.getFullYear()-base.getFullYear())*12+day.getMonth()-base.getMonth();
      return months%step===0&&day.getDate()===base.getDate();
    }
    case 'yearly':return (day.getFullYear()-base.getFullYear())%step===0&&day.getMonth()===base.getMonth()&&day.getDate()===base.getDate();
  }
}
function occurrence(ev:CalendarEvent,day:Date,exception?:EventException):EventOccurrence {
  const date=dateISO(day);
  const oldStart=new Date(ev.start).getTime();
  const oldEnd=new Date(ev.end).getTime();
  const duration=Number.isFinite(oldStart)&&Number.isFinite(oldEnd)?Math.max(0,oldEnd-oldStart):3600000;
  const startDate=new Date(`${date}T${ev.start.slice(11,16)||'09:00'}`);
  const endDate=new Date(startDate.getTime()+duration);
  const start=exception?.start??(ev.allDay?date:localDateTime(startDate));
  const end=exception?.end??(ev.allDay?date:localDateTime(endDate));
  return {id:`${ev.id}::${date}`,eventId:ev.id,title:exception?.title??ev.title,start,end,date,allDay:ev.allDay,recurring:ev.frequency!=='none'};
}
export function expandEvents(ev:CalendarEvent,rangeStart:string,rangeEnd:string):EventOccurrence[] {
  if (!ev.start || ev.start.slice(0,10)>rangeEnd) return [];
  const start=dayAt(rangeStart.slice(0,10)),end=dayAt(rangeEnd.slice(0,10));
  if (start>end) return [];
  const base=dayAt(ev.start.slice(0,10));
  if(start<base)start.setTime(base.getTime());
  const found:EventOccurrence[]=[];
  // Se limita a los 5 años permitidos por la agenda, sin expandir recurrencias infinitas.
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    if(!matchesRepeat(ev,d))continue;
    const date=dateISO(d);
    const except=ev.exceptions.find(e=>e.date===date);
    if(except?.cancelled)continue;
    found.push(occurrence(ev,d,except));
  }
  // Una excepción movida puede tener su fecha original fuera de la ventana,
  // pero su nueva fecha dentro. Debe aparecer igualmente.
  for(const exception of ev.exceptions){
    if(exception.cancelled||!exception.start)continue;
    const movedDate=exception.start.slice(0,10);
    if(movedDate<rangeStart.slice(0,10)||movedDate>rangeEnd.slice(0,10))continue;
    if(found.some(o=>o.date===exception.date))continue;
    found.push(occurrence(ev,dayAt(exception.date),exception));
  }
  return found;
}
