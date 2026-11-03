'use client';
import {useState} from 'react';
import {useLanguage} from './language-context';
import {tr} from './i18n';
import {calendarKind} from './calendar-model';
import {MonthCalendar} from './month-calendar';
import type {PublicItem} from './public-content';
export function EventsCenter({items,children}:{items:PublicItem[];children:React.ReactNode}){
 const [tab,setTab]=useState('events');const {language}=useLanguage();
 return <section className="events-center"><nav className="events-tabs"><button aria-pressed={tab==='events'} className="owner-secondary" onClick={()=>setTab('events')}>{tr('События',language)}</button><button aria-pressed={tab==='calendar'} className="owner-secondary" onClick={()=>setTab('calendar')}>{tr('Учебный календарь',language)}</button></nav>{tab==='calendar'?<MonthCalendar items={items.filter(i=>i.section==='events'&&i.payload.kind===calendarKind)}/>:children}</section>;
}
