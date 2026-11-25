import {useState} from 'react';
import {Cloud,Database,Plus,Save,LogOut,RefreshCw,ShieldCheck,Palette,CalendarRange,Trash2,ExternalLink,LockKeyhole,FolderOpen} from 'lucide-react';
import {FormField,Modal,Notice,Pill} from '../../components/UI';
import {CategoryIcon} from '../../components/CategoryIcon';
import {makeId} from '../../lib/seed';
import {byKind} from '../../lib/selectors';
import type {AgendaStore} from '../../lib/useAgenda';
import type {AcademicYear,Category} from '../../lib/types';

type Props={store:AgendaStore};
export function SettingsPage({store}:Props){
  const {items,server,saveServer,user,cloudReady,status,syncError,save,remove}=store;
  const [url,setUrl]=useState(server.url);
  const [key,setKey]=useState(server.publishableKey);
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [authMode,setAuthMode]=useState<'login'|'register'>('login');
  const [authBusy,setAuthBusy]=useState(false);
  const [message,setMessage]=useState('');const [authError,setAuthError]=useState('');
  const [categoryDialog,setCategoryDialog]=useState<Category|true|null>(null);
  const [yearDialog,setYearDialog]=useState<AcademicYear|true|null>(null);
  const startAuth=async()=>{
    if(!email.trim()||password.length<6){setAuthError('Introduce un correo y una contraseña de al menos 6 caracteres.');return;}
    setAuthError('');setMessage('');setAuthBusy(true);
    try{const result=authMode==='login'?await store.signIn(email.trim(),password):await store.signUp(email.trim(),password);
      if(authMode==='login'&&result)setAuthError(result);
      else if(authMode==='register'&&result&&result!=='Sesión iniciada.')setMessage(result);
    }catch(e){setAuthError(e instanceof Error?e.message:String(e));}
    finally{setAuthBusy(false);setPassword('');}
  };
  return <div className="page-body settings-page"><div className="page-heading"><div><p className="eyebrow">PERSONALIZACIÓN Y DATOS</p><h1>Ajustes</h1><p>Controla la sincronización, los cursos y la apariencia.</p></div></div>
    <div className="settings-grid">
      <section className="panel setting-section wide-setting"><div className="setting-head"><div className="icon-bg"><Cloud size={20}/></div><div><h2>Sincronización con Supabase</h2><p>Accede a los mismos datos desde Debian y Windows.</p></div>
        <Pill color={user&&status==='synced'?'success':status==='error'?'danger':'slate'}>{user?status==='synced'?'Sincronizado':status==='error'?'Error':status==='saving'?'Guardando...':'Conectando...':'Modo local'}</Pill></div>
        <div className="setup-steps"><div><span>1</span> Crea un proyecto gratuito en Supabase.</div><div><span>2</span> Ejecuta el archivo SQL incluido en la carpeta <code>supabase/migrations</code>.</div>
          <div><span>3</span> Copia la URL del proyecto y la clave <code>publishable</code> o <code>anon</code> en estos campos.</div></div>
        <div className="form-stack">
          <FormField label="URL del proyecto Supabase"><input placeholder="https://xxxxxxxx.supabase.co" value={url} onChange={e=>setUrl(e.target.value)}/></FormField>
          <FormField label="Clave pública (publishable / anon)" hint="No introduzcas nunca la clave secret o service_role."><input type="password" autoComplete="off" placeholder="sb_publishable_..." value={key} onChange={e=>setKey(e.target.value)}/></FormField>
          <div className="connection-actions"><button className="btn btn-outline" onClick={()=>{saveServer({url:url.trim(),publishableKey:key.trim()});setMessage('Configuración guardada en este dispositivo.');}}><Save size={16}/>Guardar conexión</button>
            <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer" className="btn btn-ghost">Abrir Supabase <ExternalLink size={14}/></a></div>
          {message&&<Notice type="success">{message}</Notice>}
          {syncError&&<Notice type="error">{syncError}. Comprueba la conexión y que has ejecutado la migración SQL.</Notice>}
          {!cloudReady?<Notice>La agenda funciona en modo local. Cuando configures Supabase, podrás crear una cuenta para sincronizarla.</Notice>:user?<div className="account-row">
            <div className="account-avatar">{user.email?.slice(0,1).toUpperCase()||'U'}</div><div className="grow"><strong>{user.email}</strong><p>Cuenta conectada</p></div>
            <button className="btn btn-outline" onClick={()=>{void store.refresh();}}><RefreshCw size={15}/>Sincronizar</button><button className="btn btn-ghost" onClick={()=>{void store.signOut();}}><LogOut size={15}/>Salir</button>
          </div>:<div className="auth-area"><div className="segmented auth-tabs"><button className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setAuthError('');}}>Acceder</button>
            <button className={authMode==='register'?'active':''} onClick={()=>{setAuthMode('register');setAuthError('');}}>Crear cuenta</button></div>
            <div className="form-grid two"><FormField label="Correo electrónico"><input type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={e=>setEmail(e.target.value)}/></FormField>
              <FormField label="Contraseña"><input type="password" autoComplete={authMode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void startAuth();}}/></FormField></div>
            {authError&&<Notice type="error">{authError}</Notice>}
            <button disabled={authBusy} className="btn btn-primary" onClick={()=>{void startAuth();}}><LockKeyhole size={16}/>{authBusy?'Comprobando...':authMode==='login'?'Iniciar sesión':'Registrar cuenta'}</button>
          </div>}
          {user&&<div className="subtle-row"><ShieldCheck size={16}/><span>Las filas en Supabase están protegidas por políticas RLS específicas de tu usuario.</span></div>}
        </div>
      </section>
      <section className="panel setting-section"><div className="setting-head"><div className="icon-bg"><CalendarRange size={20}/></div><div><h2>Cursos académicos</h2><p>Organiza tus asignaturas por año.</p></div></div>
        <div className="config-list">{byKind(items,'year').map(y=><div className="config-item" key={y.id}><div className="grow"><strong>{y.name}</strong><p>{y.starts} → {y.ends}</p></div><button className="icon-button" aria-label={`Editar ${y.name}`} onClick={()=>setYearDialog(y)}><Palette size={17}/></button></div>)}</div>
        <button className="add-line" onClick={()=>setYearDialog(true)}><Plus size={16}/>Añadir curso académico</button>
      </section>
      <section className="panel setting-section"><div className="setting-head"><div className="icon-bg"><Palette size={20}/></div><div><h2>Categorías y colores</h2><p>Personaliza las etiquetas de eventos y tareas.</p></div></div>
        <div className="config-list">{byKind(items,'category').map(c=><div className="config-item" key={c.id}><span className="category-icon-chip" style={{background:`${c.color}22`}}><CategoryIcon category={c} size={18}/></span><div className="grow"><strong>{c.name}</strong><p>{c.color}</p></div><button className="icon-button" aria-label={`Editar ${c.name}`} onClick={()=>setCategoryDialog(c)}><Palette size={17}/></button></div>)}</div>
        <button className="add-line" onClick={()=>setCategoryDialog(true)}><Plus size={16}/>Añadir categoría</button>
      </section>
      <section className="panel setting-section wide-setting"><div className="setting-head"><div className="icon-bg"><Database size={20}/></div><div><h2>Información del almacenamiento</h2><p>Resumen de los datos de tu agenda.</p></div></div>
        <div className="data-stats"><div><strong>{byKind(items,'subject').length}</strong><span>Asignaturas</span></div><div><strong>{byKind(items,'event').length}</strong><span>Eventos y series</span></div>
          <div><strong>{byKind(items,'task').length}</strong><span>Tareas</span></div><div><strong>{byKind(items,'gradeItem').length}</strong><span>Pruebas</span></div></div>
        <div className="storage-note"><FolderOpen size={17}/>{user?'Los cambios se guardan en Supabase. En caso de errores de conexión, se reintentan mientras esta sesión de la aplicación siga abierta.':'Los cambios se guardan en este dispositivo. No se sincronizarán hasta iniciar sesión en Supabase.'}</div>
        {user&&<button className="btn btn-outline" onClick={async()=>{if(window.confirm('¿Importar también los datos locales de este dispositivo? Las entradas con el mismo identificador se sobrescribirán.')){const result=await store.importLocal();setMessage(result||'Datos locales importados.');}}}><Cloud size={16}/>Importar datos locales a la nube</button>}
      </section>
    </div>
    {categoryDialog&&<CategoryDialog initial={categoryDialog===true?undefined:categoryDialog}
      onSave={c=>{save(c);setCategoryDialog(null);}} onDelete={id=>{remove(id);setCategoryDialog(null);}} onClose={()=>setCategoryDialog(null)}/>}
    {yearDialog&&<YearDialog initial={yearDialog===true?undefined:yearDialog} protectedIds={byKind(items,'subject').map(s=>s.yearId)}
      onSave={y=>{save(y);setYearDialog(null);}} onDelete={id=>{remove(id);setYearDialog(null);}} onClose={()=>setYearDialog(null)}/>}
  </div>;
}
function CategoryDialog({initial,onSave,onDelete,onClose}:{initial?:Category;onSave:(v:Category)=>void;onDelete:(id:string)=>void;onClose:()=>void}){
  const [name,setName]=useState(initial?.name??'');const [color,setColor]=useState(initial?.color??'#7a8bf5');const [icon,setIcon]=useState(initial?.icon??'tag');const [error,setError]=useState('');
  return <Modal title={initial?'Editar categoría':'Nueva categoría'} onClose={onClose}><div className="form-stack">
    <FormField label="Nombre"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ej.: Laboratorios"/></FormField>
    <FormField label="Color"><div className="color-line"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color}</code></div></FormField>
    <FormField label="Icono"><select value={icon} onChange={e=>setIcon(e.target.value)}>{['tag','book-open','file-check','graduation-cap','calendar','brain','folder','star','clock'].map(k=><option value={k} key={k}>{k}</option>)}</select></FormField>
    {error&&<Notice type="error">{error}</Notice>}<div className="dialog-actions">{initial&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar la categoría?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
      <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={()=>{if(!name.trim()){setError('Introduce un nombre.');return;}onSave({id:initial?.id??makeId(),kind:'category',name:name.trim(),color,icon});}}><Save size={16}/>Guardar</button></div>
  </div></Modal>;
}
function YearDialog({initial,protectedIds,onSave,onDelete,onClose}:{initial?:AcademicYear;protectedIds:string[];onSave:(v:AcademicYear)=>void;onDelete:(id:string)=>void;onClose:()=>void}){
  const [name,setName]=useState(initial?.name??'2027/2028');const [starts,setStarts]=useState(initial?.starts??'2027-09-01');
  const [ends,setEnds]=useState(initial?.ends??'2028-08-31');const [error,setError]=useState('');
  return <Modal title={initial?'Editar curso':'Nuevo curso académico'} onClose={onClose}><div className="form-stack">
    <FormField label="Nombre"><input value={name} onChange={e=>setName(e.target.value)} placeholder="2027/2028"/></FormField>
    <div className="form-grid two"><FormField label="Fecha de inicio"><input type="date" min="2026-01-01" max="2030-12-31" value={starts} onChange={e=>setStarts(e.target.value)}/></FormField>
      <FormField label="Fecha de fin"><input type="date" min="2026-01-01" max="2030-12-31" value={ends} onChange={e=>setEnds(e.target.value)}/></FormField></div>
    {error&&<Notice type="error">{error}</Notice>}<div className="dialog-actions">{initial&&!protectedIds.includes(initial.id)&&<button className="btn btn-danger-ghost" onClick={()=>{if(window.confirm('¿Eliminar este curso vacío?'))onDelete(initial.id);}}><Trash2 size={16}/>Eliminar</button>}
      <span className="flex-spacer"/><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={()=>{
        if(!name.trim()||starts>'2030-12-31'||starts<'2026-01-01'||ends>'2030-12-31'||ends<starts){setError('Revisa el nombre y las fechas (2026–2030).');return;}
        onSave({id:initial?.id??makeId(),kind:'year',name:name.trim(),starts,ends});
      }}><Save size={16}/>Guardar</button></div>
  </div></Modal>;
}
