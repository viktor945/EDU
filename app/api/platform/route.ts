import {validateExperience} from '../../experience-validation';
import {institutionType,institutionTypes} from '../../institutions';
import {calendarSyncStatements,asCalendarSource} from '../../calendar-sync';
import {validateTranslations} from '../../translation-validation';
import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { actorFromRequest, canAccessSchool, hasPermission, normalizeRole, roleLabels } from "../../access-policy";
import {migrateContentOrganization} from '../../content-organization';
import { migratePortalExamples } from '../../content-seed';
import { validateContent } from '../../content-model';

export const dynamic = "force-dynamic";

type Entity = "school" | "member" | "content";

function rowToSchool(row: Record<string, unknown>) {
  return {
    institutionType: institutionType(row.institution_type), id: row.id, name: row.name, shortName: row.short_name, bin: row.bin, city: row.city,
    address: row.address, phone: row.phone, email: row.email, website: row.website,
    director: row.director, studentsCount: row.students_count, teachersCount: row.teachers_count,
    languages: String(row.languages ?? "RU,KZ").split(",").filter(Boolean), primaryColor: row.primary_color,
    themeKey: row.theme_key || 'warm', homeLayout: JSON.parse(String(row.home_layout || '[]')), sectionLayouts: JSON.parse(String(row.section_layouts || '{}')),
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function rowToMember(row: Record<string, unknown>) {
  return {
    id: row.id, schoolId: row.school_id, fullName: row.full_name, email: row.email,
    phone: row.phone, role: normalizeRole(row.role), position: row.position,
    permissions: JSON.parse(String(row.permissions ?? "[]")), status: row.status,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function rowToContent(row: Record<string, unknown>) {
  return {
    id: row.id, schoolId: row.school_id, section: row.section, title: row.title,
    description: row.description, status: row.status, visible: Boolean(row.visible),
    publishAt: row.publish_at, expiresAt: row.expires_at, fileId: row.file_id,
    payload: JSON.parse(String(row.payload ?? "{}")), sortOrder: row.sort_order,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function rowToFile(row: Record<string, unknown>) {
  return {
    id: row.id, schoolId: row.school_id, name: row.name, category: row.category,
    mimeType: row.mime_type, size: row.size, uploadedBy: row.uploaded_by, createdAt: row.created_at,
    url: `/api/files/${row.id}`,
  };
}

async function seedIfEmpty() {
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM schools").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const now = new Date().toISOString();
  const schoolId = "school-97";
  await env.DB.batch([
    env.DB.prepare("INSERT INTO schools (id, name, short_name, bin, city, address, phone, email, website, director, students_count, teachers_count, languages, primary_color, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(schoolId, "Школа-гимназия №97", "№97", "990240001234", "Алматы", "ул. Толе би, 189", "+7 727 000 00 97", "info@school97.edu.kz", "school97.edu.kz", "Сауле Ермековна Абдрахманова", 1248, 86, "RU,KZ,EN", "#1e5a46", "active", now, now),
    env.DB.prepare("INSERT INTO members (id, school_id, full_name, email, phone, role, position, permissions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind("member-owner", null, "Администратор STEPLine", "productstep.dep@gmail.com", "", "platform_owner", "Владелец платформы", "[\"*\"]", "active", now, now),
    env.DB.prepare("INSERT INTO members (id, school_id, full_name, email, phone, role, position, permissions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind("member-director", schoolId, "Сауле Ермековна Абдрахманова", "director@school97.edu.kz", "+7 701 000 00 97", "school_head", "Директор", "[\"content.*\",\"members.read\",\"files.*\"]", "active", now, now),
    env.DB.prepare("INSERT INTO content_items (id, school_id, section, title, description, status, visible, publish_at, expires_at, file_id, payload, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind("content-welcome", schoolId, "home", "Добро пожаловать в цифровой центр школы", "Всё важное о школьной жизни — в одном месте", "published", 1, now, null, null, "{}", 0, now, now),
    env.DB.prepare("INSERT INTO content_items (id, school_id, section, title, description, status, visible, publish_at, expires_at, file_id, payload, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind("content-event", schoolId, "events", "День открытых дверей", "Встреча с педагогами и экскурсия по школе · 14 сентября, 10:00", "published", 1, now, null, null, "{}", 0, now, now),
  ]);
}

export async function GET(request: NextRequest) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  try {
    if (actor.isOwner) await seedIfEmpty();
    await migratePortalExamples();
    await migrateContentOrganization();
    const schoolWhere = actor.isOwner ? "" : " WHERE id=?";
    const childWhere = actor.isOwner ? "" : " WHERE school_id=?";
    const schoolQuery = env.DB.prepare(`SELECT * FROM schools${schoolWhere} ORDER BY created_at DESC`);
    const memberQuery = env.DB.prepare(`SELECT * FROM members${actor.isOwner ? "" : " WHERE school_id=? OR id=?"} ORDER BY created_at DESC`);
    const contentQuery = env.DB.prepare(`SELECT * FROM content_items${childWhere} ORDER BY updated_at DESC`);
    const fileQuery = env.DB.prepare(`SELECT * FROM files${childWhere} ORDER BY created_at DESC`);
    const [schools, members, content, files] = await Promise.all([
      actor.isOwner ? schoolQuery.all() : schoolQuery.bind(actor.schoolId).all(),
      actor.isOwner ? memberQuery.all() : memberQuery.bind(actor.schoolId, actor.id).all(),
      actor.isOwner ? contentQuery.all() : contentQuery.bind(actor.schoolId).all(),
      actor.isOwner ? fileQuery.all() : fileQuery.bind(actor.schoolId).all(),
    ]);
    return NextResponse.json({
      schools: schools.results.map((row) => rowToSchool(row as Record<string, unknown>)),
      members: members.results.map((row) => rowToMember(row as Record<string, unknown>)),
      content: content.results.map((row) => rowToContent(row as Record<string, unknown>)),
      files: files.results.map((row) => rowToFile(row as Record<string, unknown>)),
    });
  } catch (error) {
    console.error("platform bootstrap failed", error);
    return NextResponse.json({ error: "Хранилище платформы временно недоступно" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const body = await request.json() as { entity: Entity; data: Record<string, unknown> };
  const data = body.data ?? {};
  if(body.entity==='school' && data.institutionType!==undefined&&!institutionTypes.includes(data.institutionType as never))return NextResponse.json({error:'Выберите тип учреждения'},{status:400});
  if (body.entity === "school" && !actor.isOwner) return NextResponse.json({ error: "Создавать школы может только владелец платформы" }, { status: 403 });
  if (body.entity === "member" && !actor.isOwner && (data.role === "platform_owner" || data.role === "distributor_admin" || !Array.isArray(data.permissions) || data.permissions.some(p => typeof p !== "string" || p === "*" || p.startsWith("platform.") || !hasPermission(actor, p)))) return NextResponse.json({ error: "Нельзя назначать права выше собственных" }, { status: 403 });
  if (!['school','member','content'].includes(body.entity)) return NextResponse.json({error:'Неизвестный тип записи'},{status:400});
  const permission = body.entity === "school" ? "platform.schools" : body.entity === "member" ? "members.manage" : "content.edit";
  if (!hasPermission(actor, permission) || (body.entity !== "school" && !canAccessSchool(actor, data.schoolId))) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  if (body.entity==='content' && data.status==='published' && !hasPermission(actor,'content.publish')) return NextResponse.json({error:'Нет права публикации'},{status:403});
  if (body.entity==='content') {const translationError=await validateTranslations(data);if(translationError)return NextResponse.json({error:translationError},{status:400});const ownerSchool=await env.DB.prepare('SELECT institution_type FROM schools WHERE id=?').bind(data.schoolId).first();const issues=validateContent(String(data.section||''),String(data.title||''),(data.payload||{}) as Record<string,unknown>,ownerSchool?.institution_type);if(issues.length)return NextResponse.json({error:issues.join('; ')},{status:400});}
  if (body.entity === "member") {
    data.role = normalizeRole(data.role);
    if (!Object.hasOwn(roleLabels, String(data.role))) return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  }
  const id = String(data.id ?? crypto.randomUUID());
  if(body.entity==='school'){const error=await validateExperience(data.sectionLayouts,id);if(error)return NextResponse.json({error},{status:400});}
  const now = new Date().toISOString();
  try {
    if (body.entity === "school") {
      await env.DB.prepare("INSERT INTO schools (id, name, short_name, bin, city, address, phone, email, website, director, students_count, teachers_count, languages, primary_color, theme_key, home_layout, section_layouts, institution_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, data.name, data.shortName || data.name, data.bin || "", data.city || "", data.address || "", data.phone || "", data.email || "", data.website || "", data.director || "", Number(data.studentsCount || 0), Number(data.teachersCount || 0), Array.isArray(data.languages) ? data.languages.join(",") : "RU,KZ", data.primaryColor || "#1e5a46", data.themeKey || 'warm', JSON.stringify(data.homeLayout || []), JSON.stringify(data.sectionLayouts || {}), institutionType(data.institutionType), data.status || "active", now, now).run();
    } else if (body.entity === "member") {
      await env.DB.prepare("INSERT INTO members (id, school_id, full_name, email, phone, role, position, permissions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, data.schoolId || null, data.fullName, String(data.email || "").trim().toLowerCase(), data.phone || "", data.role || "teacher", data.position || "", JSON.stringify(data.permissions || []), data.status || "invited", now, now).run();
    } else {
      await env.DB.batch([env.DB.prepare("INSERT INTO content_items (id, school_id, section, title, description, status, visible, publish_at, expires_at, file_id, payload, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, data.schoolId, data.section, data.title, data.description || "", data.status || "draft", data.status === "published" ? 1 : data.visible ? 1 : 0, data.publishAt || null, data.expiresAt || null, data.fileId || null, JSON.stringify(data.payload || {}), Number(data.sortOrder || 0), now, now),...calendarSyncStatements(asCalendarSource(data,id))]);
    }
    return NextResponse.json({ ok: true, id, createdAt: now, updatedAt: now });
  } catch (error) {
    console.error("platform create failed", error);
    return NextResponse.json({ error: "Не удалось сохранить запись" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const body = await request.json() as { entity: Entity; id: string; data: Record<string, unknown> };
  const data = body.data ?? {};
  if(body.entity==='school' && data.institutionType!==undefined&&!institutionTypes.includes(data.institutionType as never))return NextResponse.json({error:'Выберите тип учреждения'},{status:400});
  if (!['school','member','content'].includes(body.entity)) return NextResponse.json({error:'Неизвестный тип записи'},{status:400});
  const permission = body.entity === "school" ? "school.settings" : body.entity === "member" ? "members.manage" : "content.edit";
  const schoolId = body.entity === "school" ? body.id : data.schoolId;
  if (!actor.isOwner && body.entity !== "school") {
    const table = body.entity === "member" ? "members" : "content_items";
    const existing = await env.DB.prepare(`SELECT school_id FROM ${table} WHERE id=?`).bind(body.id).first<{school_id: string}>();
    if (!existing || !canAccessSchool(actor, existing.school_id) || existing.school_id !== data.schoolId) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    if (body.entity === "member" && (data.role === "platform_owner" || data.role === "distributor_admin" || !Array.isArray(data.permissions) || data.permissions.some(p => typeof p !== "string" || p === "*" || p.startsWith("platform.") || !hasPermission(actor, p)))) return NextResponse.json({ error: "Нельзя назначать права выше собственных" }, { status: 403 });
  }
  if (!hasPermission(actor, permission) || !canAccessSchool(actor, schoolId)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  if (body.entity==='content' && data.status==='published' && !hasPermission(actor,'content.publish')) return NextResponse.json({error:'Нет права публикации'},{status:403});
  if (body.entity==='content') {const translationError=await validateTranslations(data);if(translationError)return NextResponse.json({error:translationError},{status:400});const ownerSchool=await env.DB.prepare('SELECT institution_type FROM schools WHERE id=?').bind(data.schoolId).first();const issues=validateContent(String(data.section||''),String(data.title||''),(data.payload||{}) as Record<string,unknown>,ownerSchool?.institution_type);if(issues.length)return NextResponse.json({error:issues.join('; ')},{status:400});}
  if (body.entity === "member") {
    data.role = normalizeRole(data.role);
    if (!Object.hasOwn(roleLabels, String(data.role))) return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  }
  if(body.entity==='school'){const error=await validateExperience(data.sectionLayouts,String(body.id));if(error)return NextResponse.json({error},{status:400});}
  const now = new Date().toISOString();
  try {
    if (body.entity === "school") {
      if(data.institutionType===undefined){const previous=await env.DB.prepare("SELECT institution_type FROM schools WHERE id=?").bind(body.id).first();data.institutionType=previous?.institution_type;}
      await env.DB.prepare("UPDATE schools SET name=?, short_name=?, bin=?, city=?, address=?, phone=?, email=?, website=?, director=?, students_count=?, teachers_count=?, languages=?, primary_color=?, theme_key=?, home_layout=?, section_layouts=?, institution_type=?, status=?, updated_at=? WHERE id=?")
        .bind(data.name, data.shortName || data.name, data.bin || "", data.city || "", data.address || "", data.phone || "", data.email || "", data.website || "", data.director || "", Number(data.studentsCount || 0), Number(data.teachersCount || 0), Array.isArray(data.languages) ? data.languages.join(",") : "RU,KZ", data.primaryColor || "#1e5a46", data.themeKey || 'warm', JSON.stringify(data.homeLayout || []), JSON.stringify(data.sectionLayouts || {}), institutionType(data.institutionType), data.status || "active", now, body.id).run();
    } else if (body.entity === "member") {
      await env.DB.prepare("UPDATE members SET school_id=?, full_name=?, email=?, phone=?, role=?, position=?, permissions=?, status=?, updated_at=? WHERE id=?")
        .bind(data.schoolId || null, data.fullName, String(data.email || "").trim().toLowerCase(), data.phone || "", data.role || "teacher", data.position || "", JSON.stringify(data.permissions || []), data.status || "invited", now, body.id).run();
    } else {
      await env.DB.batch([env.DB.prepare("UPDATE content_items SET school_id=?, section=?, title=?, description=?, status=?, visible=?, publish_at=?, expires_at=?, file_id=?, payload=?, sort_order=?, updated_at=? WHERE id=?")
        .bind(data.schoolId, data.section, data.title, data.description || "", data.status || "draft", data.status === "published" ? 1 : data.visible ? 1 : 0, data.publishAt || null, data.expiresAt || null, data.fileId || null, JSON.stringify(data.payload || {}), Number(data.sortOrder || 0), now, body.id),...calendarSyncStatements(asCalendarSource(data,body.id))]);
    }
    return NextResponse.json({ ok: true, updatedAt: now });
  } catch (error) {
    console.error("platform update failed", error);
    return NextResponse.json({ error: "Не удалось обновить запись" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity") as Entity | null;
  const id = searchParams.get("id");
  if (!entity || !id) return NextResponse.json({ error: "Не указана запись" }, { status: 400 });
  const table = entity === "school" ? "schools" : entity === "member" ? "members" : "content_items";
  try {
    const row = await env.DB.prepare(`SELECT ${entity === "school" ? "id AS school_id" : "school_id"} FROM ${table} WHERE id=?`).bind(id).first<Record<string, unknown>>();
    const permission = entity === "school" ? "platform.schools" : entity === "member" ? "members.manage" : "content.edit";
    if (!row || !hasPermission(actor, permission) || !canAccessSchool(actor, row.school_id)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    if(entity==='content')await env.DB.batch([env.DB.prepare(`DELETE FROM content_items WHERE school_id=? AND section='events' AND json_extract(payload,'$._calendarSourceId')=?`).bind(row.school_id,id),env.DB.prepare('DELETE FROM content_items WHERE id=?').bind(id)]);
    else await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("platform delete failed", error);
    return NextResponse.json({ error: "Не удалось удалить запись" }, { status: 500 });
  }
}
