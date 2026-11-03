'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {HomeAnnouncements} from '../home-announcements';
import {usePublicContent,PublicRecords} from '../public-content';
import {experienceFor} from '../experience-model';
import {RecordCard} from '../record-details';
import {LessonClock} from '../lesson-clock';
import {LanguageSwitch,useLanguage} from '../language-context';
import {et} from '../experience-text';
import {days} from '../content-model';
import {tr} from '../i18n';
import {lessonState} from '../lesson-clock-model';
import {institutionLabels,InstitutionProvider} from '../institution-context';
import {schoolThemeClass} from '../school-design';
import {sectionEnabled} from '../portal-navigation';
import {StudentSectionPicker} from './section-picker';
import {useClockTime} from '../clock-time';

export default function StudentDashboard(){
 const data=usePublicContent(),{language}=useLanguage(),now=useClockTime();
 const [role,setRole]=useState(''),[className,setClassName]=useState(''),[extras,setExtras]=useState<string[]>([]),[section,setSection]=useState('dashboard'),[selectedDay,setSelectedDay]=useState('');
 function reset(){setRole('');setClassName('');setExtras([]);setSection('dashboard');setSelectedDay('');}
 // Keep this visit in memory; a new scan, reload or restored browser page asks again.
 useEffect(()=>{reset();},[data.schoolId]);
 useEffect(()=>{
  document.documentElement.classList.add('student-view-root');document.body.classList.add('student-view-root');
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)reset();};
  window.addEventListener('pageshow',restore);
  return()=>{document.documentElement.classList.remove('student-view-root');document.body.classList.remove('student-view-root');window.removeEventListener('pageshow',restore);};
 },[]);
 const settings=experienceFor(data.school?.section_layouts),labels=institutionLabels(data.school?.institution_type,language);
 const classes=Array.from(new Set(data.items.filter(i=>['schedule','students'].includes(i.section)).map(i=>String(i.payload.className||'')).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
 const extraOptions=settings.studentSections.filter(s=>!['home','schedule','menu','safety','students','announcements'].includes(s)&&sectionEnabled(data.school?.section_layouts,s,data.school?.institution_type));
 if(!data.ready||!data.school)return <main className="portal-loading">{data.status}</main>;
 const today=lessonState(data.items,now||new Date(),settings,className);
 const schedule=data.items.filter(i=>i.section==='schedule'&&String(i.payload.className)===className&&(i.payload.date?i.payload.date===today.date&&(!selectedDay||selectedDay===today.day):i.payload.day===(selectedDay||today.day))).sort((a,b)=>String(a.payload.start).localeCompare(String(b.payload.start)));
 const menu=data.items.filter(i=>i.section==='menu'&&(!i.payload.className||i.payload.className===className));
 const notices=data.items.filter(i=>i.section==='announcements'&&(!i.payload.className||String(i.payload.className)===className));
 const currentSection=section==='dashboard'||extras.includes(section)&&extraOptions.includes(section)?section:'dashboard';
 return <InstitutionProvider type={data.school.institution_type}>
 <main className={`student-dashboard ${schoolThemeClass(data.school.theme_key)}`}>
  <header className="student-brand-header"><Link prefetch={false} href={data.href('/')}>STEPLine EDU</Link><strong>{String(data.school.name)}</strong><LanguageSwitch/></header>
  {role!=='student'?<section className="student-onboarding"><h1>{et('Кто вы?',language)}</h1><button className="owner-primary" onClick={()=>setRole('student')}>{et('Ученик / студент',language)}</button><Link prefetch={false} className="owner-secondary" href={data.href('/')}>{et('Родитель, преподаватель или гость',language)}</Link></section>
  :!className?<section className="student-onboarding"><h1>{et('Выберите класс / группу',language)}</h1><div className="student-class-picker">{classes.map(c=><button className="owner-secondary" key={c} onClick={()=>setClassName(c)}>{c}</button>)}</div>{!classes.length&&<p>{et('Нет расписания на сегодня',language)}</p>}<button className="owner-secondary" onClick={reset}>{et('Сменить пользователя',language)}</button></section>
  :<>
   <div className="student-live-bar">
    <LessonClock compact items={data.items} settings={settings} institutionType={data.school.institution_type} className={className}/>
    <StudentSectionPicker options={extraOptions} selected={extras} labels={labels} onChange={setExtras}/>
   </div>
   <div className="student-dashboard-heading"><h1>{et(data.school.institution_type==='school'?'Мой класс':'Моя группа',language)}: {className}</h1><button className="owner-secondary" onClick={()=>{setClassName('');setSection('dashboard');}}>{et('Изменить класс',language)}</button></div>
   <nav className="student-dashboard-tabs"><button className="owner-secondary" aria-pressed={currentSection==='dashboard'} onClick={()=>setSection('dashboard')}>{labels.home}</button>{extras.filter(s=>extraOptions.includes(s)).map(s=><button key={s} className="owner-secondary" aria-pressed={currentSection===s} onClick={()=>setSection(s)}>{labels[s]}</button>)}</nav>
   {currentSection==='dashboard'?<>
    <section className="student-timetable"><h2>{selectedDay&&selectedDay!==today.day?labels.schedule:et('Расписание на сегодня',language)}</h2><nav className="student-schedule-days">{days.map(day=><button className="owner-secondary" key={day} aria-pressed={(selectedDay||today.day)===day} onClick={()=>setSelectedDay(day)}>{tr(day,language)}</button>)}</nav>
     {schedule.map(i=><article key={i.id}><time>{String(i.payload.start)}–{String(i.payload.end)}</time><div><strong>{i.payload.lessonNumber?String(i.payload.lessonNumber)+'. ':''}{i.title}</strong><p>{String(i.payload.teacher||'')} · {et('Кабинет',language)} {String(i.payload.room||'')}</p>{i.payload.change&&<span>{String(i.payload.change)}</span>}</div></article>)}
     {!schedule.length&&<p>{et('Нет расписания на сегодня',language)}</p>}
    </section>
    <h2>{et('Меню сегодня',language)}</h2><PublicRecords section="menu" items={menu} school={data.school}/>
    <HomeAnnouncements items={notices}/>
   </>:<PublicRecords section={currentSection} items={data.items} school={data.school}/>}
   <footer className="student-footer"><button className="owner-secondary" onClick={reset}>{et('Сменить пользователя',language)}</button><Link prefetch={false} className="owner-secondary" href={data.href('/')}>{et('Открыть портал',language)}</Link></footer>
  </>}
 </main></InstitutionProvider>;
}
