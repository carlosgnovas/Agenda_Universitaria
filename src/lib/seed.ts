import type { Entity, Subject, GradeGroup } from './types';

export function makeId() { return crypto.randomUUID(); }

export function createInitialData(): Entity[] {
  const year = { id: makeId(), kind:'year' as const, name:'2026/2027', starts:'2026-09-01', ends:'2027-08-31' };
  const categories = [
    { id:makeId(), kind:'category' as const, name:'Exámenes', color:'#fb7185', icon:'book-open-check' },
    { id:makeId(), kind:'category' as const, name:'Entregas', color:'#f6b74d', icon:'file-check' },
    { id:makeId(), kind:'category' as const, name:'Clases', color:'#7aa6ff', icon:'school' },
    { id:makeId(), kind:'category' as const, name:'Estudio', color:'#ab8fff', icon:'brain' }
  ];
  const names = [
    ['AEDII','Algoritmos y Estructuras de Datos II','#8b92f9','Programación'],
    ['ACII','Arquitectura de Computadoras II','#e5a76c','Computadores'],
    ['EST','Estadística','#63cbb4','Matemáticas'],
    ['LC','Lógica Computacional','#dc86c4','Computación'],
    ['SD','Sistemas Digitales','#76aaf0','Computadores']
  ];
  const subjects: Subject[] = names.map(([abbreviation,name,color,folder]) => ({
    id:makeId(), kind:'subject', yearId:year.id, name, abbreviation, color, folder, description:'', target:5
  }));
  const [aed,ac,est,lc,sd] = subjects;
  const groups: GradeGroup[] = [
    {id:makeId(),kind:'gradeGroup',subjectId:aed.id,name:'Evaluación continua',weight:100,minimum:null},
    {id:makeId(),kind:'gradeGroup',subjectId:ac.id,name:'Teoría',weight:60,minimum:4},
    {id:makeId(),kind:'gradeGroup',subjectId:ac.id,name:'Prácticas',weight:40,minimum:4},
    {id:makeId(),kind:'gradeGroup',subjectId:est.id,name:'Parciales',weight:100,minimum:null},
    {id:makeId(),kind:'gradeGroup',subjectId:lc.id,name:'Teoría',weight:60,minimum:5},
    {id:makeId(),kind:'gradeGroup',subjectId:lc.id,name:'Prácticas',weight:40,minimum:null},
    {id:makeId(),kind:'gradeGroup',subjectId:sd.id,name:'Evaluación global',weight:100,minimum:null}
  ];
  const [ga,gt,gp,ge,glt,glp,gs] = groups;
  const item=(groupId:string,name:string,weight:number,score:number|null=null,minimum:number|null=null,mandatory=false): Entity => ({
    id:makeId(),kind:'gradeItem',groupId,name,weight,score,minimum,mandatory
  });
  const items: Entity[] = [
    item(ga.id,'1.º examen',35,6.5), item(ga.id,'2.º examen',30,2.5),item(ga.id,'3.º examen',35),
    item(gt.id,'1.º teórico',50,null,4),item(gt.id,'2.º teórico',50,null,4),
    item(gp.id,'1.º práctico',50,9,4),item(gp.id,'2.º práctico',50,null,4),
    item(ge.id,'1.º parcial',30,8.75,3.5),item(ge.id,'2.º parcial',30,null,3.5),item(ge.id,'3.º parcial',40,null,3.5),
    item(glt.id,'1.º teórico',100*25/60),item(glt.id,'2.º teórico',100*35/60),
    item(glp.id,'1.ª práctica',100/3,10,null,true),item(glp.id,'2.ª práctica',100/3,null,null,true),item(glp.id,'3.ª práctica',100/3,null,null,true),
    item(gs.id,'Examen global de enero',100)
  ];
  return [year, ...categories, ...subjects, ...groups, ...items];
}
