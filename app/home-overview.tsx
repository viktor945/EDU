'use client';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {useLanguage} from './language-context';
import {InstitutionProvider,institutionLabels,institutionText} from './institution-context';
import {sectionEnabled} from './portal-navigation';
import {parseHomeLayout} from './school-design';
import {RecordCard} from './record-details';
import type {PublicItem} from './public-content';
export function HomeOverview({school,items,href,onSelect,sections}:{school?:Record<string,unknown>|null;items:PublicItem[];href?:(path:string)=>string;onSelect?:(section:string)=>void;sections?:string[]}){
 const {language}=useLanguage();const type=school?.institution_type;const labels=institutionLabels(type,language);
 const blocks=parseHomeLayout(school?.home_layout).filter(b=>b.section!=='home'&&b.section!=='announcements'&&sectionEnabled(school?.section_layouts,b.section,type)&&(!sections||sections.includes(b.section)));
 return <InstitutionProvider type={type}><section className="custom-home-grid home-overview">{blocks.map(block=>{
 const rows=items.filter(i=>i.section===block.section&&!(i.section==='events'&&i.payload.kind==='Учебный календарь')).sort((a,b)=>block.section==='safety'?(['Срочный','Важный','Обычный'].indexOf(String(a.payload.priority||'Обычный'))-['Срочный','Важный','Обычный'].indexOf(String(b.payload.priority||'Обычный'))):block.section==='events'?String(b.payload.date||'').localeCompare(String(a.payload.date||'')):block.section==='news'?String(b.payload.date||'').localeCompare(String(a.payload.date||'')):0).slice(0,block.mode==='feature'?1:2);
 const title=institutionText(block.title||labels[block.section],type,language);const link=href?.(`/section/${block.section}`);
 return <section key={block.id} className={`home-overview-block overview-${block.mode}`} style={{gridColumn:`span ${block.span}`,minHeight:0}}>
 <header><h2>{title}</h2>{link?<Link href={link} aria-label={labels[block.section]}><ArrowUpRight size={22}/></Link>:<button type="button" onClick={()=>onSelect?.(block.section)} aria-label={labels[block.section]}><ArrowUpRight size={22}/></button>}</header>
 {block.imageId&&<img className="overview-cover" src={`/api/files/${encodeURIComponent(block.imageId)}`} alt=""/>}
 {block.mode==='button'?(link?<Link className="owner-secondary" href={link}>{labels[block.section]}</Link>:<button className="owner-secondary" onClick={()=>onSelect?.(block.section)}>{labels[block.section]}</button>):<div className="overview-items">{rows.map(item=><RecordCard key={item.id} item={item} items={items} compact/>)}{!rows.length&&<p className="section-empty-state">{institutionText('Пока нет опубликованных материалов',type,language)}</p>}</div>}
 </section>;
 })}</section></InstitutionProvider>;
}
