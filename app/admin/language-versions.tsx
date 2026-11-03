'use client';
import {Localized} from './admin-locale';
import {adminLocale} from './admin-text';
import {fillLanguageVersions} from './auto-translate';
import {useEffect,useState,useRef} from 'react';
import {Language,Localizable,Variant,languages,languageNames,normalizeLanguage,variants,sourceStamp,translatableFields} from '../i18n';
type Attachment={id:string;name:string;mimeType:string};
export function LanguageVersions({value,files,update}:{value:Localizable&{schoolId:string};files:Attachment[];update:(key:string,value:unknown)=>void}){
 const source=normalizeLanguage(value.payload._sourceLanguage);
 const [target,setTarget]=useState<Language>('KZ'),[configured,setConfigured]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[uploads,setUploads]=useState<Attachment[]>([]),[usage,setUsage]=useState<{used:number;limit:number;remaining:number}|null>(null);
 useEffect(()=>{fetch('/api/translate').then(r=>r.json() as Promise<{configured?:boolean;used:number;limit:number;remaining:number}>).then(d=>{setConfigured(d.configured===true);if(typeof d.used==='number')setUsage(d);}).catch(()=>{});},[notice]);
 const latest=useRef({value,update});latest.current={value,update};
 const stamp=sourceStamp(value);
 useEffect(()=>{
  if(!configured||!value.title.trim())return;
  let active=true;
  const timer=setTimeout(async()=>{setBusy(true);setNotice('Автоматически переводим на два языка…');
   const snapshot=latest.current.value;
   try{const translated=await fillLanguageVersions(snapshot);if(active&&sourceStamp(latest.current.value)===sourceStamp(snapshot)){
    const now=latest.current.value,merged={...variants(now)};
    for(const target of languages.filter(l=>l!==normalizeLanguage(snapshot.payload._sourceLanguage))){
     const previous=variants(snapshot)[target],current=variants(now)[target];
     if(JSON.stringify(previous)===JSON.stringify(current))merged[target]=variants(translated)[target];
    }
    latest.current.update('payload',{...now.payload,_translations:merged});setNotice('Автоперевод заполнен. Его можно отредактировать перед публикацией.');
   }}catch(e){if(active)setNotice(e instanceof Error?e.message:'Перевод не выполнен');}finally{if(active)setBusy(false);}
  },3000);
  return()=>{active=false;clearTimeout(timer);setBusy(false);};
 },[configured,stamp]);
 const lang=target===source?languages.find(l=>l!==source)!:target;
 const current=variants(value)[lang];
 const blank:Variant={title:'',description:'',fields:{},enabled:false,origin:'manual',sourceStamp:sourceStamp(value)};
 function change(p:Partial<Variant>){update('payload',{...value.payload,_translations:{...variants(value),[lang]:{...(current||blank),...p,sourceStamp:sourceStamp(value)}}});}
 async function translate(){
  setBusy(true);setNotice('Выполняется перевод…');
  try{const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'text',target:lang,schoolId:value.schoolId,content:value})});const d=await r.json() as {error?:string;file:Attachment;translation:Partial<Variant>};if(!r.ok)throw Error(d.error);
   change({...d.translation,origin:'auto',enabled:true});setNotice('Перевод готов и включён. При необходимости отредактируйте текст.');
  }catch(e){setNotice(e instanceof Error?e.message:'Ошибка перевода');}finally{setBusy(false);}
 }
 async function upload(file:File){setBusy(true);try{const form=new FormData();form.set('file',file);form.set('schoolId',value.schoolId);form.set('category',value.section);const r=await fetch('/api/files',{method:'POST',body:form});const d=await r.json() as Attachment&{error?:string};if(!r.ok)throw Error(d.error);setUploads(a=>[...a,d]);change({fileId:d.id,fileMimeType:d.mimeType,imageReviewed:true,origin:'manual'});setNotice('Файл языковой версии загружен. Сохраните материал.');}catch(e){setNotice(String(e));}finally{setBusy(false);}}
 const all=[...files,...uploads];
 return <Localized as="section" className="language-editor wide"><Localized as="h3">Языковые версии · Google Переводчик</Localized>{usage&&<Localized as="p" role="status">Использовано: {usage.used.toLocaleString(adminLocale())} / {usage.limit.toLocaleString(adminLocale())} символов за последние 32 дня. Осталось: {usage.remaining.toLocaleString(adminLocale())}. Лимит общий для всех школ; повторный показ переводов его не расходует.</Localized>}<Localized as="label">Язык оригинала<Localized as="select" value={source} onChange={e=>update('payload',{...value.payload,_sourceLanguage:e.target.value})}>{languages.map(l=><Localized as="option" key={l} value={l}>{languageNames[l]}</Localized>)}</Localized></Localized><Localized as="p">Поля выше — оригинал. Ниже — отдельный текст и файл для каждого языка. После ввода текста обе вкладки заполняются автоматически. Ручные версии не перезаписываются.</Localized><Localized as="div" className="language-switch">{languages.filter(l=>l!==source).map(l=><Localized as="button" type="button" key={l} className={l===lang?'is-active':''} onClick={()=>setTarget(l)}>{languageNames[l]}</Localized>)}</Localized>
 {!configured&&<Localized as="p" role="status">Для запуска нужен ключ Google Cloud в настройке сервера GOOGLE_TRANSLATE_API_KEY. Включите Cloud Translation API и биллинг в отдельном проекте Google. Ручные переводы уже доступны.</Localized>}
 {current&&current.sourceStamp!==sourceStamp(value)&&<Localized as="p" role="alert">Оригинал изменён. Проверьте перевод и подтвердите актуальность.</Localized>}
 <Localized as="button" type="button" disabled={!configured||busy||current?.origin==='manual'&&Boolean(current.title)} onClick={()=>translate()}>Перевести текст на {languageNames[lang]}</Localized>
 <Localized as="label">{value.section==='students'?'ФИО ученика':'Название'}<Localized as="input" value={current?.title||''} onChange={e=>change({title:e.target.value,origin:'manual'})}/></Localized>{value.section!=='students'&&<Localized as="label">Описание<Localized as="textarea" rows={4} value={current?.description||''} onChange={e=>change({description:e.target.value,origin:'manual'})}/></Localized>}
 {translatableFields(value.section).map(f=><Localized as="label" key={f.key}>{f.label}<Localized as="input" value={current?.fields?.[f.key]||''} onChange={e=>change({fields:{...current?.fields,[f.key]:e.target.value},origin:'manual'})}/></Localized>)}
 <Localized as="label">Файл для {languageNames[lang]}<Localized as="select" value={current?.fileId??''} onChange={e=>change({fileId:e.target.value||null,fileMimeType:all.find(f=>f.id===e.target.value)?.mimeType,imageReviewed:true,origin:'manual'})}><Localized as="option" value="">Без отдельного файла</Localized>{all.map(f=><Localized as="option" key={f.id} value={f.id}>{f.name}</Localized>)}</Localized></Localized><Localized as="input" aria-label="Загрузить языковую версию файла" type="file" disabled={busy} onChange={e=>{if(e.target.files?.[0])void upload(e.target.files[0]);}}/>
 <Localized as="p">Для изображений, схем, PDF и Excel загрузите готовые языковые версии. Автоматическое изменение текста на картинках отключено.</Localized>
 {current?.fileId&&<Localized as="a" target="_blank" rel="noreferrer" href={`/api/files/${current.fileId}`}>Открыть и проверить файл</Localized>}
 {current?.fileId&&<Localized as="label"><Localized as="input" type="checkbox" checked={current.imageReviewed===true} onChange={e=>change({imageReviewed:e.target.checked,enabled:false})}/> Текст и оформление файла проверены</Localized>}
 <Localized as="label"><Localized as="input" type="checkbox" disabled={busy||!current?.title||Boolean(current.fileId&&!current.imageReviewed)} checked={current?.enabled===true} onChange={e=>change({enabled:e.target.checked})}/> Версия проверена и готова к публикации вместе с материалом</Localized><Localized as="p" role="status">{notice}</Localized></Localized>;
}
