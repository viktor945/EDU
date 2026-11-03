import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../access-policy';
import {validateContent} from '../../content-model';
export async function POST(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{
  const {schoolId,ids,status}=await request.json() as {schoolId:string;ids:string[];status:string};
  if(!canAccessSchool(actor,schoolId)||!hasPermission(actor,'content.edit')||status==='published'&&!hasPermission(actor,'content.publish'))return NextResponse.json({error:'Недостаточно прав для изменения статуса публикации'},{status:403});
  if(!['draft','review','published'].includes(status)||!Array.isArray(ids)||!ids.length||ids.length>300||ids.some(id=>typeof id!=='string'))throw Error('Выберите от 1 до 300 материалов и статус');
  const selected=Array.from(new Set(ids));
  const rows:{results:Record<string,unknown>[]}={results:[]};
  for(let offset=0;offset<selected.length;offset+=80){const chunk=selected.slice(offset,offset+80);const found=await env.DB.prepare(`SELECT id,section,title,payload FROM content_items WHERE school_id=? AND id IN (${chunk.map(()=>'?').join(',')})`).bind(schoolId,...chunk).all();rows.results.push(...found.results);}
  if(rows.results.length!==selected.length)throw Error('Некоторые материалы удалены или принадлежат другой школе');
  const school=await env.DB.prepare('SELECT institution_type FROM schools WHERE id=?').bind(schoolId).first();
  if(status==='published')for(const row of rows.results){const errors=validateContent(String(row.section),String(row.title),JSON.parse(String(row.payload)),school?.institution_type);if(errors.length)throw Error(`${row.title}: ${errors.join('; ')}`);}
  const now=new Date().toISOString();
  await env.DB.batch(selected.map(id=>env.DB.prepare('UPDATE content_items SET status=?,visible=?,updated_at=? WHERE id=? AND school_id=?').bind(status,status==='published'?1:0,now,id,schoolId)));
  return NextResponse.json({count:selected.length});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Статусы не изменены'},{status:400});}
}
