'use client';
import {useLanguage} from './language-context';
import {useInstitution,useInstitutionText} from './institution-context';
import {ageAt} from './person-data';
export function Age({value}:{value:unknown}){
 const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();const age=ageAt(value);if(age===null)return null;
 const unit=language==='KZ'?'жас':language==='EN'?(age===1?'year':'years'):age%10===1&&age%100!==11?'год':[2,3,4].includes(age%10)&&![12,13,14].includes(age%100)?'года':'лет';
 return <>{age} {unit}</>;
}
export function Birthday({value}:{value:unknown}){
 const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();if(ageAt(value)===null)return null;
 const text=String(value).split('-').reverse().join('.');
 return <p className="person-birthday">{tr('Дата рождения',language)}: {text} (<Age value={value}/>)</p>;
}
export function TeacherFacts({payload,className}:{payload:Record<string,unknown>;className?:string}){
 const {language}=useLanguage();const type=useInstitution();const tr=useInstitutionText();
 const education=[payload.education,payload.institution,payload.graduationYear].filter(Boolean).join(', ');
 const rows:[string,unknown][]=[['Квалификационная категория',payload.qualification],['Классное руководство',payload.homeroomClass||className],['Специализация',payload.specialization],['Образовательная программа',payload.specialty],['Факультет',payload.faculty],['Кафедра',payload.department],['Стаж',payload.experience],['Стаж в этой школе',payload.schoolExperience],['Образование',education],['Языки преподавания',payload.teachingLanguages],['Рабочие часы',payload.officeHours],['Кабинет',payload.room],['Телефон',payload.phone]];
 return <dl className="person-facts">{rows.filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([label,value])=><div key={label}><dt>{tr(label,language)}</dt><dd>{String(value)}</dd></div>)}{ageAt(payload.birthDate)!==null&&<div><dt>{tr('Возраст',language)}</dt><dd><Age value={payload.birthDate}/></dd></div>}</dl>;
}
