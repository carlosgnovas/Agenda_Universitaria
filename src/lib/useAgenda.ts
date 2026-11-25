import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createInitialData } from './seed';
import type { Entity, ServerConfig, SyncStatus } from './types';

const DATA_KEY='agenda-universitaria-local-v1';
const SERVER_KEY='agenda-universitaria-server-v1';
const PENDING_PREFIX='agenda-universitaria-unsent-';
const CLOUD_CACHE_PREFIX='agenda-universitaria-cloud-cache-';
function readJSON<T>(key:string,fallback:T):T { try {const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback;}catch{return fallback;} }
function readLocal():Entity[] {
  const saved=readJSON<Entity[]|null>(DATA_KEY,null);
  if (saved !== null && Array.isArray(saved))return saved;
  const initial=createInitialData();localStorage.setItem(DATA_KEY,JSON.stringify(initial));return initial;
}
function persistPending(uid:string,entries:Map<string,Entity|null>){localStorage.setItem(PENDING_PREFIX+uid,JSON.stringify([...entries.entries()]));}
function validConfig(c:ServerConfig) { return /^https:\/\/[a-z0-9.-]+\/?$/i.test(c.url.trim()) && c.publishableKey.trim().length>20; }
type RemoteRow = { id:string; kind:Entity['kind']; payload:Entity; updated_at:string; user_id?:string };

