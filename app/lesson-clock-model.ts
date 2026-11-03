import {days} from './content-model';
import type {PublicItem} from './public-content';
import type {Experience} from './experience-model';
const minute=(s:unknown)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s))?Number(String(s).slice(0,2))*60+Number(String(s).slice(3)):-1;
export function formatCountdown(secondsLeft:number){
 const seconds=Number.isFinite(secondsLeft)?Math.max(0,Math.floor(secondsLeft)):0;
 const minutes=Math.floor(seconds/60)%60;
 const parts=seconds>=3600?[Math.floor(seconds/3600),minutes,seconds%60]:[minutes,seconds%60];
 return parts.map(part=>String(part).padStart(2,'0')).join(':');
}
export function lessonState(items:PublicItem[],now:Date,settings:Experience,className=''){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:settings.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(k:string)=>parts.find(p=>p.type===k)?.value||'';
 const date=`${get('year')}-${get('month')}-${get('day')}`,day=days[(new Date(date+'T12:00:00Z').getUTCDay()+6)%7],seconds=Number(get('hour'))*3600+Number(get('minute'))*60+Number(get('second'));
 const all=items.filter(i=>i.section==='schedule'&&(!className||String(i.payload.className)===className)&&(i.payload.date?i.payload.date===date:i.payload.day===day)&&minute(i.payload.start)>=0&&minute(i.payload.end)>minute(i.payload.start)&&!(/отмен|cancel/i.test(String(i.payload.change||''))));
 const shifts=Array.from(new Set(all.map(i=>String(i.payload.shift||'1')))).sort();
 const shift=settings.shift!=='auto'?settings.shift:shifts.find(s=>all.some(i=>String(i.payload.shift||'1')===s&&minute(i.payload.start)*60<=seconds&&minute(i.payload.end)*60>seconds))||shifts.find(s=>all.some(i=>String(i.payload.shift||'1')===s&&minute(i.payload.end)*60>seconds))||shifts.at(-1)||'';
 const rows=all.filter(i=>String(i.payload.shift||'1')===shift).sort((a,b)=>minute(a.payload.start)-minute(b.payload.start));
 const current=rows.find(i=>minute(i.payload.start)*60<=seconds&&minute(i.payload.end)*60>seconds);
 const next=rows.find(i=>minute(i.payload.start)*60>seconds);
 const previous=rows.filter(i=>minute(i.payload.end)*60<=seconds).at(-1);
 const state=current?'lesson':next?(previous?'break':'before'):'finished';
 return {date,day,shift,hasSchedule:rows.length>0,current,next,previous,state,secondsLeft:current?minute(current.payload.end)*60-seconds:next?minute(next.payload.start)*60-seconds:0,time:`${get('hour')}:${get('minute')}:${get('second')}`};
}
