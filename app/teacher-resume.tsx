'use client';
import {UserRound} from 'lucide-react';
import {TeacherFacts} from './person-facts';
import {useInstitutionText} from './institution-context';
import {useLanguage} from './language-context';
import type {PublicItem} from './public-content';
export function TeacherResume({item}:{item:PublicItem}){
 const {language}=useLanguage(),tr=useInstitutionText();
 return <article className="teacher-resume"><div className="resume-copy"><p className="eyebrow">{tr(String(item.payload.position||'Преподаватель'),language)}</p><h2>{item.title}</h2><strong>{String(item.payload.subjects||'')}</strong>{item.description&&<p>{item.description}</p>}<TeacherFacts payload={item.payload}/>{item.payload.classes&&<p>{tr('Классы',language)}: {String(item.payload.classes)}</p>}{item.payload.email&&<p>{String(item.payload.email)}</p>}</div><div className="resume-portrait">{item.file_id&&item.file_mime_type?.startsWith('image/')?<img src={`/api/files/${encodeURIComponent(item.file_id)}`} alt={item.title}/>:<UserRound size={40}/>}</div></article>;
}
