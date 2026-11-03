import {env} from 'cloudflare:workers';
import {sourceStamp,variants,type Localizable} from './i18n';
import {calendarKind} from './calendar-model';
// Idempotent relocation preserves identifiers, publication status, attachments and valid translations.
export async function migrateContentOrganization(){
 const rows=await env.DB.prepare("SELECT id,section,title,description,file_id,payload FROM content_items WHERE section='safety' AND json_extract(payload,'$.kind') IN ('Учебный календарь','Важные объявления')").all();
 if(!rows.results.length)return;
 const statements=rows.results.map(row=>{
  const payload=JSON.parse(String(row.payload||'{}'));
  const original={section:'safety',title:String(row.title),description:String(row.description||''),file_id:row.file_id,payload} as Localizable;
  const section=payload.kind===calendarKind?'events':'announcements';
  const next={...original,section};
  const translations=Object.fromEntries(Object.entries(variants(original)).map(([lang,v])=>[lang,v?.sourceStamp===sourceStamp(original)?{...v,sourceStamp:sourceStamp(next)}:v]));
  const updated={...payload,_translations:translations};
  if(payload._calendarSourceId&&payload._calendarSignature){try{const sig=JSON.parse(payload._calendarSignature);if(Array.isArray(sig))updated._calendarSignature=JSON.stringify([sig[0],translations]);}catch{}}
  return env.DB.prepare('UPDATE content_items SET section=?,payload=? WHERE id=? AND section=?').bind(section,JSON.stringify(updated),row.id,'safety');
 });
 await env.DB.batch(statements);
}
