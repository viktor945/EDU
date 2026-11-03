'use client';
import {useState} from 'react';
import {useLanguage} from './language-context';
import {tr} from './i18n';
import {calendarDays,coversDay,institutionToday,calendarKind} from './calendar-model';
import {RecordCard} from './record-details';
import type {PublicItem} from './public-content';
export function MonthCalendar({items,onEdit,onCreate}:{items:PublicItem[];onEdit?:(id:string)=>void;onCreate?:(day:string)=>void}){
 const {language}=useLanguage(),today=institutionToday();
 const [month,setMonth]=useState(today.slice(0,7)),[day,setDay]=useState(today);
 const locale=language==='KZ'?'kk-KZ':language==='EN'?'en-GB':'ru-RU';
 const rows=items.filter(i=>i.section==='events'&&i.payload.kind===calendarKind);
 const days=calendarDays(month),selected=rows.filter(i=>coversDay(i.payload,day));
 const monthTitle=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
 function move(step:number){const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+step);const next=date.toISOString().slice(0,7);setMonth(next);setDay(next+'-01');}
 return <section className="month-calendar"><header className="calendar-toolbar"><div><p>{tr('Учебный календарь',language)}</p><h2>{monthTitle}</h2></div><div><button type="button" aria-label={tr('Предыдущий месяц',language)} onClick={()=>move(-1)}>‹</button><button type="button" onClick={()=>{setMonth(today.slice(0,7));setDay(today);}}>{tr('Сегодня',language)}</button><button type="button" aria-label={tr('Следующий месяц',language)} onClick={()=>move(1)}>›</button></div></header>
 <div className="month-grid" aria-label={monthTitle}>{days.slice(0,7).map(d=><span key={'weekday'+d} className="weekday">{new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))}</span>)}
 {days.map(d=>{const events=rows.filter(i=>coversDay(i.payload,d));return <button type="button" key={d} className={`month-day ${d.slice(0,7)!==month?'outside':''} ${d===day?'selected':''} ${d===today?'today':''}`} aria-pressed={day===d} aria-label={`${d}: ${events.length} ${tr('событий',language)}`} onClick={()=>setDay(d)}><strong>{Number(d.slice(-2))}</strong>{events.slice(0,2).map(i=><span className="calendar-event-chip" key={i.id}>{i.title}</span>)}{events.length>2&&<small>+{events.length-2}</small>}{events.length>0&&<i className="mobile-calendar-count">{events.length}</i>}</button>;})}</div>
 <section className="calendar-day-details" aria-live="polite"><header><h3>{new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))}</h3>{onCreate&&<button type="button" className="owner-primary" onClick={()=>onCreate(day)}>Добавить дату</button>}</header>
 {!selected.length&&<p>{tr('На этот день нет опубликованных событий',language)}</p>}<div className="calendar-day-cards">{selected.map(item=><div key={item.id}><RecordCard item={item} items={items}/>{onEdit&&<button type="button" className="owner-secondary" onClick={()=>onEdit(item.id)}>Редактировать</button>}</div>)}</div></section></section>;
}
