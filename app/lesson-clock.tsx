'use client';
import {useClockTime} from './clock-time';
import {useLanguage} from './language-context';
import {et} from './experience-text';
import {lessonState,formatCountdown} from './lesson-clock-model';
import type {Experience} from './experience-model';
import type {PublicItem} from './public-content';
export function LessonClock({items,settings,className='',institutionType='school',compact=false}:{items:PublicItem[];settings:Experience;className?:string;institutionType?:unknown;compact?:boolean}){
 const now=useClockTime();const {language}=useLanguage();
 if(!now)return <aside className={`live-lesson-clock ${compact?'clock-compact':''}`}>—:—:—</aside>;
 const s=lessonState(items,now,settings,className);
 const starts=Array.from(new Set(items.filter(r=>r.section==='schedule'&&r.payload.day===s.day&&String(r.payload.shift||'1')===s.shift).map(r=>String(r.payload.start)))).sort();
 const n=(i?:PublicItem)=>String(i?.payload.lessonNumber||(starts.indexOf(String(i?.payload.start))+1)||'');
 const lessonLabel=institutionType==='school'?'Урок':institutionType==='kindergarten'?'Занятие':'Пара';
 const countdown=formatCountdown(s.secondsLeft);
 const label=s.state==='lesson'?`${et(lessonLabel,language)} ${n(s.current)}`:s.state==='break'?`${et('Перемена',language)} ${n(s.previous)} → ${n(s.next)}`:s.state==='before'?et('До начала',language):et(s.hasSchedule?'Занятия завершены':'Нет расписания на сегодня',language);
 if(compact)return <aside className="live-lesson-clock clock-compact"><time>{s.time}</time><div className="compact-lesson-status"><strong>{label}</strong>{s.secondsLeft>0&&<b className={s.state==='break'&&s.secondsLeft<=30?'countdown-urgent':''} title={et(s.state==='lesson'?'До конца урока':s.state==='break'?'До конца перемены':'До начала',language)}>{countdown}</b>}{s.shift&&institutionType!=='kindergarten'&&<small>{et('Смена',language)} {s.shift}</small>}</div>{className&&<div className="compact-lesson-details">{s.current&&<p>{s.current.title} · {et('Кабинет',language)} {String(s.current.payload.room||'—')}</p>}{s.next&&<p><span>{et(institutionType==='school'?'Следующий урок':'Следующее занятие',language)}:</span> {s.next.title} · {String(s.next.payload.start)} · {String(s.next.payload.room||'')}</p>}</div>}</aside>;
 return <aside className="live-lesson-clock"><time>{s.time}</time><span>{new Intl.DateTimeFormat(language==='KZ'?'kk-KZ':language==='EN'?'en-GB':'ru-RU',{timeZone:settings.timezone,weekday:'long',day:'numeric',month:'long'}).format(now)}</span>
 <div className="lesson-now"><small>{s.shift&&institutionType!=='kindergarten'&&`${et('Смена',language)} ${s.shift}`}</small><strong>{s.state==='lesson'?`${et(lessonLabel,language)} ${n(s.current)}`:s.state==='break'?`${et('Перемена',language)} ${n(s.previous)} → ${n(s.next)}`:s.state==='before'?et('До начала',language):et(s.hasSchedule?'Занятия завершены':'Нет расписания на сегодня',language)}</strong>{s.secondsLeft>0&&<small>{et(s.state==='lesson'?'До конца урока':s.state==='break'?'До конца перемены':'До начала',language)}</small>}{s.secondsLeft>0&&<b className={s.state==='break'&&s.secondsLeft<=30?'countdown-urgent':''}>{countdown}</b>}{className&&s.current&&<p>{s.current.title} · {et('Кабинет',language)} {String(s.current.payload.room||'—')}</p>}{className&&s.next&&<p>{et(institutionType==='school'?'Следующий урок':'Следующее занятие',language)}: {s.next.title} · {String(s.next.payload.start)} · {String(s.next.payload.room||'')}</p>}</div></aside>;
}
