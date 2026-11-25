import { useEffect, type ReactNode } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function Modal({title,children,onClose,wide=false,footer}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean;footer?:ReactNode}) {
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} role="presentation">
    <section className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20}/></button></header>
      <div className="modal-body">{children}</div>{footer&&<div className="modal-footer">{footer}</div>}
    </section></div>;
}
export function Empty({icon, title, message, action}:{icon:ReactNode;title:string;message:string;action?:ReactNode}){
  return <div className="empty-state"><div className="empty-icon">{icon}</div><strong>{title}</strong><p>{message}</p>{action}</div>;
}
export function Pill({children,color='slate'}:{children:ReactNode;color?:'slate'|'success'|'warning'|'danger'|'info'}){
  return <span className={`pill pill-${color}`}>{children}</span>;
}
export function Notice({type='info',children}:{type?:'info'|'success'|'error';children:ReactNode}){
  const Icon=type==='success'?CheckCircle2:type==='error'?AlertCircle:Info;
  return <div className={`notice notice-${type}`}><Icon size={17}/><span>{children}</span></div>;
}
export function FormField({label,children,hint}:{label:string;children:ReactNode;hint?:string}){
  return <label className="form-field"><span className="field-label">{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
}
