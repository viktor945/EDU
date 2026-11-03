'use client';
import {useEffect,useRef,useState} from 'react';
import {Settings2,X} from 'lucide-react';
import {useLanguage} from '../language-context';
import {et} from '../experience-text';
export function StudentSectionPicker({options,selected,labels,onChange}:{options:string[];selected:string[];labels:Record<string,string>;onChange:(v:string[])=>void}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null);const {language}=useLanguage();
 useEffect(()=>{if(!open)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 return <div className="student-section-picker" ref={root}><button type="button" className="student-settings-trigger" aria-label={et('Дополнительные разделы',language)} aria-expanded={open} aria-controls="student-section-options" onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Settings2 size={21}/>}</button>{open&&<div id="student-section-options" className="student-section-options"><strong>{et('Дополнительные разделы',language)}</strong>{options.map(s=><label key={s}><input type="checkbox" checked={selected.includes(s)} onChange={e=>onChange(e.target.checked?[...selected,s]:selected.filter(v=>v!==s))}/>{labels[s]}</label>)}{!options.length&&<p>{et('Дополнительные разделы отключены учреждением',language)}</p>}</div>}</div>;
}
