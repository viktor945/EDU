'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import QRCode from 'qrcode';
import {experienceFor,type Experience} from './experience-model';
import {resolvedHomeBanners} from './banner-model';
import {LessonClock} from './lesson-clock';
import {DetailDialog,Details} from './record-details';
import {InstitutionProvider} from './institution-context';
import {useLanguage} from './language-context';
import {et} from './experience-text';
import type {PublicItem} from './public-content';
export function StudentQR({schoolId}:{schoolId:string}){
 const {language}=useLanguage(),[code,setCode]=useState('');
 useEffect(()=>{let active=true;QRCode.toDataURL(`${location.origin}/student?schoolId=${encodeURIComponent(schoolId)}&lang=${language}`,{width:300,margin:2,errorCorrectionLevel:'M'}).then(c=>{if(active)setCode(c);});return()=>{active=false;};},[schoolId,language]);
 return <section className="student-qr"><div>{code&&<img src={code} alt="QR"/>}</div><span><strong>{et('Портал на телефоне',language)}</strong><small>{et('Отсканируйте и выберите свой класс',language)}</small></span></section>;
}
export function HomeStage({school,items,onSelect}:{school:Record<string,unknown>;items:PublicItem[];onSelect?:(section:string,id?:string)=>void}){
 const settings=experienceFor(school.section_layouts),banners=resolvedHomeBanners(items,settings),[index,setIndex]=useState(0),[open,setOpen]=useState(false),[detail,setDetail]=useState<PublicItem|null>(null),router=useRouter(),{language}=useLanguage(),banner=banners[index%Math.max(1,banners.length)];
 useEffect(()=>{if(!banner||open||detail)return;const timer=setTimeout(()=>setIndex(i=>i+1),banner.seconds*1000);return()=>clearTimeout(timer);},[index,banner?.seconds,banners.length,open,detail]);
 const image=banner?.imageId?`/api/files/${encodeURIComponent(banner.imageId)}`:`/banner-assets/${banner?.art||'discovery'}.webp`;
 const click=()=>{const item=items.find(i=>i.id===banner?.targetId);if(item){if(['home','announcements'].includes(item.section)){setDetail(item);return;}if(onSelect)onSelect(item.section,item.id);else router.push(`/section/${item.section}?schoolId=${encodeURIComponent(String(school.id))}&lang=${language}&recordId=${encodeURIComponent(item.id)}`);}else setOpen(true);};
 return <>{detail&&<InstitutionProvider type={school.institution_type}><DetailDialog title={detail.title} onClose={()=>setDetail(null)}><Details item={detail} items={items}/></DetailDialog></InstitutionProvider>}<section className="home-stage"><div className="home-banner-area">{banner&&<button key={banner.id} className="home-banner" onClick={click}><img src={image} alt=""/><div><span>STEPLine EDU</span><h2>{et(banner.title,language)}</h2><p>{et(banner.text,language).slice(0,180)}</p></div></button>}{banners.length>1&&<div className="banner-dots">{banners.map((b,i)=><button key={b.id} aria-label={b.title} aria-pressed={i===index%banners.length} onClick={()=>setIndex(i)}/>)}</div>}</div><div className="home-stage-right">{settings.clockEnabled&&<LessonClock items={items} settings={settings} institutionType={school.institution_type}/ >}{settings.qrEnabled&&!!school.id&&<StudentQR schoolId={String(school.id)}/>}</div></section>{open&&banner&&<DetailDialog title={et(banner.title,language)} onClose={()=>setOpen(false)}><img className="banner-detail-image" src={image} alt={banner.title}/><p className="detail-description">{et(banner.text,language)}</p></DetailDialog>}</>;
}
