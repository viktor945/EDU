import {env} from 'cloudflare:workers';
import {Localizable,Language,normalizeLanguage,translatableFields} from './i18n';
// A rolling window longer than any calendar month avoids billing-timezone boundaries.
// Reserve before calling Google; uncertain/failed requests remain counted conservatively.
export const TRANSLATION_LIMIT=480_000;
const cutoff=()=>new Date(Date.now()-32*86400000).toISOString();
const codes={RU:'ru',KZ:'kk',EN:'en'};
export const googleConfigured=()=>Boolean((env as unknown as Record<string,unknown>).GOOGLE_TRANSLATE_API_KEY);
export async function translationUsage(){
 const row=await env.DB.prepare('SELECT COALESCE(SUM(characters),0) used FROM translation_usage WHERE created_at>=?').bind(cutoff()).first<{used:number}>();
 const used=Number(row?.used||0);return {used,limit:TRANSLATION_LIMIT,remaining:Math.max(0,TRANSLATION_LIMIT-used),windowDays:32};
}
async function cacheId(schoolId:string,source:string,target:string,field:string,text:string){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(['google-nmt-v1',schoolId,source,target,field,text])));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function googleTranslate(schoolId:string,content:Localizable,target:Language){
 const source=normalizeLanguage(content.payload._sourceLanguage);
 const values:Record<string,string>={title:content.title,description:content.description,...Object.fromEntries(translatableFields(content.section).map(f=>[`field:${f.key}`,String(content.payload[f.key]||'')]))};
 const result:Record<string,string>={},missing:{field:string;text:string;id:string}[]=[];
 for(const [field,text] of Object.entries(values)){
  if(!text.trim()||source===target){result[field]=text;continue;}
  const id=await cacheId(schoolId,source,target,field,text);
  const cached=await env.DB.prepare('SELECT translated_text FROM translation_cache WHERE id=? AND school_id=?').bind(id,schoolId).first<{translated_text:string}>();
  if(cached)result[field]=cached.translated_text;else missing.push({field,text,id});
 }
 if(missing.length){
  const key=String((env as unknown as Record<string,unknown>).GOOGLE_TRANSLATE_API_KEY||'');
  if(!key)throw Error('Google Переводчик не подключён. Нужен ключ Google Cloud. Ручные языковые версии доступны.');
  const count=missing.reduce((n,item)=>n+Array.from(item.text).length,0);
  if(count>20000)throw Error('Для одного перевода допускается до 20 000 новых символов. Разделите большой материал.');
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const reserved=await env.DB.prepare('INSERT INTO translation_usage (id,characters,created_at) SELECT ?,?,? WHERE (SELECT COALESCE(SUM(characters),0) FROM translation_usage WHERE created_at>=?)+?<=? RETURNING id').bind(id,count,now,cutoff(),count,TRANSLATION_LIMIT).first();
  if(!reserved)throw Error('Бесплатный объём автоперевода исчерпан. Новые запросы остановлены; сохранённые переводы и ручное заполнение доступны.');
  let response:Response;
  try{response=await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:missing.map(x=>x.text),source:codes[source],target:codes[target],format:'text',model:'nmt'}),signal:AbortSignal.timeout(30000)});}catch{throw Error('Google не ответил. Повторите позже или заполните перевод вручную.');}
  if(!response.ok)throw Error(response.status===403?'Google отклонил запрос. Проверьте ключ, доступ к Cloud Translation API и биллинг.':'Google Переводчик временно недоступен. Попробуйте позже.');
  const data=await response.json() as {data?:{translations?:{translatedText:string}[]}};
  const translations=data.data?.translations;
  if(!translations||translations.length!==missing.length||translations.some(x=>typeof x.translatedText!=='string'))throw Error('Google вернул неполный перевод. Материал не изменён.');
  await env.DB.batch(missing.map((item,index)=>env.DB.prepare('INSERT INTO translation_cache (id,school_id,translated_text,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(item.id,schoolId,translations[index].translatedText,now)));
  missing.forEach((item,index)=>{result[item.field]=translations[index].translatedText;});
 }
 return {title:result.title,description:result.description,fields:Object.fromEntries(Object.entries(result).filter(([k])=>k.startsWith('field:')).map(([k,v])=>[k.slice(6),v]))};
}
