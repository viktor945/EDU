import {env} from 'cloudflare:workers';
import {calendarDates,calendarPayload,type CalendarSource} from './calendar-model';
import {publicContent,variants,sourceStamp,tr,type Language} from './i18n';
export function calendarSyncStatements(source:CalendarSource){
 if(source.payload._calendarSourceId)return [];
 const now=new Date().toISOString(),dates=calendarDates(source);
 const ids=dates.map(d=>`calendar:${source.id}:${d.key}`);
 // Keep historical calendar entries; remove linked entries only when their source date was removed.
 const allDates=calendarDates(source,'0000-01-01');
 const cleanup=env.DB.prepare(`DELETE FROM content_items WHERE school_id=? AND section='events' AND json_extract(payload,'$._calendarSourceId')=? ${allDates.length?`AND NOT (${allDates.map(()=>"(json_extract(payload,'$._calendarDateKey')=? AND json_extract(payload,'$.date')=? AND json_extract(payload,'$.endDate')=?)").join(' OR ')})`:''}`).bind(source.schoolId,source.id,...allDates.flatMap(d=>[d.key,d.date,d.endDate]));
 return [cleanup,...dates.map((date,i)=>{
  const entry=calendarPayload(source,date);
  const translated=Object.fromEntries(Object.entries(variants(publicContent(source))).map(([language,v])=>[language,{...v!,title:date.label?`${v!.title} · ${tr(date.label,language as Language)}`:v!.title,description:source.section==='students'?'':v!.description,fields:{},fileId:undefined,fileMimeType:undefined,sourceStamp:sourceStamp({section:'events',title:entry.title,description:entry.description,payload:entry.fields,fileId:source.fileId})}]));
  const payload={...entry.fields,_calendarSignature:JSON.stringify([entry.fields._calendarSignature,translated]),_translations:translated};
  return env.DB.prepare(`INSERT INTO content_items (id,school_id,section,title,description,status,visible,file_id,payload,sort_order,created_at,updated_at) VALUES (?,?,'events',?,?,'review',0,?,?,0,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,status='review',visible=0,file_id=excluded.file_id,payload=excluded.payload,updated_at=excluded.updated_at WHERE content_items.school_id=excluded.school_id AND json_extract(content_items.payload,'$._calendarSignature') IS NOT json_extract(excluded.payload,'$._calendarSignature')`).bind(ids[i],source.schoolId,entry.title,entry.description,source.fileId||null,JSON.stringify(payload),now,now);
 })];
}
export function asCalendarSource(data:Record<string,unknown>,id:string):CalendarSource{return {id,schoolId:String(data.schoolId),section:String(data.section),title:String(data.title||''),description:String(data.description||''),payload:(data.payload||{}) as Record<string,unknown>,fileId:data.fileId?String(data.fileId):null};}
export function calendarSourceIsPublic(payload:Record<string,unknown>,publicIds:Set<string>){return !payload._calendarSourceId||publicIds.has(String(payload._calendarSourceId));}
