import {fileMime} from "../../file-mime";
import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { actorFromRequest, canAccessSchool, hasPermission } from "../../access-policy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const actor = await actorFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const schoolId = String(form.get("schoolId") ?? "");
    const category = String(form.get("category") ?? "documents");
    if (!(file instanceof File) || !schoolId) return NextResponse.json({ error: "Выберите файл и школу" }, { status: 400 });
    if (!hasPermission(actor, "files.manage") || !canAccessSchool(actor, schoolId)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Максимальный размер файла — 25 МБ" }, { status: 413 });
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, "-");
    const objectKey = `${schoolId}/${category}/${id}-${safeName}`;
    const now = new Date().toISOString();
    await env.BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: fileMime(file.type,file.name) } });
    await env.DB.prepare("INSERT INTO files (id, school_id, name, category, mime_type, size, object_key, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, schoolId, file.name, category, fileMime(file.type,file.name), file.size, objectKey, request.headers.get("oai-authenticated-user-email") || "Владелец платформы", now).run();
    return NextResponse.json({ id, schoolId, name: file.name, category, mimeType: fileMime(file.type,file.name), size: file.size, createdAt: now, url: `/api/files/${id}` });
  } catch (error) {
    console.error("file upload failed", error);
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 });
  }
}
