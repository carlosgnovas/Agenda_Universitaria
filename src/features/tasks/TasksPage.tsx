import {useMemo,useState} from 'react';
import {Plus,CheckCircle2,ClipboardList,CalendarClock,SlidersHorizontal,Pencil} from 'lucide-react';
import {CategoryIcon} from '../../components/CategoryIcon';
import {Empty,Pill} from '../../components/UI';
import {formatDate} from '../../lib/dates';
import {byKind,findCategory,findSubject} from '../../lib/selectors';
import {PRIORITY_NAMES,type AgendaTask,type Entity,type Priority} from '../../lib/types';

type Props={items:Entity[];onNew:()=>void;onEdit:(task:AgendaTask)=>void;onToggle:(task:AgendaTask)=>void};
export function TasksPage({items,onNew,onEdit,onToggle}:Props){
  const [filter,setFilter]=useState<'all'|'pending'|'done'>('pending');
  const [priority,setPriority]=useState<'all'|Priority>('all');
  const [subject,setSubject]=useState('');
  const tasks=byKind(items,'task');const subjects=byKind(items,'subject');
  const filtered=useMemo(()=>tasks.filter(t=>
    (filter==='all'||(filter==='done'?t.completed:!t.completed))&&(priority==='all'||t.priority===priority)&&(!subject||t.subjectId===subject))
    .sort((a,b)=>Number(a.completed)-Number(b.completed)||((a.due||'9999').localeCompare(b.due||'9999'))||({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority])),[tasks,filter,priority,subject]);
  const pending=tasks.filter(t=>!t.completed).length;
  return <div className="page-body"><div className="page-heading"><div><p className="eyebrow">PENDIENTES Y ENTREGAS</p><h1>Tareas</h1><p>Prioriza tus trabajos y marca los progresos.</p></div>
    <button className="btn btn-primary" onClick={onNew}><Plus size={17}/>Nueva tarea</button></div>
    <div className="task-summary"><div className="panel stat-mini"><ClipboardList size={20}/><div><strong>{pending}</strong><span>Pendientes</span></div></div>
      <div className="panel stat-mini"><CheckCircle2 size={20}/><div><strong>{tasks.length-pending}</strong><span>Completadas</span></div></div>
      <div className="panel stat-mini"><CalendarClock size={20}/><div><strong>{tasks.filter(t=>!t.completed&&t.due&&t.due<new Date().toLocaleDateString('sv-SE')).length}</strong><span>Vencidas</span></div></div></div>
    <section className="panel tasks-panel">
      <div className="tasks-filter-row"><div className="segmented">{(['pending','all','done'] as const).map(k=><button key={k} className={filter===k?'active':''} onClick={()=>setFilter(k)}>{k==='pending'?'Pendientes':k==='done'?'Completadas':'Todas'}</button>)}</div>
        <div className="filters-right"><SlidersHorizontal size={17}/><select aria-label="Prioridad" value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}><option value="all">Todas las prioridades</option>{Object.entries(PRIORITY_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
          <select aria-label="Asignatura" value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Todas las asignaturas</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.abbreviation}</option>)}</select></div></div>
      <div className="task-list">{filtered.map(t=>{
        const sub=findSubject(items,t.subjectId);const overdue=!t.completed&&!!t.due&&t.due<new Date().toLocaleDateString('sv-SE');
        return <div key={t.id} className={`task-line ${t.completed?'task-complete':''}`}>
          <button className={`task-checkbox ${t.completed?'checked':''}`} aria-label={t.completed?'Marcar pendiente':'Marcar completada'} onClick={()=>onToggle(t)}>{t.completed&&<CheckCircle2 size={18}/>}</button>
          <div className="task-content"><strong>{t.title}</strong>{t.description&&<p>{t.description}</p>}
            <div className="task-meta">{sub&&<span><i style={{background:sub.color}}/>{sub.abbreviation}</span>}
              {t.categoryId&&<span><CategoryIcon size={13} category={findCategory(items,t.categoryId)}/>{findCategory(items,t.categoryId)?.name}</span>}
              {t.due&&<span className={overdue?'overdue':''}><CalendarClock size={13}/>{formatDate(t.due)}</span>}</div></div>
          <Pill color={t.priority==='high'?'danger':t.priority==='medium'?'warning':'slate'}>{PRIORITY_NAMES[t.priority]}</Pill>
          <button aria-label={`Editar ${t.title}`} className="icon-button" onClick={()=>onEdit(t)}><Pencil size={17}/></button></div>;
      })}</div>
      {!filtered.length&&<Empty icon={<ClipboardList/>} title={tasks.length?'No hay tareas con estos filtros':'Todavía no tienes tareas'} message={tasks.length?'Cambia los filtros para ver otras tareas.':'Crea tu primera tarea para organizar tus entregas y estudio.'} action={!tasks.length?<button className="btn btn-primary" onClick={onNew}><Plus size={16}/>Añadir tarea</button>:undefined}/>}
    </section>
  </div>;
}
