import {validateTranslations} from '../../translation-validation';
import {calendarSyncStatements} from '../../calendar-sync';
import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../access-policy';
import {validateContent,sectionFields,fieldsFor} from '../../content-model';
export async function POST(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{
  const raw=await request.text();if(raw.length>2_000_000)return NextResponse.json({error:'Слишком большой импорт'},{status:413});
  const {schoolId,section,rows,token,status="draft"}=JSON.parse(raw) as {schoolId:string;section:string;rows:{title:string;description:string;payload:Record<string,unknown>}[];token:string;status?:string};
  if(!hasPermission(actor,'content.edit')||!canAccessSchool(actor,schoolId))return NextResponse.json({error:'Недостаточно прав'},{status:403});
  if(!['draft','review','published'].includes(status))throw Error('Неверный статус');
  if(status==='published'&&!hasPermission(actor,'content.publish'))return NextResponse.json({error:'Нет права публикации'},{status:403});
  if(!schoolId||!Object.hasOwn(sectionFields,section)||!Array.isArray(rows)||!rows.length||rows.length>300||!token||token.length>80)throw Error('Неверные параметры импорта');
  const school=await env.DB.prepare('SELECT id,institution_type FROM schools WHERE id=?').bind(schoolId).first();if(!school)throw Error('Учреждение не найдено');
  const operation=`import:${schoolId}:${section}:${token}`;
  if(await env.DB.prepare('SELECT id FROM app_operations WHERE id=?').bind(operation).first())return NextResponse.json({repeated:true});
  const existing=await env.DB.prepare('SELECT title,description,payload FROM content_items WHERE school_id=? AND section=?').bind(schoolId,section).all();
  const canonical=(r:{title:string;description:string;payload:Record<string,unknown>})=>JSON.stringify([r.title.trim(),r.description.trim(),...fieldsFor(section,school.institution_type).map(f=>String(r.payload[f.key]??'').trim())]);
  const seen=new Set(existing.results.map(r=>canonical({title:String(r.title),description:String(r.description),payload:JSON.parse(String(r.payload))})));
  for(const [i,row] of rows.entries()){
   if(typeof row.title!=='string'||typeof row.description!=='string'||!row.payload||Array.isArray(row.payload))throw Error(`Строка ${i+2}: неверные данные`);
   const translationError=await validateTranslations({...row,section,schoolId});if(translationError)throw Error(translationError);
   const errors=validateContent(section,row.title,row.payload,school.institution_type);if(errors.length)throw Error(`Строка ${i+2}: ${errors.join('; ')}`);
   const key=canonical(row);if(seen.has(key))throw Error(`Строка ${i+2}: такая запись уже существует или повторяется в файле`);seen.add(key);
  }
  const now=new Date().toISOString();
  await env.DB.batch([
   env.DB.prepare('INSERT INTO app_operations (id,created_at) VALUES (?,?)').bind(operation,now),
   ...rows.flatMap(r=>{const id=crypto.randomUUID();return [env.DB.prepare("INSERT INTO content_items (id,school_id,section,title,description,status,visible,payload,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?, ?,0,?,?)").bind(id,schoolId,section,r.title.trim(),r.description,status,status==='published'?1:0,JSON.stringify(r.payload),now,now),...calendarSyncStatements({...r,id,schoolId,section})];})
  ]);
  return NextResponse.json({count:rows.length});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Импорт не выполнен. Данные не изменены.'},{status:400});}
}
