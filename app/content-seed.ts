import { env } from 'cloudflare:workers';
import records from './legacy-content.json';
export async function migratePortalExamples() {
 if (!await env.DB.prepare('SELECT id FROM schools WHERE id=?').bind('school-97').first()) return;
 const now=new Date().toISOString();
 const key='portal-examples-v1';
 if (!await env.DB.prepare('SELECT id FROM app_operations WHERE id=?').bind(key).first()) await env.DB.batch([
   ...records.map(r=>env.DB.prepare("INSERT OR IGNORE INTO content_items (id,school_id,section,title,description,status,visible,payload,sort_order,created_at,updated_at) SELECT ?,?,?,?,?, 'published',1,?,0,?,? WHERE NOT EXISTS (SELECT 1 FROM app_operations WHERE id=?)")
    .bind(r.id,'school-97',r.section,r.title,r.description,JSON.stringify(r.payload),now,now,key)),
   env.DB.prepare('INSERT OR IGNORE INTO app_operations (id,created_at) VALUES (?,?)').bind(key,now)
  ]);
 const teacherKey='portal-teachers-v1';
 if (await env.DB.prepare('SELECT id FROM app_operations WHERE id=?').bind(teacherKey).first()) return;
 const teachers=[
  {id:'teacher-omarova',title:'А. Б. Омарова',description:'Преподаватель математики',payload:{position:'Учитель математики',subjects:'Алгебра, Геометрия, Математика',classes:'7А, 7Б, 8А',education:'Высшее педагогическое',experience:'12 лет',email:'a.omarova@school97.edu.kz'}},
  {id:'teacher-sadykova',title:'М. К. Садыкова',description:'Преподаватель казахского языка и литературы',payload:{position:'Учитель казахского языка',subjects:'Казахский язык, Казахская литература',classes:'7А, 7Б, 9А',education:'Высшее педагогическое',experience:'9 лет',email:'m.sadykova@school97.edu.kz'}},
  {id:'teacher-ibrayev',title:'Д. С. Ибраев',description:'Куратор школьной лаборатории робототехники',payload:{position:'Учитель информатики',subjects:'Информатика, Робототехника',classes:'6–11 классы',education:'Высшее техническое',experience:'8 лет',email:'d.ibrayev@school97.edu.kz',officeHours:'Среда, 15:00–16:00'}},
  {id:'teacher-aitbayeva',title:'Л. Н. Айтбаева',description:'Преподаватель истории',payload:{position:'Учитель истории',subjects:'История Казахстана, Всемирная история',classes:'7–11 классы',education:'Высшее педагогическое',experience:'15 лет'}},
  {id:'teacher-kassymov',title:'Е. Р. Касымов',description:'Преподаватель физики',payload:{position:'Учитель физики',subjects:'Физика',classes:'7–11 классы',education:'Высшее педагогическое',experience:'11 лет'}},
  {id:'teacher-serikov',title:'Н. Т. Сериков',description:'Тренер школьной сборной',payload:{position:'Учитель физической культуры',subjects:'Физическая культура, Волейбол',classes:'1–11 классы',education:'Высшее спортивное',experience:'10 лет'}},
 ];
 await env.DB.batch([
  ...teachers.map(t=>env.DB.prepare("INSERT OR IGNORE INTO content_items (id,school_id,section,title,description,status,visible,payload,sort_order,created_at,updated_at) VALUES (?,?, 'teachers',?,?,'published',1,?,0,?,?)").bind(t.id,'school-97',t.title,t.description,JSON.stringify(t.payload),now,now)),
  env.DB.prepare('INSERT OR IGNORE INTO app_operations (id,created_at) VALUES (?,?)').bind(teacherKey,now)
 ]);
}
