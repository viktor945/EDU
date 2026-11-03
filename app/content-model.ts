import {institutionType,profileField,allowedSections} from './institutions';
import {safetyFields} from './safety-fields';
import {calendarKind,validDay} from './calendar-model';
export type ContentField = { key: string; label: string; type?: string; required?: boolean; options?: string[] };
export const days = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const f = (key: string,label: string,type='text',required=false,options?: string[]): ContentField => ({key,label,type,required,options});
export const sectionFields: Record<string, ContentField[]> = {
 safety: [f('kind','Подраздел','text',true,['Безопасность','Куда обратиться']),f('date','Дата начала','date'),f('endDate','Дата окончания','date'),f('priority','Приоритет','text',false,['Обычный','Важный','Срочный']),f('contactName','Ответственный'),f('phone','Телефон','tel'),f('room','Кабинет'),f('workingHours','Часы работы')],
 daily:[f('start','Начало','time',true),f('end','Окончание','time'),f('className','Группа'),f('days','Дни')],
 families:[f('category','Тема','text',false,['Адаптация','Что принести','Мероприятия','Памятка']),f('className','Группа'),f('date','Дата','date')],
 opportunities:[f('category','Направление','text',true,['Олимпиада','Конкурс','Профориентация']),f('date','Дата','date'),f('deadline','Срок подачи','date'),f('className','Классы'),f('contactName','Ответственный')],
 programs:[f('faculty','Факультет / отделение'),f('code','Код программы'),f('qualification','Квалификация'),f('duration','Срок обучения'),f('contactName','Ответственный'),f('phone','Телефон','tel')],
 practice:[f('kind','Тип','text',true,['Практика','Стажировка','Вакансия','Встреча с работодателем']),f('organization','Организация'),f('specialization','Специальность'),f('date','Дата начала','date'),f('deadline','Срок подачи','date'),f('contactName','Куратор'),f('phone','Телефон','tel')],
 research:[f('kind','Тип','text',true,['Научный проект','Конференция','Грант','Академическая мобильность']),f('faculty','Факультет'),f('organization','Организация'),f('deadline','Срок подачи','date'),f('contactName','Ответственный')],
 announcements:[f('priority','Важность','text',false,['Обычный','Важный','Срочный']),f('contactName','Ответственный'),f('phone','Контактный телефон','tel'),f('className','Класс / группа')],
 home: [],
 schedule: [f('className','Класс','text',true),f('day','День недели','text',true,days),f('shift','Смена','text',true,['1','2','3']),f('lessonNumber','Номер урока','number',true),f('start','Начало','time',true),f('end','Окончание','time',true),f('teacher','Преподаватель','teacher',true),f('room','Кабинет','text',true),f('group','Группа'),f('change','Замена или отмена')],
 events: [f('date','Дата','date',true),f('start','Начало','time',true),f('room','Место','text',true),f('audience','Для кого')],
 clubs: [f('category','Направление','text',true),f('className','Классы / возраст','text',true),f('teacher','Руководитель','directory',true),f('days','Дни занятий'),f('start','Начало','time'),f('room','Кабинет'),f('places','Свободные места','number'),f('enrollment','Статус набора','text',false,['Набор открыт','Набор завершён']),f('methodology','Методика обучения','textarea')],
 menu: [f('day','День недели','text',true,days),f('date','Дата','date'),f('meal','Тип питания','text',true),f('kcal','Калорийность, ккал','number'),f('weight','Выход, г','number'),f('price','Цена, ₸','number'),f('allergens','Аллергены'),f('mealTime','Время приёма пищи','time')],
 achievements: [f('person','Ученик / команда'),f('className','Класс'),f('category','Категория'),f('award','Награда'),f('date','Дата','date')],
 map: [f('kind','Тип записи','text',true,['Кабинет','План эвакуации']),f('floor','Этаж','number',true),f('room','Кабинет / зона'),f('subject','Предмет / назначение'),f('teacher','Преподаватель'),f('building','Корпус')],
 news: [f('date','Дата','date',true),f('category','Категория')],
 about: [f('category','Подраздел')], documents: [f('category','Категория'),f('year','Учебный год')],
 students: [f('className','Класс','text',true),f('stage','Ступень обучения','text',false,['Начальная школа','Средняя школа','Старшая школа']),f('classTeacher','Классный руководитель','directory'),f('studentPhone','Телефон ученика','tel'),f('parent1Name','ФИО первого родителя'),f('parent1Phone','Телефон первого родителя','tel'),f('parent1Public','Показывать первого родителя на портале','checkbox'),f('parent2Name','ФИО второго родителя'),f('parent2Phone','Телефон второго родителя','tel'),f('parent2Public','Показывать второго родителя на портале','checkbox'),f('gender','Пол','text',false,['Мальчик','Девочка']),f('shift','Смена','text',false,['1','2','3']),f('birthDate','Дата рождения','date')],
 teachers: [f('position','Должность','text',true),f('subjects','Преподаваемые предметы','text',true),f('classes','Классы','text',true),f('education','Образование'),f('experience','Стаж'),f('email','Электронная почта','email'),f('phone','Телефон'),f('officeHours','Рабочие часы'),f('room','Кабинет классного руководителя'),f('institution','Учебное заведение'),f('graduationYear','Год окончания','number'),f('specialization','Специализация'),f('qualification','Квалификационная категория'),f('homeroomClass','Классное руководство'),f('teachingLanguages','Языки преподавания'),f('schoolExperience','Стаж в этой школе'),f('birthDate','Дата рождения','date')],
 feedback: [f('url','Адрес ссылки','url',true)],
};
export const sectionLabels: Record<string,string> = {announcements:'Важные объявления',safety:'Безопасность и помощь',daily:'Режим дня',families:'Родителям',opportunities:'Олимпиады и профориентация',programs:'Специальности',practice:'Практика и карьера',research:'Наука и мобильность',home:'Главная',schedule:'Расписание',events:'События',clubs:'Кружки',menu:'Меню',achievements:'Достижения',map:'Карта школы',news:'Новости',about:'О школе',documents:'Документы',students:'Ученики',teachers:'Преподаватели',feedback:'Обратная связь'};
export const permissionLabels: Record<string,string> = {'*':'Полный доступ','content.*':'Всё управление контентом','content.read':'Просмотр контента','content.edit':'Создание и редактирование контента','content.publish':'Публикация контента','members.read':'Просмотр сотрудников','members.manage':'Управление сотрудниками и правами','files.*':'Всё управление файлами','files.read':'Просмотр файлов','files.manage':'Загрузка и удаление файлов','devices.read':'Просмотр устройств','devices.manage':'Управление устройствами','school.settings':'Настройки школы'};
export const permissionLabel = (key: string) => permissionLabels[key] || 'Дополнительное разрешение';
export function fieldsFor(section:string,type:unknown='school'):ContentField[]{
 const base=(sectionFields[section]||[]).map(f=>({...f,...profileField(section,f.key,type)})).filter(f=>!f.hidden);
 const t=institutionType(type);
 if(['college','university'].includes(t)&&['students','teachers','schedule'].includes(section))base.push({key:'specialty',label:t==='university'?'Образовательная программа':'Специальность',type:'text'});
 if(t==='university'&&['students','teachers','schedule'].includes(section))base.push({key:'faculty',label:'Факультет',type:'text'},{key:'department',label:'Кафедра',type:'text'});
 return base;
}
export function recordFields(section:string,payload:Record<string,unknown>,type:unknown='school'):ContentField[]{return section==='safety'||section==='events'&&payload.kind===calendarKind?safetyFields(payload):fieldsFor(section,type);}
export function validateContent(section: string,title: string,payload: Record<string,unknown>,type:unknown='school'): string[] {
 if (!allowedSections(type).includes(section))return ['Этот раздел недоступен для выбранного типа учреждения'];
 if (!Object.hasOwn(sectionFields,section)) return ['Неизвестный раздел'];
 const errors: string[] = title.trim() ? [] : ['Заполните название'];
 if(section==='safety'&&!['Безопасность','Куда обратиться'].includes(String(payload.kind)))errors.push('Выберите подраздел безопасности или помощи. Календарь находится в событиях, объявления — на главной.');
 for (const field of recordFields(section,payload,type)) {
  const value = String(payload[field.key] ?? '').trim();
  if (!value) { if (field.required) errors.push(`Заполните «${field.label}»`); continue; }
  if (field.type==='checkbox' && typeof payload[field.key]!=='boolean') errors.push(`«${field.label}»: нужно логическое значение`);
  if (field.options && !field.options.includes(value)) errors.push(`«${field.label}»: выберите ${field.options.join(', ')}`);
  if (field.key==='birthDate' && value>new Date().toISOString().slice(0,10)) errors.push('Дата рождения не может быть в будущем');
  if (field.type==='number' && (!Number.isFinite(Number(value)) || Number(value)<0)) errors.push(`«${field.label}»: нужно неотрицательное число`);
  if (field.type==='time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) errors.push(`«${field.label}»: формат ЧЧ:ММ`);
  if (field.type==='date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) errors.push(`«${field.label}»: формат ГГГГ-ММ-ДД`);
  if (field.type==='url' && !/^https?:\/\//i.test(value)) errors.push(`«${field.label}»: адрес должен начинаться с https:// или http://`);
 }
 for(const key of ['eventDate','eventEndDate','endDate'])if(payload[key]&&!validDay(payload[key]))errors.push('Дата события должна быть в формате ГГГГ-ММ-ДД');
 if(payload.eventEndDate&&!payload.eventDate)errors.push('Укажите дату начала события');
 if(payload.eventDate&&payload.eventEndDate&&String(payload.eventEndDate)<String(payload.eventDate))errors.push('Окончание события не может быть раньше начала');
 if(payload.date&&payload.endDate&&String(payload.endDate)<String(payload.date))errors.push('Дата окончания должна быть не раньше даты начала');
 if (['schedule','daily'].includes(section) && payload.start && payload.end && String(payload.start)>=String(payload.end)) errors.push('Окончание занятия должно быть позже начала');
 return errors;
}
