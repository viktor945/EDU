'use client';
import {useEffect,useState} from 'react';
import {Bell,ChevronLeft,ChevronRight} from 'lucide-react';
import {RecordCard} from './record-details';
import {et} from './experience-text';
import {useLanguage} from './language-context';
import type {PublicItem} from './public-content';
export function HomeAnnouncements({items}:{items:PublicItem[]}){
 const rows=items.filter(i=>i.section==='announcements').sort((a,b)=>['Срочный','Важный','Обычный'].indexOf(String(a.payload.priority||'Обычный'))-['Срочный','Важный','Обычный'].indexOf(String(b.payload.priority||'Обычный'))),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);const {language}=useLanguage();
 useEffect(()=>{if(paused||rows.length<2)return;const timer=setInterval(()=>setIndex(i=>i+1),12000);return()=>clearInterval(timer);},[rows.length,paused]);
 if(!rows.length)return null;
 return <section className="home-announcements" onPointerEnter={e=>{if(e.pointerType==='mouse')setPaused(true);}} onPointerLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}><header><h2><Bell size={22}/>{et('Важные объявления',language)}</h2>{rows.length>1&&<div><button onClick={()=>setIndex(i=>(i+rows.length-1)%rows.length)} aria-label={language==='EN'?'Previous':language==='KZ'?'Алдыңғы':'Предыдущее'}><ChevronLeft size={20}/></button><span>{index%rows.length+1} / {rows.length}</span><button onClick={()=>setIndex(i=>i+1)} aria-label={language==='EN'?'Next':language==='KZ'?'Келесі':'Следующее'}><ChevronRight size={20}/></button></div>}</header><div key={rows[index%rows.length].id} className="announcement-slide"><RecordCard compact item={rows[index%rows.length]} items={items}/></div></section>;
}
