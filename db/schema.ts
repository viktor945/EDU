import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const appOperations = sqliteTable('app_operations', { id: text('id').primaryKey(), createdAt: text('created_at').notNull() });

export const translationCache = sqliteTable('translation_cache', {
 id:text('id').primaryKey(),schoolId:text('school_id').notNull().references(()=>schools.id,{onDelete:'cascade'}),translatedText:text('translated_text').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_translation_cache_school').on(t.schoolId)]);
export const translationUsage = sqliteTable('translation_usage', {
 id:text('id').primaryKey(),characters:integer('characters').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_translation_usage_date').on(t.createdAt)]);

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  institutionType: text("institution_type").notNull().default("school"),
  bin: text("bin").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  director: text("director").notNull().default(""),
  studentsCount: integer("students_count").notNull().default(0),
  teachersCount: integer("teachers_count").notNull().default(0),
  languages: text("languages").notNull().default("RU,KZ"),
  primaryColor: text("primary_color").notNull().default("#1e5a46"),
  themeKey: text("theme_key").notNull().default("warm"),
  homeLayout: text("home_layout").notNull().default("[]"),
  sectionLayouts: text("section_layouts").notNull().default("{}"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_schools_status").on(table.status)]);

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull(),
  position: text("position").notNull().default(""),
  permissions: text("permissions").notNull().default("[]"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("idx_members_email_school").on(table.email, table.schoolId),
  index("idx_members_school_id").on(table.schoolId),
  index("idx_members_role").on(table.role),
]);

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  section: text("section").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("draft"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  publishAt: text("publish_at"),
  expiresAt: text("expires_at"),
  fileId: text("file_id"),
  payload: text("payload").notNull().default("{}"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_content_school_section").on(table.schoolId, table.section),
  index("idx_content_publication").on(table.schoolId, table.status, table.visible),
]);

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("documents"),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  objectKey: text("object_key").notNull(),
  uploadedBy: text("uploaded_by").notNull().default("Владелец платформы"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_files_school_category").on(table.schoolId, table.category),
  uniqueIndex("idx_files_object_key").on(table.objectKey),
]);

export const displayProfiles = sqliteTable('display_profiles', {
 id:text('id').primaryKey(),schoolId:text('school_id').notNull().references(()=>schools.id,{onDelete:'cascade'}),name:text('name').notNull(),sections:text('sections').notNull(),startSection:text('start_section').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_display_profiles_school').on(t.schoolId)]);
export const displayDevices = sqliteTable('display_devices', {
 id:text('id').primaryKey(),schoolId:text('school_id').notNull().references(()=>schools.id,{onDelete:'cascade'}),name:text('name').notNull(),location:text('location').notNull().default(''),profileId:text('profile_id').notNull().references(()=>displayProfiles.id,{onDelete:'restrict'}),enabled:integer('enabled',{mode:'boolean'}).notNull().default(true),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_display_devices_school').on(t.schoolId),index('idx_display_devices_profile').on(t.profileId)]);
