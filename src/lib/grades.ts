import type { GradeGroup, GradeItem } from './types';

export interface GradeSummary {
  achieved: number; // Contribución de exámenes ya realizados sobre 10
  maxPossible: number; // Máximo alcanzable si los pendientes son 10
  totalWeight: number;
  pendingCount: number;
  allGraded: boolean;
  passed: boolean;
  blocking: string[];
  equalNeeded: number | null; // Nota común mínima en pruebas pendientes, respetando mínimos
  weightWarnings: string[];
}

const EPS=1e-7;
export const roundUpHundredth = (n:number) => Math.ceil((n-EPS)*100)/100;
export const formatGrade = (n:number) => Number.isFinite(n) ? n.toLocaleString('es-ES',{minimumFractionDigits:0, maximumFractionDigits:2}) : '—';

export function weightedAverage(items: GradeItem[], substitute?: (item:GradeItem)=>number): number | null {
  if (!items.length) return null;
  const denom = items.reduce((s,item)=>s+item.weight,0);
  if (denom <= 0) return null;
  if (items.some(item=>item.score===null && !substitute)) return null;
  return items.reduce((s,item)=>s+(item.score ?? substitute?.(item) ?? 0)*item.weight,0)/denom;
}

export function computeGrades(groups:GradeGroup[], items:GradeItem[], target=5):GradeSummary {
  const totalWeight = groups.reduce((s,g)=>s+g.weight,0);
  const allGraded = items.length>0 && items.every(i=>i.score!==null) && groups.length>0 && groups.every(g=>items.some(i=>i.groupId===g.id));
  const pendingCount = items.filter(i=>i.score===null).length;
  const warnings:string[]=[];
  if (Math.abs(totalWeight-100)>.011) warnings.push(`Los bloques suman ${formatGrade(totalWeight)}%, deben sumar 100%.`);
  for (const g of groups) {
    const part=items.filter(i=>i.groupId===g.id);
    const sum=part.reduce((a,i)=>a+i.weight,0);
    if (!part.length) warnings.push(`El bloque «${g.name}» no tiene pruebas.`);
    else if (Math.abs(sum-100)>.011) warnings.push(`Las pruebas de «${g.name}» suman ${formatGrade(sum)}%, deben sumar 100%.`);
  }
  const full = (resolve:(i:GradeItem)=>number) => groups.reduce((total,g)=>{
    const part=items.filter(i=>i.groupId===g.id);
    return total+(weightedAverage(part,resolve)??0)*g.weight/100;
  },0);
  const achieved=full(()=>0);
  const maxPossible=full(()=>10);
  const blocking:string[]=[];
  const constraints=(resolve:(i:GradeItem)=>number) => {
    const problems:string[]=[];
    for (const g of groups) {
      const part=items.filter(i=>i.groupId===g.id);
      const avg=weightedAverage(part,resolve);
      if (avg!==null && g.minimum!==null && avg+EPS<g.minimum) problems.push(`Bloque «${g.name}»: mínimo ${formatGrade(g.minimum)}/10`);
      for (const item of part) {
        const score=item.score??resolve(item);
        if (item.minimum!==null && score+EPS<item.minimum) problems.push(`«${item.name}»: mínimo ${formatGrade(item.minimum)}/10`);
      }
    }
    return problems;
  };
  if (allGraded) blocking.push(...constraints(()=>0));
  const passed=allGraded && !warnings.length && !blocking.length && achieved+EPS>=target;
  let equalNeeded:number|null=null;
  if (pendingCount>0 && warnings.length===0 && groups.length) {
    const feasible=(value:number)=> {
      const resolve=(i:GradeItem)=>Math.max(value,i.minimum??0);
      return full(resolve)+EPS>=target && constraints(resolve).length===0;
    };
    if (feasible(10)) {
      let lo=Math.max(0,...items.filter(i=>i.score===null).map(i=>i.minimum??0)),hi=10;
      for(let i=0;i<45;i++){const mid=(lo+hi)/2; if(feasible(mid)) hi=mid;else lo=mid;}
      equalNeeded=roundUpHundredth(hi);
    }
  }
  return { achieved,maxPossible,totalWeight,pendingCount,allGraded,passed,blocking,equalNeeded,weightWarnings:warnings };
}
