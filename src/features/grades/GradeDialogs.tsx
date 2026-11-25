import {useState} from 'react';
import {Save,Trash2} from 'lucide-react';
import {FormField,Modal,Notice} from '../../components/UI';
import {makeId} from '../../lib/seed';
import type {GradeGroup,GradeItem} from '../../lib/types';

type Shared<T>={initial?:T;onSave:(entry:T)=>void;onDelete?:(id:string)=>void;onClose:()=>void};
export function GradeGroupDialog({subjectId,initial,onSave,onDelete,onClose}:Shared<GradeGroup>&{subjectId:string}){
  const [name,setName]=useState(initial?.name??'');const [weight,setWeight]=useState(initial?.weight??100);
  const [minimum,setMinimum]=useState(initial?.minimum?.toString()??'');
  const [error,setError]=useState('');
  const submit=()=>{if(!name.trim()){setError('Indica el nombre del bloque.');return;}
    if(weight<=0||weight>100){setError('La ponderación debe estar entre 0 y 100%.');return;}
    onSave({id:initial?.id??makeId(),kind:'gradeGroup',subjectId,name:name.trim(),weight,minimum:minimum===''?null:Number(minimum)});
  };
  return <Modal title={initial?'Editar bloque':'Añadir bloque de evaluación'} onClose={onClose}><div className="form-stack">
    <FormField label="Nombre del bloque"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ej.: Teoría"/></FormField>
    <div className="form-grid two"><FormField label="Peso en la nota final (%)"><input type="number" min="0.01" max="100" step="0.01" value={weight} onChange={e=>setWeight(Number(e.target.value))}/></FormField>
    <FormField label="Nota mínima del bloque (opcional)"><input type="number" min="0" max="10" step="0.01" value={minimum} onChange={e=>setMinimum(e.target.value)} placeholder="Sin mínimo"/></FormField></div>
    {error&&<Notice type="error">{error}</Notice>}<div className="dialog-actions">{initial&&onDelete&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar este bloque y todas sus pruebas?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
      <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit}><Save size={16}/>Guardar</button></div>
  </div></Modal>;
}
export function GradeItemDialog({groupId,initial,onSave,onDelete,onClose}:Shared<GradeItem>&{groupId:string}){
  const [name,setName]=useState(initial?.name??'');const [weight,setWeight]=useState(initial?.weight??100);
  const [score,setScore]=useState(initial?.score?.toString()??'');const [minimum,setMinimum]=useState(initial?.minimum?.toString()??'');
  const [mandatory,setMandatory]=useState(initial?.mandatory??false);
  const [error,setError]=useState('');
  const submit=()=>{if(!name.trim()){setError('Indica el nombre de la prueba.');return;}
    if(weight<=0||weight>100){setError('El peso debe estar entre 0 y 100%.');return;}
    if((score!==''&&(Number(score)<0||Number(score)>10))||(minimum!==''&&(Number(minimum)<0||Number(minimum)>10))){setError('Las notas deben estar entre 0 y 10.');return;}
    onSave({id:initial?.id??makeId(),kind:'gradeItem',groupId,name:name.trim(),weight,
      score:score===''?null:Number(score),minimum:minimum===''?null:Number(minimum),mandatory});
  };
  return <Modal title={initial?'Editar prueba':'Añadir prueba'} onClose={onClose}><div className="form-stack">
    <FormField label="Nombre de la prueba"><input autoFocus placeholder="Ej.: 2.º parcial" value={name} onChange={e=>setName(e.target.value)}/></FormField>
    <div className="form-grid two"><FormField label="Peso dentro del bloque (%)"><input type="number" min="0.01" max="100" step="0.01" value={weight} onChange={e=>setWeight(Number(e.target.value))}/></FormField>
      <FormField label="Nota obtenida (0–10)"><input type="number" min="0" max="10" step="0.01" placeholder="Pendiente" value={score} onChange={e=>setScore(e.target.value)}/></FormField></div>
    <FormField label="Mínimo obligatorio (opcional)"><input type="number" min="0" max="10" step="0.01" placeholder="Sin mínimo" value={minimum} onChange={e=>setMinimum(e.target.value)}/></FormField>
    <label className="check-line"><input type="checkbox" checked={mandatory} onChange={e=>setMandatory(e.target.checked)}/>Prueba / entrega obligatoria</label>
    {error&&<Notice type="error">{error}</Notice>}<div className="dialog-actions">{initial&&onDelete&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar esta prueba?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
      <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit}><Save size={16}/>Guardar</button></div>
  </div></Modal>;
}
