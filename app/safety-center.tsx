'use client';
import {useState} from 'react';
import {ShieldCheck,LifeBuoy,CalendarDays,Bell} from 'lucide-react';
import {useLanguage} from './language-context';
import {useInstitutionText} from './institution-context';
import {RecordCard} from './record-details';
import {MonthCalendar} from './month-calendar';
import type {PublicItem} from './public-content';
import type {SectionLayout} from './school-design';
const categories=[['Безопасность',ShieldCheck],['Куда обратиться',LifeBuoy]] as const;
export function SafetyCenter({items,layout}:{items:PublicItem[];layout:SectionLayout}){
 const [active,setActive]=useState<string>('Безопасность');const [query,setQuery]=useState('');
 const {language}=useLanguage();const tr=useInstitutionText();
 const style=(id:string):React.CSSProperties=>{const b=layout.blocks.find(b=>b.id===id);return {display:b?.visible===false?'none':undefined,gridColumn:`span ${b?.span||12}`,gridRow:`span ${b?.height||1}`,minHeight:160+((b?.height||1)-1)*170,order:Math.max(0,layout.blocks.findIndex(b=>b.id===id))};};
 const rows=items.filter(i=>i.section==='safety'&&i.payload.kind===active || active==='Безопасность'&&i.section==='map'&&i.payload.kind==='План эвакуации').filter(i=>(i.title+' '+i.description).toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>active==='Важные объявления'?(['Срочный','Важный','Обычный'].indexOf(String(a.payload.priority||'Обычный'))-['Срочный','Важный','Обычный'].indexOf(String(b.payload.priority||'Обычный'))):String(a.payload.date||'').localeCompare(String(b.payload.date||'')));
 return <section className="safety-center public-section-layout"><div className="public-section-region" style={style("filters")}><nav className="safety-tabs" aria-label={tr('Подраздел',language)}>{categories.map(([name,Icon])=><button type="button" key={name} className={active===name?'is-active':''} aria-pressed={active===name} onClick={()=>{setActive(name);setQuery('');}}><Icon size={22}/><span>{tr(name,language)}</span><small>{items.filter(i=>i.section==='safety'&&i.payload.kind===name||name==='Безопасность'&&i.section==='map'&&i.payload.kind==='План эвакуации').length}</small></button>)}</nav>
 <label className="safety-search">{tr('Поиск',language)}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Название или описание',language)}/></label></div>
 <section className="public-section-region" style={style("content")}>{active==='Учебный календарь'?<MonthCalendar items={rows}/>:<><div className={`safety-records mode-${layout.mode}`} style={{'--safety-columns':layout.columns} as React.CSSProperties}>{rows.map(item=><div key={item.id} className={`safety-record priority-${item.payload.priority==='Срочный'?'urgent':'normal'}`}>{active==='Важные объявления'&&item.payload.priority&&<p className="safety-priority">{tr(String(item.payload.priority),language)}</p>}<RecordCard item={item} items={items}/></div>)}</div>
 {!rows.length&&<p className="section-empty-state">{tr('Пока нет опубликованных материалов',language)}</p>}</>}</section>
 {layout.blocks.filter(b=>b.id.startsWith("custom-")&&b.visible).map(b=><section key={b.id} className="public-section-region" style={style(b.id)}><h2>{b.title}</h2>{items.filter(i=>i.section===b.sourceSection&&(!b.recordIds?.length||b.recordIds.includes(i.id))).map(i=><RecordCard key={i.id} item={i} items={items}/>)}</section>)}
 </section>;
}
