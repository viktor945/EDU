'use client';
import {memo,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createTickerMotion} from './ticker-motion';
import {createPortal} from 'react-dom';
import {useLanguage} from './language-context';
import {et} from './experience-text';
import {eligibleStandby,readingSeconds,textPages,type Experience} from './experience-model';
import {institutionLabels} from './institution-context';
import type {PublicItem} from './public-content';
export const Ticker=memo(function Ticker({text,speed}:{text:string;speed:number}){
 const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 const root=useRef<HTMLDivElement>(null),rail=useRef<HTMLDivElement>(null),copy=useRef<HTMLDivElement>(null),unit=useRef<HTMLSpanElement>(null),[repeat,setRepeat]=useState(1);
 const speedRef=useRef(speed),measureRef=useRef<()=>void>(()=>{});speedRef.current=speed;
 useLayoutEffect(()=>{
  const container=root.current,track=rail.current,first=copy.current,node=unit.current;
  if(!container||!track||!first||!node)return;
  const motion=createTickerMotion(track);let frame=0,active=true;
  const measure=()=>{
   frame=0;if(!active)return;
   const width=node.getBoundingClientRect().width;if(width<=0)return;
   const count=Math.max(1,Math.ceil(container.clientWidth/width));
   setRepeat(current=>current===count?current:count);
   motion.update(first.getBoundingClientRect().width,speedRef.current);
  };
  const schedule=()=>{if(active&&!frame)frame=requestAnimationFrame(measure);};measureRef.current=schedule;
  const observer=new ResizeObserver(schedule);observer.observe(container);observer.observe(node);observer.observe(first);
  measure();void document.fonts?.ready.then(schedule);
  return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();motion.destroy();measureRef.current=()=>{};};
 },[text]);
 useLayoutEffect(()=>{measureRef.current();},[speed,repeat]);
 return lines.length?<div className="standby-ticker continuous-ticker" ref={root} aria-label={lines.join(' ')}><div className="ticker-rail" ref={rail} aria-hidden="true">{[0,1].map(index=><div key={index} className="ticker-copy" ref={index===0?copy:undefined}>{Array.from({length:repeat},(_,r)=><span className="ticker-unit" key={r} ref={index===0&&r===0?unit:undefined}>{lines.map((line,i)=><span className="ticker-message" key={i}>{line}</span>)}</span>)}</div>)}</div></div>:null;
});
export function StandbyPlayer({items,settings,school,onClose,preview=false}:{items:PublicItem[];settings:Experience;school?:Record<string,unknown>|null;onClose:()=>void;preview?:boolean}){
 const {language}=useLanguage(),[index,setIndex]=useState(0),[page,setPage]=useState(0),[pageSize,setPageSize]=useState(450);const paragraph=useRef<HTMLParagraphElement>(null);const rows=eligibleStandby(items,settings),item=rows[index%Math.max(1,rows.length)],selection=settings.selections.find(s=>s.id===item?.id);
 const text=(selection?.text||item?.description||'').slice(0,270);const chunks=textPages(text,pageSize);
 const images=Array.from(new Set([...(selection?.imageIds||[]),...(item?.file_id&&item.file_mime_type?.startsWith('image/')?[item.file_id]:[]),...(Array.isArray(item?.payload.galleryIds)?item.payload.galleryIds:[])])).slice(0,10);
 const seconds=Math.max(selection?.seconds||20,readingSeconds(text),chunks.length*7,images.length*5);
 useEffect(()=>{const node=paragraph.current;if(!node)return;const measure=()=>{const style=getComputedStyle(node),font=Number.parseFloat(style.fontSize)||16,line=Number.parseFloat(style.lineHeight)||font*1.6;setPageSize(Math.max(60,Math.min(750,Math.floor(node.clientWidth/(font*.6)*Math.max(1,node.clientHeight/line-1)*.75))));};const observer=new ResizeObserver(measure);observer.observe(node);measure();return()=>observer.disconnect();},[item?.id]);
 useEffect(()=>{setPage(0);const timer=setTimeout(()=>setIndex(i=>i+1),seconds*1000);return()=>clearTimeout(timer);},[item?.id,seconds,index]);
 useEffect(()=>{const timer=setInterval(()=>setPage(p=>p+1),Math.max(5000,seconds*1000/Math.max(chunks.length,images.length,1)));return()=>clearInterval(timer);},[item?.id,seconds,chunks.length,images.length]);
 useEffect(()=>{const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;};},[]);
 const image=images[page%Math.max(1,images.length)],imageSrc=image?`/api/files/${encodeURIComponent(image)}`:'/banner-assets/discovery.webp',labels=institutionLabels(school?.institution_type,language);
 return createPortal(<section className={`standby-overlay ${preview?'standby-preview':''}`} role="dialog" aria-modal="true" aria-label={et('Режим ожидания',language)} onClick={preview?undefined:onClose}><header><strong>{String(school?.name||'STEPLine EDU')}</strong>{preview?<button className="owner-secondary" type="button" onClick={onClose}>{et('Закрыть предпросмотр',language)}</button>:<span>{et('Коснитесь экрана, чтобы продолжить',language)}</span>}</header>{item?<article key={item.id} className="standby-feature"><div className="standby-art"><img className="standby-glow" src={imageSrc} alt=""/><img className="standby-image" key={imageSrc} src={imageSrc} alt={item.title}/></div><div className="standby-copy"><span className="eyebrow">{labels[item.section]}</span><h1>{item.title}</h1><p ref={paragraph}>{chunks[page%chunks.length]}</p><div className="standby-pages">{rows.map((r,i)=><i key={r.id} className={i===index%rows.length?'is-current':''}/>)}</div></div><div key={`${item.id}-${index}`} className="standby-progress" style={{animationDuration:`${seconds}s`}}/></article>:<article className="standby-empty"><img src="/banner-assets/discovery.webp" alt=""/><h1>{String(school?.name||'STEPLine EDU')}</h1>{preview&&<p>{et('Выбранных опубликованных карточек пока нет',language)}</p>}</article>}<Ticker text={settings.ticker} speed={settings.tickerSpeed}/></section>,document.body);
}
