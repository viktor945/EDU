import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../../access-policy';
import {fileMime} from '../../../file-mime';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 const {schoolId,cursor}=await request.json() as {schoolId:string;cursor?:string};
 if(!hasPermission(actor,'files.manage')||!canAccessSchool(actor,schoolId))return NextResponse.json({error:'Недостаточно прав'},{status:403});
 if(!schoolId||!await env.DB.prepare('SELECT id FROM schools WHERE id=?').bind(schoolId).first())return NextResponse.json({error:'Учреждение не найдено'},{status:404});
 try{
  const objects=await env.BUCKET.list({prefix:schoolId+'/',limit:500,cursor,include:['httpMetadata']});
  const existing=await env.DB.prepare('SELECT id FROM files WHERE school_id=?').bind(schoolId).all();const ids=new Set(existing.results.map(r=>String(r.id)));
  const missing=objects.objects.flatMap(object=>{const parts=object.key.slice(schoolId.length+1).split('/');const match=parts[1]?.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(.+)$/i);if(parts.length!==2||!match||ids.has(match[1]))return [];return [{object,id:match[1],name:match[2],category:parts[0]}];});
  if(missing.length)await env.DB.batch(missing.map(({object,id,name,category})=>env.DB.prepare('INSERT OR IGNORE INTO files (id,school_id,name,category,mime_type,size,object_key,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,schoolId,name,category,fileMime(object.httpMetadata?.contentType,name),object.size,object.key,'Восстановленная загрузка',object.uploaded.toISOString())));
  return NextResponse.json({recovered:missing.length,cursor:objects.truncated?objects.cursor:null});
 }catch(error){console.error('File recovery failed',error);return NextResponse.json({error:'Не удалось проверить ранее загруженные файлы'},{status:503});}
}
