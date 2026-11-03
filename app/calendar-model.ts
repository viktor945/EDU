export const calendarKind='Учебный календарь';
export const safetyKinds=['Безопасность','Куда обратиться'];
export const institutionToday=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function validDay(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export type CalendarSource={id:string;schoolId:string;section:string;title:string;description:string;payload:Record<string,unknown>;fileId?:string|null};
export function calendarDates(source:CalendarSource,today=institutionToday()){
 const p=source.payload;
 if(p._calendarSourceId||['safety','events'].includes(source.section)&&p.kind===calendarKind)return [];
 const ranges:{key:string;date:string;endDate:string;label:string}[]=[];
 function add(key:string,start:unknown,end:unknown,label=''){if(validDay(start)&&(!end||validDay(end))){const finish=validDay(end)?end:start;if(finish>=today&&finish>=start)ranges.push({key,date:start,endDate:finish,label});}}
 // Publication dates, birthdays, graduation years and upload timestamps are not events.
 if(p.eventDate)add('event',p.eventDate,p.eventEndDate);
 else if(['events','opportunities','practice','families','achievements','menu','daily','schedule'].includes(source.section))add('event',p.date,p.endDate);
 if(p.deadline&&!ranges.some(r=>r.date===p.deadline&&r.endDate===p.deadline))add('deadline',p.deadline,null,'Срок подачи');
 return ranges;
}
export function calendarPayload(source:CalendarSource,date:ReturnType<typeof calendarDates>[number]){
 const p=source.payload;
 const fields={kind:calendarKind,date:date.date,endDate:date.endDate,start:date.key==='deadline'?'':String(p.start||''),end:date.key==='deadline'?'':String(p.end||''),room:String(p.room||''),_sourceLanguage:p._sourceLanguage||'RU',_calendarSourceId:source.id,_calendarSourceSection:source.section,_calendarDateKey:date.key};
 // Only reviewable public content is copied, never student or parent contact fields.
 const description=source.section==='students'?'':source.description;
 const title=date.label?`${source.title} · ${date.label}`:source.title;
 return {title,description,fields:{...fields,_calendarSignature:JSON.stringify([title,description,source.fileId||null,fields])}};
}
export function calendarDays(month:string){const [year,m]=month.split('-').map(Number),first=new Date(Date.UTC(year,m-1,1)),offset=(first.getUTCDay()+6)%7;return Array.from({length:42},(_,i)=>new Date(Date.UTC(year,m-1,1-offset+i)).toISOString().slice(0,10));}
export function coversDay(payload:Record<string,unknown>,day:string){return validDay(payload.date)&&String(payload.date)<=day&&String(payload.endDate||payload.date)>=day;}
