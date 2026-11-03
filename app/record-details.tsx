"use client";
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {X, UserRound, ArrowRight, Sparkles,Maximize2,Minimize2} from 'lucide-react';
import type {PublicItem} from './public-content';
import {fieldsFor,recordFields} from './content-model';
import {safetyFields} from './safety-fields';
import {useLanguage} from './language-context';
import {useInstitution,useInstitutionText} from './institution-context';
import {TeacherFacts,Birthday} from './person-facts';
import {TeacherResume} from './teacher-resume';
import {DocumentPreview} from './document-preview';
import {parentIsPublic} from './person-data';

export function DetailDialog({title,children,onClose,className=""}:{title:string;children:React.ReactNode;onClose:()=>void;className?:string}) {
 const [expanded,setExpanded]=useState(false);
 const dialog=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
 const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close.current();}if(e.key==='Tab'){
   const nodes=dialog.current?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex="0"]');
   if(!nodes?.length){e.preventDefault();return;}const first=nodes[0],last=nodes[nodes.length-1];
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }};
  const reset=()=>close.current();document.addEventListener('portal-reset',reset);document.addEventListener('keydown',key);return()=>{document.removeEventListener('portal-reset',reset);document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
 },[]);
 return createPortal(<div className="record-detail-backdrop" onClick={onClose}><div className={`record-detail-dialog ${className} ${expanded?"is-expanded":""}`} ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><header><h2>{title}</h2>{className==='detail-section-documents'&&<button type="button" onClick={()=>setExpanded(v=>!v)} aria-label={tr(expanded?'Уменьшить':'Развернуть',language)}>{expanded?<Minimize2/>:<Maximize2/>}<span>{tr(expanded?'Уменьшить':'Развернуть',language)}</span></button>}<button type="button" onClick={onClose} aria-label={tr('Закрыть',language)}><X/><span>{tr('Закрыть',language)}</span></button></header><div className="record-detail-body">{children}</div></div></div>,document.body);
}
export function Details({item,items}:{item:PublicItem;items:PublicItem[]}){
 const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();
 const teacher=items.find(t=>t.section==='teachers'&&(t.id===item.payload.teacherId||t.title===item.payload.teacher));
 if(item.section==='teachers')return <TeacherResume item={item}/>;
 const gallery=Array.isArray(item.payload.galleryIds)?item.payload.galleryIds.filter((x:unknown)=>typeof x==='string'):[];
 const images=Array.from(new Set([...(item.file_id&&item.file_mime_type?.startsWith('image/')?[item.file_id]:[]),...gallery]));
 return <>
  {!!images.length&&<div className="detail-gallery">{images.map(id=><img key={id} src={`/api/files/${encodeURIComponent(id)}`} alt={item.title} loading="lazy"/>)}</div>}
  <p className="detail-description">{item.description}</p>
  <dl className="detail-fields">{(recordFields(item.section,item.payload,type)).filter(f=>item.payload[f.key]!==undefined&&item.payload[f.key]!==''&&f.key!=='teacherId').map(f=><div key={f.key}><dt>{tr(f.label,language)}</dt><dd>{tr(String(item.payload[f.key]),language)}</dd></div>)}</dl>
  {teacher&&<section className="detail-teacher"><h3>{tr('Преподаватель',language)}</h3><TeacherResume item={teacher}/></section>}
  {item.file_id&&!item.file_mime_type?.startsWith('image/')&&!item.file_mime_type?.startsWith('video/')&&<DocumentPreview fileId={item.file_id} mime={item.file_mime_type||''}/>}
  {item.file_id&&item.file_mime_type?.startsWith('video/')&&<video className="detail-video" controls controlsList="nodownload noremoteplayback" disablePictureInPicture src={`/api/files/${encodeURIComponent(item.file_id)}`}/>}
 </>;
}
export function RecordCard({item,items=[],readOnly=false,compact=false}:{item:PublicItem;items?:PublicItem[];readOnly?:boolean;compact?:boolean}){
 const [open,setOpen]=useState(false);const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();
 const preview=Array.from(item.description||'').slice(0,compact?100:item.section==='about'?500:220).join('');
 const enrollment=item.section==='clubs'?(item.payload.enrollment||(String(item.payload.places)==='0'?'Набор завершён':'Набор открыт')):'';
 if(item.section==='teachers'&&!compact)return <TeacherResume item={item}/>;
 const cover=item.file_id&&item.file_mime_type?.startsWith('image/')?item.file_id:Array.isArray(item.payload.galleryIds)?String(item.payload.galleryIds[0]||''):'';
 const mealDay=String(item.payload._mealDay||new Date().toISOString().slice(0,10));
 const mealIndex=(new Date(mealDay+'T12:00:00Z').getUTCDay()+6)%7%6;
 return <><article className={`record-card section-${item.section} ${compact?'compact-record':''} ${item.payload.kind==='План эвакуации'?'evacuation-record':''} ${item.section==='safety'&&item.payload.kind==='Куда обратиться'?'contact-help-record':''} ${readOnly?'':'record-card-interactive'}`} tabIndex={readOnly?undefined:0} role={readOnly?undefined:'button'} aria-haspopup={readOnly?undefined:'dialog'} onClick={readOnly?undefined:()=>setOpen(true)} onKeyDown={e=>{if(!readOnly&&e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setOpen(true);}}}>
  {cover?<div className="content-media"><img loading="lazy" src={`/api/files/${encodeURIComponent(cover)}`} alt={item.title}/></div>:item.section==='menu'&&!compact?<div className="meal-art" style={{backgroundImage:`url(/meal-assets/day-${mealIndex+1}.webp)`,backgroundPosition:`${/завтрак|breakfast|таңғы/i.test(String(item.payload.meal))?0:/обед|ужин|lunch|dinner|түскі|кешкі/i.test(String(item.payload.meal))?50:100}% 50%`}}><small>{tr('Иллюстрация',language)}</small></div>:item.section==='clubs'&&!compact?<div className="club-monogram"><Sparkles size={32}/><span>{String(item.payload.category||item.title)}</span></div>:null}
  <p className="eyebrow">{tr(String(item.payload.category||item.payload.date||item.payload.day||''),language)}</p><h2>{item.title}</h2>
  {enrollment&&<strong className="enrollment-badge">{tr(String(enrollment),language)}</strong>}
  <p className="detail-description">{item.section==='documents'&&!item.file_id?tr('Документ пока не прикреплён',language):preview}{preview.length<(item.description||'').length?'…':''}</p>
  {compact&&<p className="compact-meta">{[item.payload.start,item.payload.room,item.payload.award].filter(Boolean).map(String).join(" · ")}</p>}
  {!compact&&<dl>{(recordFields(item.section,item.payload,type)).filter(f=>['date','endDate','deadline','start','end','room','teacher','days','meal','mealTime','price','award','position','subjects','contactName','phone','email','responsibilities','locationDetails','workingHours','organization','faculty','duration','specialization'].includes(f.key)&&item.payload[f.key]).map(f=><div key={f.key}><dt>{tr(f.label,language)}</dt><dd>{tr(String(item.payload[f.key]),language)}</dd></div>)}</dl>}
  {!readOnly&&<button type="button" className="owner-secondary" onClick={e=>{e.stopPropagation();setOpen(true);}}>{tr('Подробнее',language)}</button>}
 </article>{open&&<DetailDialog title={item.title} className={`detail-section-${item.section}`} onClose={()=>setOpen(false)}><Details item={item} items={items}/></DetailDialog>}</>;
}
function PersonPortrait({item}:{item?:PublicItem}) {
 return <div className="person-portrait">{item?.file_id&&item.file_mime_type?.startsWith('image/')?<img src={`/api/files/${encodeURIComponent(item.file_id)}`} alt={item.title}/>:<UserRound aria-hidden="true"/>}</div>;
}
const classNameOf=(r:PublicItem)=>String(r.payload.className||'').replace(/класс|сынып|class|grade/giu,'').trim().replace(/\s+/g,'').toLocaleUpperCase('ru')||'—';

