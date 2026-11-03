'use client';
import {Localized} from './admin-locale';
import {calendarKind} from '../calendar-model';
const naturallyDated=['events','opportunities','practice','families','achievements','menu'];
export function EventDateFields({section,payload,onChange}:{section:string;payload:Record<string,unknown>;onChange:(p:Record<string,unknown>)=>void}){
 if(['safety','events'].includes(section)&&payload.kind===calendarKind)return null;
 const native=naturallyDated.includes(section)&&!payload.eventDate;
 const startKey=native?'date':'eventDate',endKey=native?'endDate':'eventEndDate';
 return <Localized as="fieldset" className="wide event-date-fields"><Localized as="legend">Дата события для учебного календаря</Localized><Localized as="p">Укажите, когда проходит мероприятие, а не когда создана карточка. Предстоящая дата поступит в календарь на согласование.</Localized><Localized as="div">
 {native?<Localized as="label">Дата мероприятия<Localized as="output">{String(payload.date||'Укажите дату в поле выше')}</Localized></Localized>:<Localized as="label">Дата начала<Localized as="input" type="date" value={String(payload[startKey]||'')} onChange={e=>onChange({...payload,[startKey]:e.target.value})}/></Localized>}
 <Localized as="label">Окончание периода (необязательно)<Localized as="input" type="date" min={String(payload[startKey]||'')} value={String(payload[endKey]||'')} onChange={e=>onChange({...payload,[endKey]:e.target.value})}/></Localized>
 </Localized></Localized>;
}
