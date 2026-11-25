import { useState } from 'react';
import { Trash2, Save } from 'lucide-react';
import { Modal, FormField, Notice } from '../../components/UI';
import { makeId } from '../../lib/seed';
import { localDateTime, withinBounds } from '../../lib/dates';
import { byKind } from '../../lib/selectors';
import { KIND_NAMES, REPEAT_NAMES, type CalendarEvent, type CalendarKind, type Entity, type RepeatFrequency } from '../../lib/types';

type Props={items:Entity[];initial?:CalendarEvent;date?:string;occurrenceDate?:string;onSave:(v:CalendarEvent)=>void;onDelete:(id:string)=>void;onClose:()=>void};
const DAYS=[{n:1,t:'L'},{n:2,t:'M'},{n:3,t:'X'},{n:4,t:'J'},{n:5,t:'V'},{n:6,t:'S'},{n:0,t:'D'}];
function suggestStart(day:string){return `${day}T09:00`;}
function suggestEnd(day:string){return `${day}T10:00`;}
function shiftToDate(value:string,day:string){const d=new Date(value);if(Number.isNaN(d.getTime()))return `${day}T09:00`;return `${day}T${value.slice(11,16)}`;}

export function EventDialog({items,initial,date,occurrenceDate,onSave,onDelete,onClose}:Props){
  const day=occurrenceDate??date??new Date().toISOString().slice(0,10);
  const occurrenceOverride=initial?.exceptions.find(e=>e.date===occurrenceDate);
  const defaultStart=occurrenceOverride?.start??(initial?(occurrenceDate?shiftToDate(initial.start,day):initial.start):suggestStart(day));
  const defaultEnd=occurrenceOverride?.end??(initial?(occurrenceDate?shiftToDate(initial.end,day):initial.end):suggestEnd(day));
  const [title,setTitle]=useState(occurrenceOverride?.title??initial?.title??'');
  const [description,setDescription]=useState(initial?.description??'');
  const [eventKind,setEventKind]=useState<CalendarKind>(initial?.eventKind??'exam');
  const [subjectId,setSubjectId]=useState(initial?.subjectId??'');
  const [categoryId,setCategoryId]=useState(initial?.categoryId??'');
  const [start,setStart]=useState(defaultStart);
  const [end,setEnd]=useState(defaultEnd);
  const [allDay,setAllDay]=useState(initial?.allDay??false);
  const [frequency,setFrequency]=useState<RepeatFrequency>(initial?.frequency??'none');
  const [interval,setInterval]=useState(initial?.interval??1);
  const [until,setUntil]=useState(initial?.until??'');
  const [weekDays,setWeekDays]=useState<number[]>(initial?.weekDays??[]);
  const [scope,setScope]=useState<'single'|'series'>(initial?.frequency!=='none'&&occurrenceDate?'single':'series');
  const [error,setError]=useState('');
  const subjects=byKind(items,'subject');const categories=byKind(items,'category');
  const recurring=!!initial&&initial.frequency!=='none'&&!!occurrenceDate;
  const isSingle=recurring&&scope==='single';
  const switchScope=(value:'single'|'series')=>{
    setScope(value);
    if(initial){setStart(value==='series'?initial.start:(occurrenceOverride?.start??shiftToDate(initial.start,day)));setEnd(value==='series'?initial.end:(occurrenceOverride?.end??shiftToDate(initial.end,day)));setTitle(value==='series'?initial.title:(occurrenceOverride?.title??initial.title));}
  };
  const save=()=>{
    if(!title.trim()){setError('Introduce un título.');return;}
    if(!withinBounds(start)||!withinBounds(end)){setError('Los eventos deben estar entre 2026 y 2030.');return;}
    if(!allDay&&new Date(end).getTime()<=new Date(start).getTime()){setError('La hora final debe ser posterior a la inicial.');return;}
    if(isSingle&&initial){
      const exceptions=initial.exceptions.filter(e=>e.date!==occurrenceDate);
      onSave({...initial,exceptions:[...exceptions,{date:day,title:title.trim(),start,end}]});return;
    }
    const event:CalendarEvent={
      id:initial?.id??makeId(),kind:'event',title:title.trim(),description,eventKind,
      subjectId:subjectId||null,categoryId:categoryId||null,start,end,allDay,
      frequency,interval:Math.max(1,Math.floor(interval)||1),weekDays,until:until||null,
      exceptions:initial?.exceptions??[]
    };
    onSave(event);
  };
  const deleting=()=>{
    if(!initial)return;
    if(isSingle){onSave({...initial,exceptions:[...initial.exceptions.filter(e=>e.date!==day),{date:day,cancelled:true}]});return;}
    if(window.confirm('¿Eliminar este evento y todas sus repeticiones?'))onDelete(initial.id);
  };
  return <Modal title={initial?'Editar evento':'Nuevo evento'} wide onClose={onClose}>
    <div className="form-stack">
      {recurring&&<div className="scope-switch"><span>Editar:</span><button className={scope==='single'?'selected':''} onClick={()=>switchScope('single')}>Solo esta fecha</button><button className={scope==='series'?'selected':''} onClick={()=>switchScope('series')}>Toda la serie</button></div>}
      {isSingle&&<Notice>Solo se modificarán el título y el horario de esta ocurrencia ({day}). La serie y el resto de sus propiedades seguirán intactos.</Notice>}
      <FormField label="Título"><input autoFocus placeholder="Ej.: Segundo parcial de Estadística" value={title} onChange={e=>setTitle(e.target.value)}/></FormField>
      <div className="form-grid two">
        <FormField label="Tipo de evento"><select disabled={isSingle} value={eventKind} onChange={e=>setEventKind(e.target.value as CalendarKind)}>{Object.entries(KIND_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></FormField>
        <FormField label="Asignatura"><select disabled={isSingle} value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Sin asignatura</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.abbreviation} · {s.name}</option>)}</select></FormField>
      </div>
      <FormField label="Categoría"><select disabled={isSingle} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Sin categoría</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
      <label className="check-line"><input type="checkbox" disabled={isSingle} checked={allDay} onChange={e=>setAllDay(e.target.checked)}/>Evento de día completo</label>
      <div className="form-grid two">
        <FormField label="Comienzo"><input type={allDay?'date':'datetime-local'} min="2026-01-01" max="2030-12-31T23:59" value={allDay?start.slice(0,10):start} onChange={e=>{
          const v=allDay?`${e.target.value}T00:00`:e.target.value;setStart(v);
          if(allDay)setEnd(`${e.target.value}T23:59`);
          else if(new Date(v).getTime()>=new Date(end).getTime())setEnd(localDateTime(new Date(new Date(v).getTime()+3600000)));
        }}/></FormField>
        <FormField label="Final"><input type={allDay?'date':'datetime-local'} min="2026-01-01" max="2030-12-31T23:59" value={allDay?end.slice(0,10):end} onChange={e=>setEnd(allDay?`${e.target.value}T23:59`:e.target.value)}/></FormField>
      </div>
      {!isSingle&&<>
        <div className="form-grid two">
          <FormField label="Repetición"><select value={frequency} onChange={e=>setFrequency(e.target.value as RepeatFrequency)}>{Object.entries(REPEAT_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></FormField>
          {frequency!=='none'&&<FormField label="Cada cuántas unidades"><input type="number" min="1" max="365" value={interval} onChange={e=>setInterval(Number(e.target.value))}/></FormField>}
        </div>
        {frequency==='weekly'&&<FormField label="Días de la semana"><div className="weekday-row">{DAYS.map(d=><button key={d.n} className={weekDays.includes(d.n)?'active':''} onClick={()=>setWeekDays(old=>old.includes(d.n)?old.filter(n=>n!==d.n):[...old,d.n])}>{d.t}</button>)}</div></FormField>}
        {frequency!=='none'&&<FormField label="Repetir hasta (opcional)"><input type="date" min={start.slice(0,10)} max="2030-12-31" value={until} onChange={e=>setUntil(e.target.value)}/></FormField>}
      </>}
      <FormField label="Notas o descripción"><textarea rows={3} disabled={isSingle} placeholder="Aula, temario, instrucciones..." value={description} onChange={e=>setDescription(e.target.value)}/></FormField>
      {error&&<Notice type="error">{error}</Notice>}
      <div className="dialog-actions">
        {initial&&<button className="btn btn-danger-ghost" onClick={deleting}><Trash2 size={16}/>{isSingle?'Omitir esta fecha':'Eliminar evento'}</button>}
        <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><Save size={16}/>Guardar</button>
      </div>
    </div>
  </Modal>;
}
