import {parseHomeLayout} from '../../../school-design';
import {experienceFileIds,publicExperienceLayouts} from '../../../experience-model';
import {sectionEnabled} from '../../../portal-navigation';
import {fileMime} from '../../../file-mime';
import {publicContent,variants,Localizable} from '../../../i18n';
import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { actorFromRequest, canAccessSchool, hasPermission } from "../../../access-policy";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const actor = await actorFromRequest(_request);
  const ownedFile = actor ? await env.DB.prepare("SELECT school_id FROM files WHERE id=?").bind(id).first<{school_id:string}>() : null;
  if (!actor || !ownedFile || !hasPermission(actor, "files.read") || !canAccessSchool(actor, ownedFile.school_id)) {
    const candidates=await env.DB.prepare("SELECT c.section,c.title,c.description,c.payload,c.file_id FROM content_items c JOIN schools s ON s.id=c.school_id JOIN files f ON f.school_id=c.school_id WHERE f.id=? AND c.status='published' AND c.visible=1 AND s.status='active' AND (c.publish_at IS NULL OR julianday(c.publish_at)<=julianday('now')) AND (c.expires_at IS NULL OR julianday(c.expires_at)>julianday('now'))").bind(id).all();
    let allowed=candidates.results.some(row=>{if(row.file_id===id)return true;const c=publicContent({...row,payload:JSON.parse(String(row.payload))} as unknown as Localizable);if(Array.isArray(c.payload.galleryIds)&&c.payload.galleryIds.includes(id))return true;return Object.values(variants(c)).some(v=>v?.fileId===id);});
    if(!allowed){const school=await env.DB.prepare("SELECT s.id,s.institution_type,s.section_layouts,s.home_layout FROM schools s JOIN files f ON f.school_id=s.id WHERE f.id=? AND s.status='active'").bind(id).first();if(school){const records=await env.DB.prepare("SELECT id,section,payload FROM content_items WHERE school_id=? AND status='published' AND visible=1 AND (publish_at IS NULL OR julianday(publish_at)<=julianday('now')) AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))").bind(school.id).all();const publicRecords=records.results.filter(r=>sectionEnabled(school.section_layouts,String(r.section),school.institution_type)).map(r=>({...r,payload:JSON.parse(String(r.payload))}));allowed=experienceFileIds(publicExperienceLayouts(school.section_layouts,publicRecords as any)).includes(id)||parseHomeLayout(school.home_layout).some(b=>b.imageId===id&&sectionEnabled(school.section_layouts,b.section,school.institution_type));}}
    if (!allowed) return new NextResponse("Файл не найден", { status: 404 });
  }
  const record = await env.DB.prepare("SELECT name, mime_type, object_key FROM files WHERE id=?").bind(id).first<{ name: string; mime_type: string; object_key: string }>();
  if (!record) return new NextResponse("Файл не найден", { status: 404 });
  const object = await env.BUCKET.get(record.object_key);
  if (!object) return new NextResponse("Файл не найден", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  const mime=fileMime(record.mime_type,record.name);
  headers.set("Content-Type", mime);
  const safeInline = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "application/pdf"].includes(mime);
  headers.set("Content-Disposition", `${safeInline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(record.name)}`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "sandbox");
  headers.set("Cache-Control", "private, no-store");
  headers.set("ETag", object.httpEtag);
  return new NextResponse(object.body, { headers });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const { id } = await context.params;
  const record = await env.DB.prepare("SELECT object_key, school_id FROM files WHERE id=?").bind(id).first<{ object_key: string; school_id: string }>();
  if (!record) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  if (!hasPermission(actor, "files.manage") || !canAccessSchool(actor, record.school_id)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  await env.BUCKET.delete(record.object_key);
  await env.DB.prepare("DELETE FROM files WHERE id=?").bind(id).run();
  return NextResponse.json({ ok: true });
}
