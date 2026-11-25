import {useMemo} from 'react';
import {ArrowRight,BookOpen,CalendarClock,CalendarDays,CheckCircle2,ClipboardList,Plus,Target} from 'lucide-react';
import {Empty,Pill} from '../components/UI';
import {CategoryIcon} from '../components/CategoryIcon';
import {datePlusDays,formatDate,todayISO} from '../lib/dates';
import {computeGrades,formatGrade} from '../lib/grades';
import {expandEvents} from '../lib/recurrence';
import {byKind,findCategory,findSubject} from '../lib/selectors';
import {KIND_NAMES,type AgendaTask,type CalendarEvent,type Entity} from '../lib/types';

type Props={items:Entity[];yearId:string;onCalendar:()=>void;onSubjects:()=>void;onTasks:()=>void;
  onNewEvent:()=>void;onNewTask:()=>void;onEditEvent:(ev:CalendarEvent,date:string)=>void;onEditTask:(t:AgendaTask)=>void;onOpenSubject:(id:string)=>void};
export function Dashboard({items,yearId,onCalendar,onSubjects,onTasks,onNewEvent,onNewTask,onEditEvent,onEditTask,onOpenSubject}:Props){
  const today=todayISO();const in30=datePlusDays(today,30);
  const events=byKind(items,'event');const tasks=byKind(items,'task');
  const subjects=byKind(items,'subject').filter(s=>s.yearId===yearId);
  const groups=byKind(items,'gradeGroup');const grades=byKind(items,'gradeItem');
  const upcoming=useMemo(()=>events.flatMap(ev=>expandEvents(ev,today,in30).map(occ=>({...occ,parent:ev})))
    .sort((a,b)=>a.start.localeCompare(b.start)).slice(0,7),[items,today,in30]);
  const pending=tasks.filter(t=>!t.completed);
  const nextTasks=[...pending].sort((a,b)=>(a.due??'9999').localeCompare(b.due??'9999')).slice(0,5);
  const week=datePlusDays(today,7);
  const exams=upcoming.filter(ev=>ev.parent.eventKind==='exam'&&ev.date<=week).length;
  const dateText=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${today}T12:00:00`));
  return <div className="page-body dashboard">
    <div className="dashboard-hero"><div><p className="eyebrow">TU ESPACIO ACADÉMICO</p><h1>Tu universidad, organizada.</h1><p>Hoy es {dateText}. Aquí tienes lo más importante.</p></div>
      <button className="btn btn-primary" onClick={onNewEvent}><Plus size={17}/>Añadir evento</button></div>
    <div className="overview-stats">
      <button className="stat-card" onClick={onCalendar}><span className="stat-icon pink"><CalendarClock size={22}/></span><span className="stat-copy"><strong>{exams}</strong><span>Exámenes esta semana</span></span><ArrowRight size={15}/></button>
      <button className="stat-card" onClick={onTasks}><span className="stat-icon orange"><ClipboardList size={22}/></span><span className="stat-copy"><strong>{pending.length}</strong><span>Tareas pendientes</span></span><ArrowRight size={15}/></button>
      <button className="stat-card" onClick={onSubjects}><span className="stat-icon purple"><BookOpen size={22}/></span><span className="stat-copy"><strong>{subjects.length}</strong><span>Asignaturas del curso</span></span><ArrowRight size={15}/></button>
    </div>
    <div className="dashboard-columns">
      <section className="panel dashboard-panel"><div className="panel-head"><div><h2>Próximos eventos</h2><p>Lo que viene en los siguientes 30 días</p></div><button className="text-action" onClick={onCalendar}>Ver calendario <ArrowRight size={15}/></button></div>
        <div className="upcoming-list">{upcoming.map(u=>{
          const sub=findSubject(items,u.parent.subjectId);
          return <button key={u.id} className="upcoming-row" onClick={()=>onEditEvent(u.parent,u.date)}>
            <div className="date-square"><strong>{u.date.slice(8,10)}</strong><span>{formatDate(u.date,{month:'short'})}</span></div>
            <div className="grow upcoming-info"><strong>{u.parent.categoryId&&<span className="inline-category-icon"><CategoryIcon category={findCategory(items,u.parent.categoryId)} size={13}/></span>}{u.title}</strong><p>{sub?.abbreviation??KIND_NAMES[u.parent.eventKind]} · {u.allDay?'Todo el día':u.start.slice(11,16)}</p></div>
            <span className="event-color-mark" style={{background:sub?.color??'#8297ff'}}/>
          </button>;
        })}</div>
        {!upcoming.length&&<Empty icon={<CalendarDays/>} title="Sin eventos próximos" message="Añade tus exámenes y entregas para tenerlos siempre a la vista." action={<button className="btn btn-outline" onClick={onNewEvent}><Plus size={16}/>Crear evento</button>}/>}
      </section>
      <section className="panel dashboard-panel"><div className="panel-head"><div><h2>Tareas pendientes</h2><p>Trabajos y actividades por terminar</p></div><button className="text-action" onClick={onTasks}>Ver tareas <ArrowRight size={15}/></button></div>
        <div className="dashboard-task-list">{nextTasks.map(t=>{
          const sub=findSubject(items,t.subjectId);
          return <button key={t.id} className="dashboard-task-row" onClick={()=>onEditTask(t)}><span className="little-checkbox"/>
            <div className="grow"><strong>{t.title}</strong><p>{sub?.abbreviation??'General'}{t.due?` · ${formatDate(t.due)}`:''}</p></div>
            {t.priority==='high'&&<Pill color="danger">Alta</Pill>}</button>;
        })}</div>
        {!nextTasks.length&&<Empty icon={<CheckCircle2/>} title="Todo al día" message="No hay tareas pendientes. Puedes añadir una nueva en cualquier momento." action={<button className="btn btn-outline" onClick={onNewTask}><Plus size={16}/>Crear tarea</button>}/>}
      </section>
    </div>
    <section className="panel subject-preview"><div className="panel-head"><div><h2>Progreso académico</h2><p>Notas y objetivos de las asignaturas de este curso</p></div>
      <button className="text-action" onClick={onSubjects}>Ver asignaturas <ArrowRight size={15}/></button></div>
      {subjects.length?<div className="subject-cards">{subjects.map(subject=>{
        const gs=groups.filter(g=>g.subjectId===subject.id);const gr=grades.filter(g=>gs.some(x=>x.id===g.groupId));
        const sum=computeGrades(gs,gr,subject.target);
        return <button className="subject-card" key={subject.id} onClick={()=>onOpenSubject(subject.id)}>
          <div className="subject-card-top"><span className="color-square" style={{background:`${subject.color}22`,color:subject.color}}>{subject.abbreviation.slice(0,2)}</span><Target size={16}/></div>
          <strong>{subject.abbreviation}</strong><p>{subject.name}</p>
          <div className="progress-track"><div style={{background:subject.color,width:`${Math.min(100,subject.target>0?(sum.achieved/subject.target)*100:100)}%`}}/></div>
          <div className="subject-card-bottom"><span>{formatGrade(sum.achieved)} / {formatGrade(subject.target)} acumulado</span><span>{sum.pendingCount} pendientes</span></div>
        </button>;
      })}</div>:<Empty icon={<BookOpen/>} title="Sin asignaturas" message="Añade asignaturas a este curso para ver su progreso."/>}
    </section>
  </div>;
}
