import {sectionLabels} from './content-model';
export type DisplayProfile={id:string;schoolId:string;name:string;sections:string[];startSection:string};
export type DisplayDevice={id:string;schoolId:string;name:string;location:string;profileId:string;enabled:boolean};
export function profileError(p:DisplayProfile){
 if(!p.name?.trim()||p.name.length>120)return 'Введите название профиля (до 120 символов)';
 if(!Array.isArray(p.sections)||!p.sections.length||p.sections.length>Object.keys(sectionLabels).length||new Set(p.sections).size!==p.sections.length||p.sections.some(s=>!Object.hasOwn(sectionLabels,s)))return 'Выберите хотя бы один раздел без повторов';
 if(!p.sections.includes(p.startSection))return 'Стартовая страница должна входить в выбранные разделы';
 return '';
}
