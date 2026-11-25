import {Brain,BookOpen,CalendarDays,Clock3,FileCheck,Folder,GraduationCap,Star,Tag} from 'lucide-react';
import type {Category} from '../lib/types';
export function CategoryIcon({category,size=16}:{category?:Category;size?:number}){
  const icons={tag:Tag,'book-open':BookOpen,'file-check':FileCheck,'graduation-cap':GraduationCap,
    calendar:CalendarDays,brain:Brain,folder:Folder,star:Star,clock:Clock3};
  const Icon=icons[(category?.icon??'tag') as keyof typeof icons]??Tag;
  return <Icon size={size} style={{color:category?.color}}/>;
}
