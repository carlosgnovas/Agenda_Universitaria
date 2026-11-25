import {useState} from 'react';
import {Save,Trash2} from 'lucide-react';
import {Modal,FormField,Notice} from '../../components/UI';
import {makeId} from '../../lib/seed';
import {byKind} from '../../lib/selectors';
import type {Subject,Entity} from '../../lib/types';

type Props={items:Entity[];yearId:string;initial?:Subject;onSave:(subject:Subject)=>void;onDelete?:(id:string)=>void;onClose:()=>void};
export function SubjectDialog({items,yearId,initial,onSave,onDelete,onClose}:Props){
  const [name,setName]=useState(initial?.name??'');
  const [abbreviation,setAbbreviation]=useState(initial?.abbreviation??'');
  const [description,setDescription]=useState(initial?.description??'');
  const [folder,setFolder]=useState(initial?.folder??'');
  const [year,setYear]=useState(initial?.yearId??yearId);
  const [color,setColor]=useState(initial?.color??'#798df5');
  const [target,setTarget]=useState(initial?.target??5);
  const [error,setError]=useState('');
  const submit=()=>{
    if(!name.trim()){setError('Introduce un nombre.');return;}
    if(!year){setError('Primero debes crear un curso académico.');return;}
    onSave({id:initial?.id??makeId(),kind:'subject',name:name.trim(),abbreviation:abbreviation.trim()||name.trim().slice(0,5).toUpperCase(),
      yearId:year,color,folder:folder.trim(),description,target:Math.max(0,Math.min(10,target))});
  };
  return <Modal title={initial?'Editar asignatura':'Nueva asignatura'} onClose={onClose}>
    <div className="form-stack">
      <FormField label="Nombre completo"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ej.: Álgebra Lineal"/></FormField>
      <div className="form-grid two"><FormField label="Abreviatura"><input maxLength={12} value={abbreviation} onChange={e=>setAbbreviation(e.target.value)} placeholder="AL"/></FormField>
        <FormField label="Curso académico"><select value={year} onChange={e=>setYear(e.target.value)}>{byKind(items,'year').map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></FormField></div>
      <div className="form-grid two"><FormField label="Carpeta / área"><input value={folder} onChange={e=>setFolder(e.target.value)} placeholder="Matemáticas"/></FormField>
        <FormField label="Color"><div className="color-line"><input aria-label="Color" type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color}</code></div></FormField></div>
      <FormField label="Nota objetivo para aprobar"><input type="number" min="0" max="10" step="0.1" value={target} onChange={e=>setTarget(Number(e.target.value))}/></FormField>
      <FormField label="Descripción"><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></FormField>
      {error&&<Notice type="error">{error}</Notice>}
      <div className="dialog-actions">{initial&&onDelete&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar la asignatura, sus calificaciones y sus eventos asociados?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
        <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit}><Save size={16}/>Guardar</button>
      </div>
    </div></Modal>;
}
