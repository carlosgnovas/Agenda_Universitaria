import {useState} from 'react';
import {Save,Trash2} from 'lucide-react';
import {FormField,Modal,Notice} from '../../components/UI';
import {makeId} from '../../lib/seed';
import {byKind} from '../../lib/selectors';
import {PRIORITY_NAMES,type AgendaTask,type Entity,type Priority} from '../../lib/types';

type Props={items:Entity[];initial?:AgendaTask;date?:string;onSave:(task:AgendaTask)=>void;onDelete:(id:string)=>void;onClose:()=>void};
export function TaskDialog({items,initial,date,onSave,onDelete,onClose}:Props){
  const [title,setTitle]=useState(initial?.title??'');
  const [description,setDescription]=useState(initial?.description??'');
  const [due,setDue]=useState(initial?.due??date??'');
  const [priority,setPriority]=useState<Priority>(initial?.priority??'medium');
  const [subjectId,setSubjectId]=useState(initial?.subjectId??'');
  const [categoryId,setCategoryId]=useState(initial?.categoryId??'');
  const [error,setError]=useState('');
  const submit=()=>{
    if(!title.trim()){setError('Escribe el nombre de la tarea.');return;}
    if(due&&(due<'2026-01-01'||due>'2030-12-31')){setError('La fecha debe estar entre 2026 y 2030.');return;}
    onSave({id:initial?.id??makeId(),kind:'task',title:title.trim(),description,due:due||null,priority,
      subjectId:subjectId||null,categoryId:categoryId||null,completed:initial?.completed??false});
  };
  return <Modal title={initial?'Editar tarea':'Nueva tarea'} onClose={onClose}>
    <div className="form-stack">
      <FormField label="Tarea"><input autoFocus placeholder="Ej.: Terminar boletín de ejercicios" value={title} onChange={e=>setTitle(e.target.value)}/></FormField>
      <div className="form-grid two">
        <FormField label="Prioridad"><select value={priority} onChange={e=>setPriority(e.target.value as Priority)}>{Object.entries(PRIORITY_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></FormField>
        <FormField label="Fecha límite"><input type="date" min="2026-01-01" max="2030-12-31" value={due} onChange={e=>setDue(e.target.value)}/></FormField>
      </div>
      <FormField label="Asignatura"><select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Sin asignatura</option>{byKind(items,'subject').map(s=><option value={s.id} key={s.id}>{s.abbreviation} · {s.name}</option>)}</select></FormField>
      <FormField label="Categoría"><select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Sin categoría</option>{byKind(items,'category').map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></FormField>
      <FormField label="Descripción"><textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Detalles adicionales..."/></FormField>
      {error&&<Notice type="error">{error}</Notice>}
      <div className="dialog-actions">
        {initial&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar esta tarea?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
        <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit}><Save size={16}/>Guardar</button>
      </div>
    </div>
  </Modal>;
}
