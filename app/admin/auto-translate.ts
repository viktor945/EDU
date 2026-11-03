import {languages,languageNames,normalizeLanguage,sourceStamp,variants,Localizable,Variant,Language} from '../i18n';
const pending=new Map<string,Promise<Partial<Variant>>>();
async function translated(value:Localizable&{schoolId:string},target:Language){
 const key=JSON.stringify([value.schoolId,sourceStamp(value),target]);
 let job=pending.get(key);
 if(!job){job=(async()=>{const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'text',target,schoolId:value.schoolId,content:value})});const data=await response.json() as {translation:Partial<Variant>;error?:string};if(!response.ok)throw Error(data.error||'Не удалось перевести текст');return data.translation;})();pending.set(key,job);job.catch(()=>pending.delete(key));if(pending.size>50)pending.delete(pending.keys().next().value!);}
 return job;
}
export async function fillLanguageVersions<T extends Localizable&{schoolId:string}>(value:T,strict=false):Promise<T>{
 const stamp=sourceStamp(value),versions={...variants(value)};
 await Promise.all(languages.filter(l=>l!==normalizeLanguage(value.payload._sourceLanguage)).map(async target=>{
  const current=versions[target];
  if(current?.sourceStamp===stamp&&current.enabled&&(!current.fileId||current.imageReviewed))return;
  if(current?.origin==='manual'&&current.title){if(strict)throw Error(`Проверьте и включите ручной перевод: ${languageNames[target]}`);return;}
  const translation=await translated(value,target);
  versions[target]={...current,...translation,title:String(translation.title||''),description:String(translation.description||''),fields:translation.fields||{},origin:'auto',sourceStamp:stamp,enabled:!current?.fileId||current.imageReviewed===true};
  if(strict&&!versions[target]?.enabled)throw Error(`Проверьте изображение: ${languageNames[target]}`);
 }));
 return {...value,payload:{...value.payload,_translations:versions}};
}
