import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../access-policy';
import {profileError,type DisplayProfile,type DisplayDevice} from '../../display-model';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{const schoolId=new URL(request.url).searchParams.get('schoolId');if(!hasPermission(actor,'devices.read')||!canAccessSchool(actor,schoolId))return NextResponse.json({error:'Недостаточно прав'},{status:403});
 const [profiles,devices]=await Promise.all([env.DB.prepare('SELECT * FROM display_profiles WHERE school_id=? ORDER BY name').bind(schoolId).all(),env.DB.prepare('SELECT * FROM display_devices WHERE school_id=? ORDER BY name').bind(schoolId).all()]);
 return NextResponse.json({profiles:profiles.results.map(p=>{const legacy=JSON.parse(String(p.sections)) as string[];const sections=Array.from(new Set(legacy.map(s=>s==='links'?'feedback':s)));return{id:p.id,schoolId:p.school_id,name:p.name,sections,startSection:p.start_section==='links'?'feedback':p.start_section};}),devices:devices.results.map(d=>({id:d.id,schoolId:d.school_id,name:d.name,location:d.location,profileId:d.profile_id,enabled:Boolean(d.enabled)}))},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Не удалось загрузить устройства'},{status:503});}
}
export async function POST(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{
 const {kind,value}=await request.json() as {kind:string;value:DisplayProfile&DisplayDevice};
 if(!hasPermission(actor,'devices.manage')||!canAccessSchool(actor,value.schoolId))return NextResponse.json({error:'Недостаточно прав'},{status:403});
 if(!['profile','device'].includes(kind)||!value.schoolId)throw Error('Неверный запрос');
 if(!await env.DB.prepare('SELECT id FROM schools WHERE id=?').bind(value.schoolId).first())throw Error('Школа не найдена');
 const id=value.id||crypto.randomUUID(),now=new Date().toISOString();
 const table=kind==='profile'?'display_profiles':'display_devices';
 if(value.id&&!await env.DB.prepare(`SELECT id FROM ${table} WHERE id=? AND school_id=?`).bind(id,value.schoolId).first())throw Error('Запись не найдена в выбранной школе');
 if(kind==='profile'){
 const error=profileError(value);if(error)throw Error(error);
 await env.DB.prepare('INSERT INTO display_profiles (id,school_id,name,sections,start_section,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,sections=excluded.sections,start_section=excluded.start_section,updated_at=excluded.updated_at').bind(id,value.schoolId,value.name.trim(),JSON.stringify(value.sections),value.startSection,now).run();
 }else{
 if(!value.name?.trim()||value.name.length>120||String(value.location||'').length>200)throw Error('Укажите название устройства до 120 символов и локацию до 200 символов');
 if(!await env.DB.prepare('SELECT id FROM display_profiles WHERE id=? AND school_id=?').bind(value.profileId,value.schoolId).first())throw Error('Выберите профиль этой школы');
 await env.DB.prepare('INSERT INTO display_devices (id,school_id,name,location,profile_id,enabled,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,location=excluded.location,profile_id=excluded.profile_id,enabled=excluded.enabled,updated_at=excluded.updated_at').bind(id,value.schoolId,value.name.trim(),value.location||'',value.profileId,value.enabled?1:0,now).run();
 }
 return NextResponse.json({id});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Не удалось сохранить'},{status:400});}
}
export async function DELETE(request:NextRequest){
 const actor=await actorFromRequest(request);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 const q=new URL(request.url).searchParams,kind=q.get('kind'),id=q.get('id'),school=q.get('schoolId');
 if(!hasPermission(actor,'devices.manage')||!canAccessSchool(actor,school))return NextResponse.json({error:'Недостаточно прав'},{status:403});
 if(!['profile','device'].includes(kind||'')||!id||!school)return NextResponse.json({error:'Неверный запрос'},{status:400});
 try{
 if(kind==='profile'&&await env.DB.prepare('SELECT id FROM display_devices WHERE profile_id=? LIMIT 1').bind(id).first())return NextResponse.json({error:'Сначала назначьте устройствам другой профиль'},{status:409});
 await env.DB.prepare(`DELETE FROM ${kind==='profile'?'display_profiles':'display_devices'} WHERE id=? AND school_id=?`).bind(id,school).run();
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Не удалось удалить запись'},{status:503});}
}
