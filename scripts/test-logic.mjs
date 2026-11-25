// Tests de lógica pura sin instalar bibliotecas: usa el compilador TypeScript si existe.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript');}
catch{try{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}
catch{throw new Error('Necesitas instalar las dependencias: npm install');}}
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const dir=join(tmpdir(),'agenda-universitaria-tests');mkdirSync(dir,{recursive:true});
for (const name of ['grades','dates','recurrence','seed']){
  const source=readFileSync(`src/lib/${name}.ts`,'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"]\.\/(dates|grades|recurrence|types|seed)['"]/g,(_m,n)=>`from './${n}.mjs'`);
  writeFileSync(join(dir,`${name}.mjs`),compiled);
}
const {computeGrades}=await import(pathToFileURL(join(dir,'grades.mjs')));
const {expandEvents}=await import(pathToFileURL(join(dir,'recurrence.mjs')));
const {createInitialData}=await import(pathToFileURL(join(dir,'seed.mjs')));
const all=createInitialData();
const sub=abbr=>all.find(e=>e.kind==='subject'&&e.abbreviation===abbr);
function summary(abbr){const gs=all.filter(e=>e.kind==='gradeGroup'&&e.subjectId===sub(abbr).id);
  const items=all.filter(e=>e.kind==='gradeItem'&&gs.some(g=>g.id===e.groupId));
  return computeGrades(gs,items,5);
}
assert.equal(summary('AEDII').equalNeeded,5.65,'AEDII debe requerir un 5,65 en tercer examen');
assert.equal(summary('EST').equalNeeded,3.5,'Estadística debe exigir un mínimo individual de 3,5');
assert.equal(summary('ACII').equalNeeded,4,'ACII puede aprobar con 4 en todas las pruebas pendientes');
const ed=all.find(e=>e.kind==='gradeItem'&&e.name==='3.º examen');
assert.equal(computeGrades(all.filter(e=>e.kind==='gradeGroup'&&e.subjectId===sub('AEDII').id),all.filter(e=>e.kind==='gradeItem'&&e.groupId===ed.groupId).map(e=>e.id===ed.id?{...e,score:5.65}:e),5).passed,true,'AEDII aprueba con 5,65');
const year='2026-11-23T09:00';
const template={id:'a',kind:'event',title:'Clase',description:'',eventKind:'class',start:year,end:'2026-11-23T10:00',allDay:false,subjectId:null,categoryId:null,
 frequency:'weekly',interval:1,weekDays:[1,3],until:'2026-12-31',exceptions:[{date:'2026-11-25',cancelled:true}]};
const occ=expandEvents(template,'2026-11-23','2026-12-04');
assert.deepEqual(occ.map(e=>e.date),['2026-11-23','2026-11-30','2026-12-02'],'recurrencias semanales y excepciones');
const single={...template,frequency:'none',exceptions:[]};
assert.equal(expandEvents(single,'2026-11-01','2026-12-01').length,1);
const moved={...template,exceptions:[{date:'2026-11-25',start:'2026-12-12T09:00',end:'2026-12-12T10:00'}]};
assert.equal(expandEvents(moved,'2026-12-10','2026-12-15').some(o=>o.start.startsWith('2026-12-12')),true,'Una ocurrencia movida desde otro mes se muestra');
console.log('✅ 7 comprobaciones de lógica superadas.');
