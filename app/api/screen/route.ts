import {parseHomeLayout} from '../../school-design';
import {migrateContentOrganization} from '../../content-organization';
import {publicExperienceLayouts} from '../../experience-model';
import {mealIsVisible} from '../../menu-model';
import {fileMime} from '../../file-mime';
import {sectionEnabled} from '../../portal-navigation';
import {calendarSourceIsPublic} from '../../calendar-sync';
import {publicContent,Localizable} from '../../i18n';
import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 try{
 const id=new URL(request.url).searchParams.get('id');
 const device=await env.DB.prepare("SELECT d.name,d.location,d.school_id,p.name profile_name,p.sections,p.start_section FROM display_devices d JOIN display_profiles p ON p.id=d.profile_id AND p.school_id=d.school_id JOIN schools s ON s.id=d.school_id WHERE d.id=? AND d.enabled=1 AND s.status='active'").bind(id).first();
 if(!device)return NextResponse.json({error:'Экран отключён или не найден'},{status:404,headers:{'Cache-Control':'no-store'}});
 await migrateContentOrganization();
 const school=await env.DB.prepare('SELECT institution_type,id,name,address,phone,email,website,director,theme_key,home_layout,section_layouts FROM schools WHERE id=?').bind(device.school_id).first();
 const legacySections=JSON.parse(String(device.sections)) as string[],sections=Array.from(new Set(legacySections.map(s=>s==='links'?'feedback':s))).filter(s=>s!=='announcements'&&sectionEnabled(school?.section_layouts,s,school?.institution_type)),now=Date.now();
 const rows=await env.DB.prepare("SELECT (SELECT name FROM files WHERE id=content_items.file_id) file_name,(SELECT mime_type FROM files WHERE id=content_items.file_id) file_mime_type,id,section,title,description,payload,file_id,publish_at,expires_at FROM content_items WHERE school_id=? AND status='published' AND visible=1 ORDER BY sort_order,updated_at DESC").bind(device.school_id).all();
 const publicIds=new Set(rows.results.filter(r=>mealIsVisible(school?.section_layouts,r.section,JSON.parse(String(r.payload||'{}')))&&sectionEnabled(school?.section_layouts,String(r.section),school?.institution_type)&&(!r.publish_at||Date.parse(String(r.publish_at))<=now)&&(!r.expires_at||Date.parse(String(r.expires_at))>now)).map(r=>String(r.id)));
 const items=rows.results.filter(r=>publicIds.has(String(r.id))&&(sections.includes(String(r.section))||r.section==='announcements'&&sections.includes('home')||sections.includes('feedback')&&r.section==='links')&&calendarSourceIsPublic(JSON.parse(String(r.payload)),publicIds)).map(r=>publicContent({...r,file_mime_type:fileMime(r.file_mime_type,r.file_name),payload:JSON.parse(String(r.payload))} as unknown as Localizable));
 return NextResponse.json({school:school?{...school,home_layout:parseHomeLayout(school.home_layout).filter(b=>sections.includes(b.section)),section_layouts:publicExperienceLayouts(school.section_layouts,items as any)}:null,device:{name:device.name,location:device.location},profile:{name:device.profile_name,sections,startSection:sections.includes(String(device.start_section))?device.start_section:sections[0]||'home'},items},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Не удалось обновить экран'},{status:503});}
}
