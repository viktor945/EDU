import {migrateContentOrganization} from '../../content-organization';
import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../access-policy';
import {calendarSyncStatements} from '../../calendar-sync';
export async function POST(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{const {schoolId}=await request.json() as {schoolId:string};
  if(!canAccessSchool(actor,schoolId)||!hasPermission(actor,'content.edit'))return NextResponse.json({error:'Недостаточно прав'},{status:403});
  await migrateContentOrganization();
  const rows=await env.DB.prepare('SELECT id,section,title,description,payload,file_id FROM content_items WHERE school_id=?').bind(schoolId).all();
  for(const row of rows.results){const payload=JSON.parse(String(row.payload));if(payload._calendarSourceId)continue;const statements=calendarSyncStatements({id:String(row.id),schoolId,section:String(row.section),title:String(row.title),description:String(row.description),payload,fileId:row.file_id?String(row.file_id):null});if(statements.length)await env.DB.batch(statements);}
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Не удалось проверить даты. Повторите попытку.'},{status:500});}
}
