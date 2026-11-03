"use client";
import {SYNC_INTERVAL,readOffline,saveOffline,forgetOffline} from '../../offline-cache';
import {LessonClock} from '../../lesson-clock';
import {HomeStage} from '../../home-stage';
import {StandbyPlayer} from '../../standby-player';
import {experienceFor} from '../../experience-model';
import {useInactivity} from '../../portal-experience';
import {Details,DetailDialog} from '../../record-details';
import {InstitutionProvider} from '../../institution-context';
import {HomeAnnouncements} from '../../home-announcements';
import {HomeOverview} from '../../home-overview';
import {institutionLabels} from '../../institution-context';
import {useLanguage} from '../../language-context';
import {sectionNames,localize} from '../../i18n';
import {useEffect,useState,useRef} from 'react';
import {MonitorSmartphone} from 'lucide-react';
import {PublicRecords,type PublicItem} from '../../public-content';
import {sectionLabels} from '../../content-model';
import {schoolThemeClass} from '../../school-design';
type ScreenData={school:{id:string;name:string;address:string;phone:string;email:string;theme_key?:string;institution_type?:string;home_layout?:unknown;section_layouts?:unknown};device:{name:string;location:string};profile:{name:string;sections:string[];startSection:string};items:PublicItem[]};
export default function ScreenPlayer({id}:{id:string}){
 const {language}=useLanguage();
 const [data,setData]=useState<ScreenData|null>(null),[section,setSection]=useState(''),[error,setError]=useState('');const profileKey=useRef('');
 useEffect(()=>{let live=true,running=false,received=false;const controller=new AbortController(),endpoint=`/api/screen?id=${encodeURIComponent(id)}`;
  function apply(next:ScreenData){const key=JSON.stringify(next.profile),changed=profileKey.current!==key;setSection(current=>changed||!next.profile.sections.includes(current)?next.profile.startSection:current);profileKey.current=key;setData(next);}
  void readOffline<ScreenData>(endpoint).then(saved=>{if(live&&saved&&!received){apply(saved.data);setError(navigator.onLine?'':'Офлайн · сохранённая версия');}});
  async function refresh(){if(running)return;running=true;try{const response=await fetch(endpoint,{credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok){if(response.status===404){received=true;await forgetOffline(endpoint);if(live)setData(null);}throw Error(response.status===404?'Экран отключён или не найден':'Офлайн · сохранённая версия');}const next=await response.json() as ScreenData;if(!live)return;received=true;apply(next);setError('Подготовка офлайн-показа…');try{await saveOffline(endpoint,next,controller.signal);if(live)setError('');}catch{if(live)setError('Офлайн-копия ещё не готова. Повторяем загрузку…');}}catch(e){if(live)setError(e instanceof Error?e.message:'Ошибка связи');}finally{running=false;}}
  const offline=()=>setError('Офлайн · сохранённая версия');void refresh();const interval=setInterval(refresh,SYNC_INTERVAL);window.addEventListener('online',refresh);window.addEventListener('offline',offline);return()=>{live=false;controller.abort();clearInterval(interval);window.removeEventListener('online',refresh);window.removeEventListener('offline',offline);};},[id]);
 const settings=experienceFor(data?.school.section_layouts),[selectedId,setSelectedId]=useState('');const activity=useInactivity({enabled:!!data,returnSeconds:settings.returnSeconds,idleSeconds:settings.idleSeconds,idleEnabled:settings.idleEnabled,onReturn:()=>{setSection(data?.profile.sections.includes('home')?'home':data?.profile.startSection||'home');setSelectedId('');document.dispatchEvent(new Event('portal-reset'));}});
 const selected=data?.items.find(i=>i.id===selectedId);
 const labels=institutionLabels(data?.school.institution_type,language);
 if(!data)return <main className="screen-unavailable"><MonitorSmartphone size={48}/><h1>{error||'Загрузка экрана…'}</h1><p>Настройки экрана управляются в кабинете школы.</p></main>;
 return <main className={`school-shell ${schoolThemeClass(data.school.theme_key)}`}><aside className="school-sidebar"><div className="brand-lockup"><span className="brand-copy"><strong>STEPLine</strong><em>EDU</em></span></div><div className="school-name"><p>{data.school.name}</p></div><nav className="sidebar-nav">{data.profile.sections.map(s=><button key={s} className={`nav-item ${s===section?'is-active':''}`} onClick={()=>setSection(s)}>{labels[s]}</button>)}</nav><p>{data.device.name}</p><small>{data.device.location}</small></aside><section className="portal-content"><header className="section-page-hero section-tone-green screen-hero-with-clock"><div><p className="eyebrow">{data.school.name}</p><h1>{labels[section]}</h1></div>{section!=='home'&&settings.clockEnabled&&<LessonClock compact items={data.items.map(i=>localize(i,language))} settings={settings} institutionType={data.school.institution_type}/>}</header>{error&&<p role="status">{error}</p>}{activity.idle&&<StandbyPlayer items={data.items.map(i=>localize(i,language))} settings={settings} school={data.school} onClose={activity.dismiss}/ >}{selected&&!activity.idle&&<InstitutionProvider type={data.school.institution_type}><DetailDialog title={localize(selected,language).title} onClose={()=>setSelectedId('')}><Details item={localize(selected,language)} items={data.items.map(i=>localize(i,language))}/></DetailDialog></InstitutionProvider>}{section==='home'&&<HomeStage school={data.school} items={data.items.map(i=>localize(i,language))} onSelect={(s,id)=>{setSection(s);setSelectedId(id||'');}}/>}{section==='home'&&<HomeAnnouncements items={data.items.map(i=>localize(i,language))}/>}{section==='home'&&<HomeOverview school={data.school} items={data.items.map(i=>localize(i,language))} sections={data.profile.sections} onSelect={setSection}/>}{section==='about'&&<article className="record-card"><h2>{data.school.name}</h2><p>{data.school.address}</p><p>{data.school.phone} · {data.school.email}</p></article>}{section!=='home'&&<PublicRecords key={section} section={section} items={data.items.map(i=>localize(i,language))} school={data.school}/>}</section></main>;
}
