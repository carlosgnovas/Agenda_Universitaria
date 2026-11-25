import {useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {BookOpen,CalendarDays,Check,ChevronDown,Cloud,CloudOff,GraduationCap,LayoutDashboard,ListTodo,Settings,Plus,RefreshCw} from 'lucide-react';
import {useAgenda} from './lib/useAgenda';
import {byKind} from './lib/selectors';
import type {AgendaTask,CalendarEvent} from './lib/types';
import {Dashboard} from './features/Dashboard';
import {CalendarPage} from './features/calendar/CalendarPage';
import {EventDialog} from './features/calendar/EventDialog';
import {SubjectsPage} from './features/subjects/SubjectsPage';
import {TasksPage} from './features/tasks/TasksPage';
import {TaskDialog} from './features/tasks/TaskDialog';
import {SettingsPage} from './features/settings/SettingsPage';
import {ServerNotice} from './features/settings/ServerNotice';
import './styles/app.css';

type Page='dashboard'|'calendar'|'subjects'|'tasks'|'settings';
const NAV:{page:Page;name:string;icon:LucideIcon}[]=[
  {page:'dashboard',name:'Inicio',icon:LayoutDashboard},
  {page:'calendar',name:'Calendario',icon:CalendarDays},
  {page:'subjects',name:'Asignaturas',icon:BookOpen},
  {page:'tasks',name:'Tareas',icon:ListTodo},
  {page:'settings',name:'Configuración',icon:Settings}
];
export default function App(){
  const store=useAgenda();const {items,save,remove,status,user}=store;
  const [page,setPage]=useState<Page>('dashboard');
  const years=byKind(items,'year').sort((a,b)=>a.starts.localeCompare(b.starts));
  const [selectedYear,setSelectedYear]=useState('');
  const yearId=years.some(y=>y.id===selectedYear)?selectedYear:(years[0]?.id??'');
  const activeYear=years.find(y=>y.id===yearId);
  const [eventDialog,setEventDialog]=useState<{initial?:CalendarEvent;date?:string;occurrenceDate?:string}|null>(null);
  const [taskDialog,setTaskDialog]=useState<{initial?:AgendaTask;date?:string}|null>(null);
  const [focusSubject,setFocusSubject]=useState<string|null>(null);
  const [hideNotice,setHideNotice]=useState(false);
  const onSubject=(id:string)=>{
    const subj=byKind(items,'subject').find(s=>s.id===id);
    if(subj)setSelectedYear(subj.yearId);
    setFocusSubject(id);setPage('subjects');
  };
  const closeEvent=()=>setEventDialog(null);const closeTask=()=>setTaskDialog(null);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><GraduationCap size={25}/></div><div className="brand-text"><strong>Agenda</strong><span>UNIVERSITARIA</span></div></div>
      <div className="sidebar-group-label">ESPACIO DE TRABAJO</div>
      <nav aria-label="Navegación principal" className="nav-links">{NAV.slice(0,4).map(entry=>{
        const Icon=entry.icon;return <button key={entry.page} className={`nav-link ${page===entry.page?'active':''}`} onClick={()=>setPage(entry.page)}><Icon size={19}/><span>{entry.name}</span>{page===entry.page&&<span className="nav-active-dot"/>}</button>;
      })}</nav>
      <div className="sidebar-group-label second-label">ACADÉMICO</div>
      <div className="year-display"><CalendarDays size={17}/><span className="grow">Curso académico</span></div>
      <div className="year-picker"><select aria-label="Curso académico" value={yearId} onChange={e=>setSelectedYear(e.target.value)}>{years.map(y=><option value={y.id} key={y.id}>{y.name}</option>)}{!years.length&&<option value="">Sin cursos</option>}</select><ChevronDown size={15}/></div>
      <div className="sidebar-spacer"/>
      <button className={`nav-link settings-link ${page==='settings'?'active':''}`} onClick={()=>setPage('settings')}><Settings size={19}/><span>Configuración</span></button>
      <div className="sidebar-footer"><div className="sidebar-avatar">{user?.email?.slice(0,1).toUpperCase()||'AU'}</div><div className="sidebar-user"><strong>{user?.email?.split('@')[0]||'Mi agenda'}</strong><small>{user?'Cuenta conectada':'Almacenamiento local'}</small></div></div>
    </aside>
    <div className="main-column"><header className="topbar"><div className="breadcrumb"><span>Mi espacio</span><span className="breadcrumb-divider">/</span><strong>{NAV.find(x=>x.page===page)?.name}</strong>{page!=='settings'&&activeYear&&<span className="top-year">{activeYear.name}</span>}</div>
      <div className="top-actions">
        <div className={`sync-indicator ${status}`} title={status==='error'?store.syncError:status==='synced'?'Datos sincronizados':status==='local'?'Los datos se guardan en este equipo':status==='saving'?'Guardando cambios...':'Cargando datos...'}>
          {status==='synced'?<Cloud size={17}/>:status==='local'||status==='error'?<CloudOff size={17}/>:<RefreshCw size={17}/>}
          <span>{status==='synced'?'Sincronizado':status==='error'?'Error de conexión':status==='saving'?'Guardando':status==='loading'?'Conectando':'Modo local'}</span>
          {status==='synced'&&<Check size={12}/>}</div>
        <button className="top-add-button" aria-label="Añadir evento" onClick={()=>setEventDialog({date:new Date().toLocaleDateString('sv-SE')})}><Plus size={19}/></button>
      </div></header>
      <main className="main-scroller">
        {!hideNotice&&!user&&page!=='settings'&&<ServerNotice onDismiss={()=>setHideNotice(true)} onSettings={()=>setPage('settings')}/>}
        {page==='dashboard'&&<Dashboard items={items} yearId={yearId} onCalendar={()=>setPage('calendar')} onSubjects={()=>setPage('subjects')}
          onTasks={()=>setPage('tasks')} onNewEvent={()=>setEventDialog({date:new Date().toLocaleDateString('sv-SE')})}
          onNewTask={()=>setTaskDialog({})} onEditEvent={(ev,d)=>setEventDialog({initial:ev,occurrenceDate:d})}
          onEditTask={t=>setTaskDialog({initial:t})} onOpenSubject={onSubject}/>}
        {page==='calendar'&&<CalendarPage items={items} onNewEvent={date=>setEventDialog({date})} onEditEvent={(ev,occurrenceDate)=>setEventDialog({initial:ev,occurrenceDate})}
          onNewTask={date=>setTaskDialog({date})} onEditTask={initial=>setTaskDialog({initial})}/>}
        {page==='subjects'&&<SubjectsPage store={store} yearId={yearId} focusSubjectId={focusSubject} onSubjectFocused={()=>setFocusSubject(null)}/>}
        {page==='tasks'&&<TasksPage items={items} onNew={()=>setTaskDialog({})} onEdit={initial=>setTaskDialog({initial})} onToggle={task=>save({...task,completed:!task.completed})}/>}
        {page==='settings'&&<SettingsPage store={store}/>}
      </main>
      <footer className="app-bottom"><span>Agenda Universitaria · 2026–2030</span><span>v1.0.0</span></footer>
    </div>
    {eventDialog&&<EventDialog items={items} initial={eventDialog.initial} date={eventDialog.date} occurrenceDate={eventDialog.occurrenceDate}
      onSave={ev=>{save(ev);closeEvent();}} onDelete={id=>{remove(id);closeEvent();}} onClose={closeEvent}/>}
    {taskDialog&&<TaskDialog items={items} initial={taskDialog.initial} date={taskDialog.date}
      onSave={task=>{save(task);closeTask();}} onDelete={id=>{remove(id);closeTask();}} onClose={closeTask}/>}
  </div>;
}
