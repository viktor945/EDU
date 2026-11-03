'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {usePortalData} from './portal-data';
import {experienceFor} from './experience-model';
import {StandbyPlayer} from './standby-player';
import {useLanguage} from './language-context';
import {localize} from './i18n';
import {DetailDialog,Details} from './record-details';
import {InstitutionProvider} from './institution-context';
export function useInactivity({enabled,returnSeconds,idleSeconds,idleEnabled,onReturn}:{enabled:boolean;returnSeconds:number;idleSeconds:number;idleEnabled:boolean;onReturn:()=>void}){
 const last=useRef(0),returned=useRef(false),callback=useRef(onReturn),[idle,setIdle]=useState(false);callback.current=onReturn;
 useEffect(()=>{if(!enabled){setIdle(false);return;}last.current=Date.now();returned.current=false;
 const activity=()=>{last.current=Date.now();returned.current=false;setIdle(false);};
 const types=['pointerdown','pointermove','keydown','wheel','touchstart'];types.forEach(t=>window.addEventListener(t,activity,{capture:true,passive:true}));
 const timer=setInterval(()=>{const seconds=(Date.now()-last.current)/1000;if(seconds>=returnSeconds&&!returned.current){returned.current=true;callback.current();}if(idleEnabled&&seconds>=idleSeconds)setIdle(true);},500);
 return()=>{clearInterval(timer);types.forEach(t=>window.removeEventListener(t,activity,true));};
 },[enabled,returnSeconds,idleSeconds,idleEnabled]);
 return {idle,dismiss:()=>{last.current=Date.now();returned.current=false;setIdle(false);}};
}
export function PortalExperience(){
 const data=usePortalData(),path=usePathname(),params=useSearchParams(),router=useRouter(),{language}=useLanguage();const settings=experienceFor(data.school?.section_layouts);
 const enabled=!!data.school&&(path==='/'||path.startsWith('/section/'));const activity=useInactivity({enabled,returnSeconds:settings.returnSeconds,idleSeconds:settings.idleSeconds,idleEnabled:settings.idleEnabled,onReturn:()=>{document.dispatchEvent(new Event('portal-reset'));if(path!=='/'||params.has('recordId')){router.replace(`/?schoolId=${encodeURIComponent(data.schoolId)}&lang=${language}`);}}});
 const item=data.items.find(i=>i.id===params.get('recordId'));
 const close=()=>{const next=new URLSearchParams(params.toString());next.delete('recordId');router.replace(`${path}?${next}`);};
 return <InstitutionProvider type={data.school?.institution_type}>{enabled&&activity.idle&&<StandbyPlayer items={data.items.map(i=>localize(i,language))} settings={settings} school={data.school} onClose={activity.dismiss}/ >}{enabled&&item&&!activity.idle&&<DetailDialog title={localize(item,language).title} className={`detail-section-${item.section}`} onClose={close}><Details item={localize(item,language)} items={data.items.map(i=>localize(i,language))}/></DetailDialog>}</InstitutionProvider>;
}