export function useAgenda(){
  const [items,setItems]=useState<Entity[]>(readLocal);
  const [config,setConfig]=useState<ServerConfig>(()=>readJSON(SERVER_KEY,{url:'',publishableKey:''}));
  const [user,setUser]=useState<User|null>(null);
  const [sessionLoading,setSessionLoading]=useState(false);
  const [status,setStatus]=useState<SyncStatus>('local');
  const [syncError,setSyncError]=useState('');
  const pending=useRef<Map<string,Entity|null>>(new Map());
  const loadingCloud=useRef(false);
  const uploading=useRef(false);
  const loggedIn=!!user;
  const cloudEnabled=!!user && validConfig(config);
  const client=useMemo<SupabaseClient|null>(()=>{
    if(!validConfig(config))return null;
    try{return createClient(config.url.trim().replace(/\/$/,''),config.publishableKey.trim(),{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'agenda-universitaria-auth-v1'}
    });}catch{return null;}
  },[config.url,config.publishableKey]);
  useEffect(()=>{
    if(!client){setUser(null);setStatus('local');return;}
    let alive=true;setSessionLoading(true);
    client.auth.getUser().then(async({data,error})=>{
      const session=error?await client.auth.getSession().catch(()=>({data:{session:null}})):null;
      if(alive){setUser(data.user??session?.data.session?.user??null);setSessionLoading(false);}
    }).catch(()=>{if(alive){setUser(null);setSessionLoading(false);}});
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
      if(alive)setUser(session?.user??null);
    });
    return ()=>{alive=false;subscription.unsubscribe();};
  },[client]);
  useEffect(()=>{if(!cloudEnabled){localStorage.setItem(DATA_KEY,JSON.stringify(items));}},[items,cloudEnabled]);

  const remoteRows=useCallback(async(cl:SupabaseClient,uid:string):Promise<RemoteRow[]>=>{
    const {data,error}=await cl.from('agenda_entries').select('id,kind,payload,updated_at').eq('user_id',uid).limit(10000);
    if(error)throw error;
    return (data??[]) as RemoteRow[];
  },[]);
  const refresh=useCallback(async()=>{
    if(!client||!user||loadingCloud.current)return;
    loadingCloud.current=true;
    try{
      const rows=await remoteRows(client,user.id);
      const remote=rows.map(row=>({...row.payload,id:row.id,kind:row.kind}) as Entity);
      const edited=new Map(pending.current);
      for(const [id,payload] of edited){
        const index=remote.findIndex(i=>i.id===id);
        if(index>=0)remote.splice(index,1);
        if(payload)remote.push(payload);
      }
      setItems(remote);
      localStorage.setItem(CLOUD_CACHE_PREFIX+user.id,JSON.stringify(remote));
      if(!pending.current.size){setStatus('synced');setSyncError('');}
    }catch(e){setStatus('error');setSyncError(errorMessage(e));}
    finally{loadingCloud.current=false;}
  },[client,user,remoteRows]);

  useEffect(()=>{
    if(!client||!user){setStatus('local');return;}
    let active=true;
    pending.current=new Map(readJSON<[string,Entity|null][]>(PENDING_PREFIX+user.id,[]));
    const cached=readJSON<Entity[]>(CLOUD_CACHE_PREFIX+user.id,[]);
    if(cached.length){const snapshot=[...cached];for(const [id,entry] of pending.current){const idx=snapshot.findIndex(e=>e.id===id);if(idx>=0)snapshot.splice(idx,1);if(entry)snapshot.push(entry);}setItems(snapshot);}
    const init=async()=>{
      setStatus('loading');
      try{
        let rows=await remoteRows(client,user.id);
        if(!active)return;
        // Una nube vacía recibe las asignaturas iniciales que ya tiene el usuario localmente.
        if(rows.length===0){
          const local=readLocal();
          if(local.length){
            const {error}=await client.from('agenda_entries').upsert(local.map(entity=>({user_id:user.id,id:entity.id,kind:entity.kind,payload:entity})),{onConflict:'user_id,id'});
            if(error)throw error;
            rows=await remoteRows(client,user.id);
          }
        }
        if(!active)return;
        const remote=rows.map(row=>({...row.payload,id:row.id,kind:row.kind}) as Entity);
        for(const [id,entry] of pending.current){const index=remote.findIndex(e=>e.id===id);if(index>=0)remote.splice(index,1);if(entry)remote.push(entry);}
        setItems(remote);localStorage.setItem(CLOUD_CACHE_PREFIX+user.id,JSON.stringify(remote));
        setStatus('synced');setSyncError('');if(pending.current.size)void flush();
      }catch(e){if(active){setStatus('error');setSyncError(errorMessage(e));}}
    };
    void init();
    const interval=setInterval(()=>{if(active)void refresh();},30000);
    const onFocus=()=>{if(active)void refresh();};
    window.addEventListener('focus',onFocus);
    // La consulta periódica funciona incluso sin habilitar Supabase Realtime.
    return ()=>{active=false;clearInterval(interval);window.removeEventListener('focus',onFocus);};
  },[client,user?.id,remoteRows,refresh]);

  const flush=useCallback(async()=>{
    if(!client||!user||uploading.current||!pending.current.size)return;
    uploading.current=true;setStatus('saving');
    try{
      for(const [id,entity] of Array.from(pending.current.entries())){
        if(entity){
          const {error}=await client.from('agenda_entries').upsert({user_id:user.id,id:entity.id,kind:entity.kind,payload:entity,updated_at:new Date().toISOString()},{onConflict:'user_id,id'});
          if(error)throw error;
        }else{
          const {error}=await client.from('agenda_entries').delete().eq('user_id',user.id).eq('id',id);
          if(error)throw error;
        }
        if(pending.current.get(id)===entity)pending.current.delete(id);
        persistPending(user.id,pending.current);
      }
      setStatus('synced');setSyncError('');
    }catch(e){setStatus('error');setSyncError(errorMessage(e));}
    finally{uploading.current=false;}
  },[client,user]);
  useEffect(()=>{
    if(!cloudEnabled)return;
    const timer=setInterval(()=>{if(pending.current.size)void flush();},6000);
    return ()=>clearInterval(timer);
  },[cloudEnabled,flush]);

  const save=useCallback((entity:Entity)=>{
    setItems(prev=>{const idx=prev.findIndex(item=>item.id===entity.id);if(idx<0)return [...prev,entity];
      const next=[...prev];next[idx]=entity;return next;});
    if(cloudEnabled&&user){pending.current.set(entity.id,entity);persistPending(user.id,pending.current);queueMicrotask(()=>{void flush();});}
  },[cloudEnabled,flush,user]);
  const remove=useCallback((id:string)=>{
    setItems(prev=>prev.filter(e=>e.id!==id));
    if(cloudEnabled&&user){pending.current.set(id,null);persistPending(user.id,pending.current);queueMicrotask(()=>{void flush();});}
  },[cloudEnabled,flush,user]);
  const saveMany=useCallback((entities:Entity[])=>{
    setItems(prev=>{
      const byId=new Map(prev.map(e=>[e.id,e]));entities.forEach(e=>byId.set(e.id,e));return [...byId.values()];
    });
    if(cloudEnabled&&user){entities.forEach(e=>pending.current.set(e.id,e));persistPending(user.id,pending.current);queueMicrotask(()=>{void flush();});}
  },[cloudEnabled,flush,user]);
  const removeMany=useCallback((ids:string[])=>{
    const idSet=new Set(ids);setItems(prev=>prev.filter(e=>!idSet.has(e.id)));
    if(cloudEnabled&&user){ids.forEach(id=>pending.current.set(id,null));persistPending(user.id,pending.current);queueMicrotask(()=>{void flush();});}
  },[cloudEnabled,flush,user]);
  const saveServer=useCallback((next:ServerConfig)=>{
    setConfig(next);localStorage.setItem(SERVER_KEY,JSON.stringify(next));
    pending.current.clear();setUser(null);setSyncError('');setStatus('local');
  },[]);
  const signIn=async(email:string,password:string)=>{
    if(!client)return 'Configura primero la URL y la clave pública.';
    const {error}=await client.auth.signInWithPassword({email,password});return error?.message??'';
  };
  const signUp=async(email:string,password:string)=>{
    if(!client)return 'Configura primero la URL y la clave pública.';
    const {data,error}=await client.auth.signUp({email,password});
    if(error)return error.message;
    return data.session?'Sesión iniciada.':'Cuenta creada. Revisa tu correo si está activada la confirmación.';
  };
  const signOut=async()=>{
    if(client)await client.auth.signOut();
    pending.current.clear();setUser(null);setItems(readLocal());setStatus('local');
  };
  const importLocal=async()=>{
    if(!client||!user)return 'Inicia sesión antes de importar.';
    const local=readLocal();
    if(!local.length)return 'No hay datos locales.';
    const {error}=await client.from('agenda_entries').upsert(local.map(e=>({user_id:user.id,id:e.id,kind:e.kind,payload:e})),{onConflict:'user_id,id'});
    if(error)return error.message;
    await refresh();return '';
  };
  return {items,save,saveMany,remove,removeMany,server:config,saveServer,cloudReady:!!client,
    user,loggedIn,cloudEnabled,status,syncError,sessionLoading,signIn,signUp,signOut,refresh,flush,importLocal};
}
function errorMessage(e:unknown):string{return e instanceof Error?e.message:String(e);}
export type AgendaStore=ReturnType<typeof useAgenda>;
