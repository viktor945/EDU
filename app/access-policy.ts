import { env } from "cloudflare:workers";

const ownerEmail = "productstep.dep@gmail.com";

export const roleLabels: Record<string, string> = {
  platform_owner: "Владелец платформы",
  distributor_admin: "Администратор дистрибьютора",
  school_head: "Руководитель школы",
  content_editor: "Контент-редактор",
  teacher: "Учитель",
};

export function normalizeRole(role: unknown): string {
  return role === "deputy" || role === "director" ? "school_head" : String(role || "teacher");
}

export function isPlatformOwner(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ownerEmail;
}

export type AdminActor = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  schoolId: string | null;
  permissions: string[];
  isOwner: boolean;
};

export async function findAdminActor(email: string | null | undefined): Promise<AdminActor | null> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;
  if (isPlatformOwner(normalizedEmail)) {
    return { id: "platform-owner", email: normalizedEmail, fullName: "Владелец STEPLine", role: "platform_owner", schoolId: null, permissions: ["*"], isOwner: true };
  }
  try {
    const row = await env.DB.prepare("SELECT id, school_id, full_name, email, role, permissions, status FROM members WHERE lower(email)=? AND status IN ('active','invited') LIMIT 1")
      .bind(normalizedEmail).first<Record<string, unknown>>();
    if (!row) return null;
    if (row.status === "invited") {
      await env.DB.prepare("UPDATE members SET status='active', updated_at=? WHERE id=?")
        .bind(new Date().toISOString(), row.id).run();
    }
    return {
      id: String(row.id), email: String(row.email), fullName: String(row.full_name),
      role: normalizeRole(row.role), schoolId: row.school_id ? String(row.school_id) : null,
      permissions: JSON.parse(String(row.permissions || "[]")), isOwner: false,
    };
  } catch (error) {
    console.error("admin actor lookup failed", error);
    return null;
  }
}

export async function actorFromRequest(request: { headers: Headers }): Promise<AdminActor | null> {
  return findAdminActor(request.headers.get("oai-authenticated-user-email"));
}

export function hasPermission(actor: AdminActor, permission: string): boolean {
  if (permission.startsWith("platform.")) return actor.isOwner;
  if (actor.isOwner || actor.permissions.includes("*")) return true;
  if (actor.role === 'school_head' && permission === 'school.settings') return true;
  return actor.permissions.includes(permission) || actor.permissions.includes(`${permission.split(".")[0]}.*`);
}

export function canAccessSchool(actor: AdminActor, schoolId: unknown): boolean {
  return actor.isOwner || (!!actor.schoolId && actor.schoolId === String(schoolId || ""));
}

// Legacy owner-only guard for endpoints that have not yet been opened to school roles.
export function canManage(request: { headers: Headers }): boolean {
  return isPlatformOwner(request.headers.get("oai-authenticated-user-email"));
}
