import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventClickArg, DatesSetArg, EventInput } from '@fullcalendar/core';
import { CalendarDays, Plus, ListFilter } from 'lucide-react';
import { byKind, findCategory, findSubject } from '../../lib/selectors';
import { expandEvents } from '../../lib/recurrence';
import { KIND_COLORS, KIND_NAMES, type AgendaTask, type CalendarEvent, type CalendarView, type Entity, type CalendarKind } from '../../lib/types';
import { Empty } from '../../components/UI';

const VIEW_OPTIONS: {name:string;value:CalendarView}[]=[
  {name:'Día',value:'timeGridDay'},{name:'Semana',value:'timeGridWeek'},
  {name:'Mes',value:'dayGridMonth'},{name:'Año',value:'multiMonthYear'}
];
const VIEWS_INIT = {start:'2026-11-01',end:'2026-12-12'};

type Props={items:Entity[];onNewEvent:(day:string)=>void;onEditEvent:(event:CalendarEvent,occurrenceDate:string)=>void;
  onNewTask:(day?:string)=>void;onEditTask:(task:AgendaTask)=>void};
export function CalendarPage({items,onNewEvent,onEditEvent,onNewTask,onEditTask}:Props){
  const calendarRef=useRef<FullCalendar>(null);
  const [view,setView]=useState<CalendarView>('dayGridMonth');
  const [range,setRange]=useState(VIEWS_INIT);
  const [filterSubject,setFilterSubject]=useState('');
  const [filterKind,setFilterKind]=useState<CalendarKind|'all'|'tasks'>('all');
  const [showTasks,setShowTasks]=useState(true);
  const events=byKind(items,'event');const tasks=byKind(items,'task');const subjects=byKind(items,'subject');
  const calendarEvents=useMemo<EventInput[]>(()=>{
    const list:EventInput[]=[];
    for(const event of events){
      if(filterSubject&&event.subjectId!==filterSubject)continue;
      if(filterKind!=='all'&&(filterKind==='tasks'||event.eventKind!==filterKind))continue;
      const subject=findSubject(items,event.subjectId);
      const category=findCategory(items,event.categoryId);
      const color=subject?.color??category?.color??KIND_COLORS[event.eventKind];
      for(const occurrence of expandEvents(event,range.start,range.end)) {
        list.push({id:occurrence.id,title:`${category?.icon==='star'?'★ ':''}${occurrence.title}`,start:occurrence.allDay?occurrence.start.slice(0,10):occurrence.start,
          end:occurrence.allDay?undefined:occurrence.end,allDay:occurrence.allDay,
          backgroundColor:color,borderColor:color,textColor:'#101521',extendedProps:{entityId:event.id,kind:'event',occurrenceDate:occurrence.date}});
      }
    }
    if(showTasks&&(filterKind==='all'||filterKind==='tasks')){
      for(const task of tasks){
        if(!task.due||(filterSubject&&task.subjectId!==filterSubject))continue;
        if(task.due<range.start||task.due>range.end)continue;
        const color=task.completed?'#637184':'#6fc4b5';
        list.push({id:`task-${task.id}`,title:`${task.completed?'✓':'□'} ${task.title}`,start:task.due,allDay:true,
          backgroundColor:color,borderColor:color,textColor:'#101521',extendedProps:{entityId:task.id,kind:'task'}});
      }
    }
    return list;
  },[items,events,tasks,range.start,range.end,filterSubject,filterKind,showTasks]);
  const clickEvent=(arg:EventClickArg)=>{
    const props=arg.event.extendedProps as {entityId:string;kind:string;occurrenceDate?:string};
    if(props.kind==='task'){const task=tasks.find(t=>t.id===props.entityId);if(task)onEditTask(task);}
    else {const entity=events.find(t=>t.id===props.entityId);if(entity)onEditEvent(entity,props.occurrenceDate??entity.start.slice(0,10));}
  };
  const changeView=(next:CalendarView)=>{setView(next);calendarRef.current?.getApi().changeView(next);};
  const changeRange=(arg:DatesSetArg)=>{
    setRange(prev=>prev.start===arg.startStr.slice(0,10)&&prev.end===arg.endStr.slice(0,10)?prev:{start:arg.startStr.slice(0,10),end:arg.endStr.slice(0,10)});
  };
  return <div className="page-body calendar-page">
    <div className="page-heading"><div><p className="eyebrow">PLANIFICACIÓN</p><h1>Calendario</h1><p>Organiza tus clases, exámenes y entregas entre 2026 y 2030.</p></div>
      <div className="heading-actions"><button className="btn btn-outline" onClick={()=>onNewTask()}><Plus size={16}/>Tarea</button><button className="btn btn-primary" onClick={()=>onNewEvent(new Date().toISOString().slice(0,10))}><Plus size={16}/>Nuevo evento</button></div>
    </div>
    <div className="panel calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-filters">
          <ListFilter size={18} className="muted-icon"/>
          <select aria-label="Filtrar por asignatura" value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}><option value="">Todas las asignaturas</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.abbreviation}</option>)}</select>
          <select aria-label="Filtrar por tipo" value={filterKind} onChange={e=>setFilterKind(e.target.value as typeof filterKind)}><option value="all">Todos los tipos</option>{Object.entries(KIND_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}<option value="tasks">Solo tareas</option></select>
          <label className="tiny-check"><input type="checkbox" checked={showTasks} onChange={e=>setShowTasks(e.target.checked)}/> Mostrar tareas</label>
        </div>
        <div className="segmented">{VIEW_OPTIONS.map(option=><button key={option.value} className={view===option.value?'active':''} onClick={()=>changeView(option.value)}>{option.name}</button>)}</div>
      </div>
      <div className="calendar-scroll">
        <FullCalendar ref={calendarRef} plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin,multiMonthPlugin]}
          locale={esLocale} initialView="dayGridMonth" initialDate={new Date().getFullYear()>2030?'2030-12-01':new Date().getFullYear()<2026?'2026-01-01':undefined}
          validRange={{start:'2026-01-01',end:'2031-01-01'}}
          headerToolbar={{left:'prev,next today',center:'title',right:''}}
          buttonText={{today:'Hoy'}} height="auto" dayMaxEvents={3} nowIndicator={true}
          selectable={true} selectMirror={true} select={info=>onNewEvent(info.startStr.slice(0,10))}
          dateClick={info=>onNewEvent(info.dateStr.slice(0,10))} eventClick={clickEvent} datesSet={changeRange}
          events={calendarEvents} expandRows={true} firstDay={1} eventDisplay="block"
          eventTimeFormat={{hour:'2-digit',minute:'2-digit',hour12:false}}
        />
      </div>
      {!events.length&&!tasks.some(t=>t.due)&&<div className="calendar-hint"><CalendarDays size={16}/>Todavía no hay eventos. Haz clic en un día para añadir el primero.</div>}
      <div className="calendar-legend">{Object.entries(KIND_NAMES).map(([k,v])=><span key={k}><i style={{background:KIND_COLORS[k as CalendarKind]}}/>{v}</span>)}<span><i style={{background:'#6fc4b5'}}/>Tareas</span></div>
    </div>
    {!items.length&&<Empty icon={<CalendarDays/>} title="Agenda vacía" message="Crea un evento para comenzar."/>}
  </div>;
}
