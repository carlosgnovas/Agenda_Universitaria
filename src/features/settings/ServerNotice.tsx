import {CloudOff,X} from 'lucide-react';
export function ServerNotice({onDismiss,onSettings}:{onDismiss:()=>void;onSettings:()=>void}){
  return <div className="server-notice"><CloudOff size={19}/><div><strong>Estás en modo local</strong><span>La aplicación ya funciona, pero los datos aún no se comparten entre ordenadores.</span></div>
    <button className="link-button" onClick={onSettings}>Configurar Supabase</button><button aria-label="Descartar aviso" className="icon-button" onClick={onDismiss}><X size={16}/></button></div>;
}
