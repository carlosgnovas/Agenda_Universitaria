import {useEffect,useMemo,useState} from 'react';
import {BookOpen,Plus,Settings2,Pencil,GraduationCap,Target,AlertTriangle,Layers3} from 'lucide-react';
import {Empty,Notice,Pill} from '../../components/UI';
import {byKind} from '../../lib/selectors';
import {computeGrades,formatGrade,weightedAverage} from '../../lib/grades';
import type {AgendaStore} from '../../lib/useAgenda';
import type {GradeGroup,GradeItem,Subject} from '../../lib/types';
import {SubjectDialog} from './SubjectDialog';
import {GradeGroupDialog,GradeItemDialog} from '../grades/GradeDialogs';

type Props={store:AgendaStore;yearId:string;focusSubjectId?:string|null;onSubjectFocused?:()=>void};
export function SubjectsPage({store,yearId,focusSubjectId,onSubjectFocused}:Props){
  const {items,save,removeMany}=store;
  const subjects=byKind(items,'subject').filter(s=>!yearId||s.yearId===yearId);
  const groups=byKind(items,'gradeGroup'),grades=byKind(items,'gradeItem');
  const [selected,setSelected]=useState('');
  const [subjectDialog,setSubjectDialog]=useState<Subject|true|null>(null);
  const [groupDialog,setGroupDialog]=useState<GradeGroup|true|null>(null);
  const [itemDialog,setItemDialog]=useState<{initial?:GradeItem;groupId:string}|null>(null);
  useEffect(()=>{if(focusSubjectId){setSelected(focusSubjectId);onSubjectFocused?.();}},[focusSubjectId,onSubjectFocused]);
  useEffect(()=>{if(subjects.length&&!subjects.some(s=>s.id===selected))setSelected(subjects[0].id);else if(!subjects.length&&selected)setSelected('');},[subjects,selected]);
  const subject=subjects.find(s=>s.id===selected);
  const subjectGroups=groups.filter(g=>g.subjectId===subject?.id);
  const subjectGrades=grades.filter(g=>subjectGroups.some(gr=>gr.id===g.groupId));
  const summary=useMemo(()=>subject?computeGrades(subjectGroups,subjectGrades,subject.target):null,[subject,items]);
  const deleteSubject=(id:string)=>{
    const groupIds=groups.filter(g=>g.subjectId===id).map(g=>g.id);
    const deleteIds=[id,...groupIds,...grades.filter(g=>groupIds.includes(g.groupId)).map(g=>g.id)];
    // Los eventos y tareas no se eliminan: se desvinculan para preservar información.
    const related=[...byKind(items,'event').filter(e=>e.subjectId===id).map(e=>({...e,subjectId:null as null})),
      ...byKind(items,'task').filter(t=>t.subjectId===id).map(t=>({...t,subjectId:null as null}))];
    related.forEach(e=>store.save(e));removeMany(deleteIds);setSubjectDialog(null);
  };
  const deleteGroup=(id:string)=>{removeMany([id,...grades.filter(g=>g.groupId===id).map(g=>g.id)]);setGroupDialog(null);};
  return <div className="page-body">
    <div className="page-heading"><div><p className="eyebrow">SEGUIMIENTO ACADÉMICO</p><h1>Asignaturas</h1><p>Organiza bloques, ponderaciones y notas para calcular tu progreso.</p></div>
      <button className="btn btn-primary" onClick={()=>setSubjectDialog(true)}><Plus size={17}/>Nueva asignatura</button></div>
    <div className="subjects-layout">
      <aside className="panel subjects-list"><div className="panel-head compact"><h3>Mis asignaturas</h3><span className="count-tag">{subjects.length}</span></div>
        {[...new Set(subjects.map(s=>s.folder||'Otras asignaturas'))].sort((a,b)=>a.localeCompare(b,'es')).map(folder=><div key={folder}>
          <div className="subject-folder-label">{folder}</div>
          {subjects.filter(s=>(s.folder||'Otras asignaturas')===folder).map(s=>{
            const gs=groups.filter(g=>g.subjectId===s.id);const is=grades.filter(g=>gs.some(x=>x.id===g.groupId));
            const computed=computeGrades(gs,is,s.target);
            return <button className={`subject-list-item ${selected===s.id?'selected':''}`} key={s.id} onClick={()=>setSelected(s.id)}>
              <span className="subject-symbol" style={{background:`${s.color}20`,color:s.color}}>{s.abbreviation.slice(0,2)}</span>
              <span className="subject-list-text"><strong>{s.abbreviation}</strong><small>{s.name}</small></span>
              {computed.allGraded&&<span className="subject-mini-grade">{formatGrade(computed.achieved)}</span>}
            </button>;
          })}
        </div>)}
        {!subjects.length&&<div className="sidebar-empty">Todavía no hay asignaturas para este curso.</div>}
        <button className="add-line" onClick={()=>setSubjectDialog(true)}><Plus size={16}/>Añadir asignatura</button>
      </aside>
      <main className="subject-main">
        {!subject?<div className="panel"><Empty icon={<BookOpen/>} title="Selecciona una asignatura" message="Añade o selecciona una asignatura para configurar su evaluación."/></div>:<>
          <div className="panel subject-overview" style={{borderTop:`3px solid ${subject.color}`}}>
            <div className="subject-detail-heading"><div className="subject-heading-inner">
              <span className="subject-big-symbol" style={{background:`${subject.color}22`,color:subject.color}}>{subject.abbreviation.slice(0,3)}</span>
              <div><p className="eyebrow">{subject.folder||'ASIGNATURA'}</p><h2>{subject.name}</h2><p>Objetivo: {formatGrade(subject.target)} sobre 10</p></div>
            </div><button className="btn btn-outline" onClick={()=>setSubjectDialog(subject)}><Settings2 size={16}/>Editar</button></div>
            {summary&&<div className="grade-kpis">
              <div className="grade-kpi"><span>Nota acumulada</span><strong>{formatGrade(summary.achieved)}<small> / 10</small></strong><p>Sobre las pruebas calificadas</p></div>
              <div className="grade-kpi"><span>Notas pendientes</span><strong>{summary.pendingCount}</strong><p>Pruebas sin calificar</p></div>
              <div className="grade-kpi highlight"><span>{summary.allGraded?'Resultado final':'Objetivo en pendientes'}</span>
                <strong>{summary.allGraded?(summary.passed?'Aprobado':'No aprobado'):(summary.equalNeeded!==null?formatGrade(summary.equalNeeded):'No viable')}</strong>
                <p>{summary.allGraded?'Según requisitos configurados':'Misma nota en todas, respetando mínimos'}</p></div>
            </div>}
            {summary&&summary.weightWarnings.map(w=><Notice key={w} type="error">{w}</Notice>)}
            {summary&&summary.blocking.map(w=><Notice key={w} type="error">No se cumple: {w}</Notice>)}
            {summary&&!summary.allGraded&&summary.equalNeeded!==null&&<div className="info-inline"><Target size={17}/>Si sacas al menos <strong>{formatGrade(summary.equalNeeded)}</strong> en cada prueba pendiente (o su mínimo obligatorio, si es mayor), alcanzarás el objetivo configurado.</div>}
          </div>
          <div className="section-title-row"><div><h2>Evaluación</h2><p>Configura primero los bloques, luego las pruebas de cada bloque.</p></div>
            <button className="btn btn-outline" onClick={()=>setGroupDialog(true)}><Plus size={16}/>Añadir bloque</button></div>
          {subjectGroups.map(group=>{
            const localItems=grades.filter(i=>i.groupId===group.id);
            const score=weightedAverage(localItems);
            return <section className="panel grade-group" key={group.id}>
              <div className="grade-group-head"><div className="group-icon"><Layers3 size={18}/></div><div className="grow"><h3>{group.name}</h3><p>{formatGrade(group.weight)}% de la nota final {group.minimum!==null?`· Mínimo ${formatGrade(group.minimum)}/10`:''}</p></div>
                {score!==null&&<Pill color={score>=(group.minimum??0)?'success':'danger'}>{formatGrade(score)}/10</Pill>}
                <button className="icon-button" aria-label={`Editar ${group.name}`} onClick={()=>setGroupDialog(group)}><Pencil size={17}/></button></div>
              <div className="grade-table-wrap"><table className="grade-table"><thead><tr><th>Prueba</th><th>Peso</th><th>Mínimo</th><th>Nota</th><th></th></tr></thead><tbody>
                {localItems.map(item=><tr key={item.id}><td><strong>{item.name}</strong>{item.mandatory&&<small className="mandatory-label">Obligatoria</small>}</td>
                  <td>{formatGrade(item.weight)}%</td><td>{item.minimum===null?'—':formatGrade(item.minimum)}</td>
                  <td><input aria-label={`Nota de ${item.name}`} className="grade-number" type="number" min="0" max="10" step="0.01" placeholder="—" key={`${item.id}:${item.score??'na'}`}
                    defaultValue={item.score??''} onBlur={e=>{const v=e.target.value.trim();const next=v===''?null:Number(v);if(next!==null&&(next<0||next>10||!Number.isFinite(next))){e.target.value=item.score?.toString()??'';return;}if(next!==item.score)save({...item,score:next});}}
                    onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></td>
                  <td><button className="icon-button tiny" aria-label={`Editar prueba ${item.name}`} onClick={()=>setItemDialog({initial:item,groupId:group.id})}><Pencil size={15}/></button></td></tr>)}
                {!localItems.length&&<tr><td colSpan={5} className="empty-row">Añade pruebas para calcular este bloque.</td></tr>}
              </tbody></table></div>
              <button className="add-line" onClick={()=>setItemDialog({groupId:group.id})}><Plus size={16}/>Añadir prueba</button>
            </section>;
          })}
          {!subjectGroups.length&&<div className="panel"><Empty icon={<GraduationCap/>} title="Sin bloques de evaluación" message="Crea un bloque, por ejemplo Teoría (60%) o Prácticas (40%)." action={<button className="btn btn-primary" onClick={()=>setGroupDialog(true)}><Plus size={16}/>Nuevo bloque</button>}/></div>}
          <div className="grade-footnote"><AlertTriangle size={15}/>Los mínimos y condiciones deben coincidir con la guía docente. Este cálculo no sustituye los criterios oficiales ni contempla recuperaciones automáticamente.</div>
        </>}
      </main>
    </div>
    {subjectDialog&&<SubjectDialog items={items} yearId={yearId} initial={subjectDialog===true?undefined:subjectDialog}
      onSave={s=>{save(s);setSelected(s.id);setSubjectDialog(null);}} onDelete={deleteSubject} onClose={()=>setSubjectDialog(null)}/>}
    {groupDialog&&subject&&<GradeGroupDialog subjectId={subject.id} initial={groupDialog===true?undefined:groupDialog}
      onSave={g=>{save(g);setGroupDialog(null);}} onDelete={deleteGroup} onClose={()=>setGroupDialog(null)}/>}
    {itemDialog&&<GradeItemDialog groupId={itemDialog.groupId} initial={itemDialog.initial}
      onSave={i=>{save(i);setItemDialog(null);}} onDelete={id=>{store.remove(id);setItemDialog(null);}} onClose={()=>setItemDialog(null)}/>}
  </div>;
}
