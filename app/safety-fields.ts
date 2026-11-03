import type {ContentField} from './content-model';
import {safetyKinds,calendarKind} from './calendar-model';
const f=(key:string,label:string,type='text',required=false):ContentField=>({key,label,type,required});
export function safetyFields(payload:Record<string,unknown>):ContentField[]{
 const kind=String(payload.kind||'Безопасность');
 const common:ContentField[]=[{key:'kind',label:'Подраздел',options:safetyKinds,required:true}];
 if(kind===calendarKind)return [f('date','Дата начала','date',true),f('endDate','Дата окончания периода','date'),f('start','Время начала','time'),f('end','Время окончания','time'),f('room','Место проведения'),f('contactName','Ответственный')];
 if(kind==='Куда обратиться')return [...common,f('contactName','ФИО специалиста / название службы'),f('position','Должность'),f('responsibilities','С какими вопросами обращаться','textarea'),f('room','Номер кабинета'),f('locationDetails','Этаж, корпус и как найти','textarea'),f('phone','Контактный телефон','tel'),f('email','Электронная почта','email'),f('workingHours','Часы приёма')];
 if(kind==='Важные объявления')return [{key:'priority',label:'Важность',options:['Обычный','Важный','Срочный']},f('contactName','Ответственный'),f('phone','Контактный телефон','tel')];
 return [...common,f('category','Категория памятки'),f('contactName','Ответственный за безопасность'),f('phone','Контактный телефон','tel')];
}
export function safetyText(kind:unknown){return kind==='Куда обратиться'?{title:'Название кабинета или службы',description:'О специалисте или кабинете',file:'Фото специалиста или кабинета'}:kind===calendarKind?{title:'Название события / периода',description:'Подробности, для кого и что подготовить',file:'Изображение события'}:kind==='Важные объявления'?{title:'Заголовок объявления',description:'Текст важного объявления',file:'Изображение объявления'}:{title:'Название памятки',description:'Инструкция и порядок действий',file:'Схема, памятка или документ'};}
