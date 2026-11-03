import {parseHomeLayout} from '../../school-design';
import {publicExperienceLayouts} from '../../experience-model';
import {mealIsVisible} from '../../menu-model';
import {fileMime} from '../../file-mime';
import {sectionEnabled} from '../../portal-navigation';
import {calendarSourceIsPublic} from '../../calendar-sync';
import {publicContent,Localizable} from '../../i18n';
import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import {migrateContentOrganization} from '../../content-organization';
import { migratePortalExamples } from '../../content-seed';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const schoolId = new URL(request.url).searchParams.get("schoolId") || "school-97";
  try {
    await migratePortalExamples();
    await migrateContentOrganization();
    const school = await env.DB.prepare("SELECT institution_type, id, name, short_name, city, address, phone, email, website, director, students_count, teachers_count, languages, primary_color, theme_key, home_layout, section_layouts FROM schools WHERE id=? AND status='active'").bind(schoolId).first();
    const items = await env.DB.prepare("SELECT (SELECT name FROM files WHERE id=content_items.file_id) file_name,(SELECT mime_type FROM files WHERE id=content_items.file_id) file_mime_type, id, section, title, description, publish_at, expires_at, file_id, payload, sort_order FROM content_items WHERE school_id=? AND status='published' AND visible=1 ORDER BY sort_order ASC, updated_at DESC").bind(schoolId).all();
    const now=Date.now();
    const current=school?items.results.filter(item=>mealIsVisible(school.section_layouts,item.section,JSON.parse(String(item.payload||'{}')))&&sectionEnabled(school.section_layouts,String(item.section),school.institution_type)&&(!item.publish_at||Date.parse(String(item.publish_at))<=now)&&(!item.expires_at||Date.parse(String(item.expires_at))>now)):[];
    const publicIds=new Set(current.map(i=>String(i.id)));
    const publicItems=current.filter(i=>calendarSourceIsPublic(JSON.parse(String(i.payload||'{}')),publicIds)).map(item=>publicContent({...item,file_mime_type:fileMime(item.file_mime_type,item.file_name),payload:JSON.parse(String(item.payload||'{}'))} as unknown as Localizable));
    return NextResponse.json({school:school?{...school,home_layout:parseHomeLayout(school.home_layout).filter(b=>sectionEnabled(school.section_layouts,b.section,school.institution_type)),section_layouts:publicExperienceLayouts(school.section_layouts,publicItems as any)}:null,items:publicItems},{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    console.error("public content failed", error);
    return NextResponse.json({ error: 'Не удалось загрузить данные школы' }, {status:503});
  }
}