export function StudentsDirectory({rows,items}:{rows:PublicItem[];items:PublicItem[]}){
 const [selected,setSelected]=useState(''),[studentId,setStudentId]=useState(''),[stage,setStage]=useState('');const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();
 const stages=fieldsFor('students',type).find(f=>f.key==='stage')?.options||[];
 const getStage=(r:PublicItem)=>r.payload.stage||(type!=='school'?tr('Не указан',language):(Number.parseInt(String(r.payload.className))<=4?stages[0]:Number.parseInt(String(r.payload.className))<=9?stages[1]:stages[2]));
 const classes=Array.from(new Set(rows.filter(r=>!stage||getStage(r)===stage).map(classNameOf))).sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
 const students=rows.filter(r=>classNameOf(r)===selected).sort((a,b)=>a.title.localeCompare(b.title,'ru'));
 const student=students.find(r=>r.id===studentId)||students[0];
 const teacherName=students.find(r=>r.payload.classTeacher)?.payload.classTeacher;
 const teacherId=students.find(r=>r.payload.classTeacherId)?.payload.classTeacherId;
 const teacher=items.find(r=>r.section==='teachers'&&(r.id===teacherId||r.title===teacherName));
 const boys=students.filter(r=>r.payload.gender==='Мальчик').length,girls=students.filter(r=>r.payload.gender==='Девочка').length;
 const shifts=Array.from(new Set(students.map(r=>String(r.payload.shift||'')).filter(s=>['1','2','3'].includes(s)))).sort();
 const missing=tr('Не указан',language);
 return <section className="managed-records"><label>{tr('Ступень обучения',language)}<select value={stage} onChange={e=>setStage(e.target.value)}><option value="">{tr('Все',language)}</option>{stages.map(s=><option key={s} value={s}>{tr(s,language)}</option>)}</select></label>
  <div className="class-cards-grid">{classes.map(name=>{
   const members=rows.filter(r=>classNameOf(r)===name);
   const level=getStage(members[0]);
   const illustration=type==='kindergarten'?'primary':type!=='school'?'senior':level===stages[0]?'primary':level===stages[1]?'middle':'senior';
   const grade=Number.parseInt(name);
   const palette=Number.isFinite(grade)?((Math.max(1,grade)-1)%12)+1:1;
   return <button type="button" className={`record-card class-card illustrated-class-card grade-palette-${palette}`} key={name} onClick={()=>{setSelected(name);setStudentId('');}}>
    <div className="class-card-copy"><span className="class-stage-label">{tr(String(level),language)}</span><h2><span>{tr('Класс',language)}:</span> <span className="class-name">{name}</span></h2><p>{members.length} {tr('учеников',language)}</p><span className="class-card-action">{tr('Подробнее',language)}<ArrowRight size={16} aria-hidden="true"/></span></div>
    <div className="class-card-art" aria-hidden="true"><img src={`/images/classes/${illustration}.png`} alt="" loading="lazy" width={512} height={512}/><Sparkles className="class-card-sparkles"/></div>
   </button>;
  })}</div>
  {!classes.length&&<p>{tr('Пока нет опубликованных материалов',language)}</p>}
  {selected&&<DetailDialog className="class-directory-dialog" title={`${tr('Класс',language)}: ${selected}`} onClose={()=>setSelected('')}>
   <div className="class-directory-layout">
    <div className="class-student-list" role="group" aria-label={tr('Ученики',language)}>{students.map(r=>{const [surname,givenName]=r.title.trim().split(/\s+/);return <button type="button" key={r.id} className={`student-name-card ${student?.id===r.id?'is-selected':''}`} aria-pressed={student?.id===r.id} aria-controls="selected-student-profile" onClick={()=>setStudentId(r.id)}><strong>{surname}</strong><span>{givenName||'—'}</span></button>;})}</div>
    <aside className="class-profile-panel">
     <div className="class-summary"><strong>{tr('Класс',language)}: {selected} · {students.length} {tr('учеников',language)}</strong><p>{tr('Мальчики',language)}: {boys} · {tr('Девочки',language)}: {girls}{students.length>boys+girls&&<> · {tr('Пол не указан',language)}: {students.length-boys-girls}</>}</p>{type!=='kindergarten'&&<p>{tr('Смена',language)}: {shifts.length?shifts.map(s=>['I','II','III'][Number(s)-1]).join(', '):missing}{students.some(r=>!r.payload.shift)&&shifts.length>0?` (${tr('Указана не у всех',language)})`:''}</p>}<p>{tr('Кабинет классного руководителя',language)}: {String(teacher?.payload.room||missing)}</p></div>
     <article className="class-person-card"><h3>{tr('Классный руководитель',language)}</h3><div className="person-heading"><PersonPortrait item={teacher}/><div><h4>{teacher?.title||String(teacherName||missing)}</h4><p>{String(teacher?.payload.subjects||'')}</p></div></div><TeacherFacts payload={teacher?.payload||{}} className={selected}/></article>
     <article className="class-person-card" id="selected-student-profile" aria-live="polite" aria-atomic="true"><h3>{tr('Ученик',language)}</h3>{student?<><div className="person-heading"><PersonPortrait item={student}/><div><h4>{student.title}</h4><Birthday value={student.payload.birthDate}/>{student.payload.studentPhone&&<p>{String(student.payload.studentPhone)}</p>}</div></div><dl className="student-parent-details">{[1,2].filter(n=>parentIsPublic(student.payload,n)&&(student.payload[`parent${n}Name`]||student.payload[`parent${n}Phone`])).map(n=><div key={n}><dt>{tr(n===1?'Первый родитель':'Второй родитель',language)}</dt><dd>{String(student.payload[`parent${n}Name`]||'—')}<span>{String(student.payload[`parent${n}Phone`]||'—')}</span></dd></div>)}</dl></>:<p>{tr('Пока нет опубликованных материалов',language)}</p>}</article>
    </aside>
   </div>
  </DetailDialog>}
 </section>;
}
