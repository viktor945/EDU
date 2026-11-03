'use client';
import {useEffect,useState} from 'react';
import {RecordCard} from './record-details';
import {useLanguage} from './language-context';
import {useInstitution,useInstitutionText} from './institution-context';
import {institutionToday} from './calendar-model';
import type {PublicItem} from './public-content';
import type {SectionLayout} from './school-design';
const days=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
export function MealDirectory({rows,items,layout}:{rows:PublicItem[];items:PublicItem[];layout:SectionLayout}){
 const type=useInstitution(),{language}=useLanguage(),tr=useInstitutionText(),[today,setToday]=useState(institutionToday()),[selected,setSelected]=useState(institutionToday());
 useEffect(()=>{const t=setInterval(()=>{const next=institutionToday();if(next!==today){setToday(next);setSelected(day=>day===today?next:day);}},60000);return()=>clearInterval(t);},[today]);
 const date=new Date(selected+'T12:00:00Z'),dow=date.getUTCDay();
 const enabled=(_name:string)=>true; // Visibility is enforced by the public API before localization.
 const dated=rows.filter(r=>r.payload.date===selected&&enabled(String(r.payload.meal)));
 const meals=rows.filter(r=>enabled(String(r.payload.meal))&&(r.payload.date? r.payload.date===selected:r.payload.day===days[dow]&&!dated.some(d=>d.payload.meal===r.payload.meal)));
 const start=new Date(date);start.setUTCDate(date.getUTCDate()-((dow+6)%7));
 return <section className="meal-directory" data-institution={type}><div className="meal-day-toolbar"><button className="owner-secondary" onClick={()=>setSelected(today)}>{tr('Сегодня',language)}</button><input aria-label={tr('Дата',language)} type="date" value={selected} onChange={e=>{if(e.target.value)setSelected(e.target.value);}}/><span>{new Intl.DateTimeFormat(language==='KZ'?'kk-KZ':language==='EN'?'en-GB':'ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date)}</span></div><nav className="meal-week">{Array.from({length:7},(_,i)=>{const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);const iso=d.toISOString().slice(0,10);return <button key={iso} className={selected===iso?'active':''} aria-pressed={selected===iso} onClick={()=>setSelected(iso)}>{tr(days[d.getUTCDay()],language)}</button>;})}</nav><div className="meal-grid">{meals.map(item=><RecordCard key={item.id} item={{...item,payload:{...item.payload,_mealDay:selected}}} items={items}/>)}</div>{!meals.length&&<p className="owner-empty">{tr('На этот день меню не опубликовано',language)}</p>}</section>;
}
