import {languages,variants,sourceStamp,translatableFields,normalizeLanguage,type Language,type Localizable,type Variant} from '../i18n';
/** Rebase an editor onto the selected language without discarding the original. */
export function editingLanguage<T extends Localizable>(value:T,language:Language):T {
 const original=normalizeLanguage(value.payload._sourceLanguage);
 if(original===language)return value;
 const stamp=sourceStamp(value),all=variants(value),target=all[language];
 const valid=target?.sourceStamp===stamp;
 const old:Variant={title:value.title,description:value.description,fields:Object.fromEntries(translatableFields(value.section).map(f=>[f.key,String(value.payload[f.key]||'')])),fileId:value.fileId??value.file_id??null,enabled:true,origin:'manual',sourceStamp:stamp,imageReviewed:true};
 const fields=Object.fromEntries(translatableFields(value.section).map(f=>[f.key,valid?target.fields[f.key]||'':'']));
 const next={...value,title:valid?target.title:'',description:valid?target.description:'',fileId:valid&&target.fileId!==undefined?target.fileId:value.fileId,payload:{...value.payload,...fields,_sourceLanguage:language}} as T;
 const newStamp=sourceStamp(next);
 const translated:Partial<Record<Language,Variant>>={};
 for(const lang of languages){if(lang===language)continue;const v=lang===original?old:all[lang];if(v)translated[lang]={...v,sourceStamp:v.sourceStamp===stamp?newStamp:v.sourceStamp};}
 return {...next,payload:{...next.payload,_translations:translated}};
}
