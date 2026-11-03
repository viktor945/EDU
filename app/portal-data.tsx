'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import type {PublicItem} from './public-content';
import {SYNC_INTERVAL,readOffline,saveOffline} from './offline-cache';
type Data={school:Record<string,unknown>|null;items:PublicItem[]};
const Context=createContext<Data&{schoolId:string;ready:boolean;status:string}>({school:null,items:[],schoolId:'',ready:false,status:'Загрузка данных…'});
export function PortalDataProvider({children}:{children:React.ReactNode}){
 const pathname=usePathname(),params=useSearchParams();
 const schoolId=params.get('schoolId')||'school-97';
 const enabled=pathname==='/'||pathname.startsWith('/section/')||pathname==='/student';
 const [snapshot,setSnapshot]=useState<{id:string;data:Data}|null>(null);
 const [status,setStatus]=useState('Загрузка данных…');
 useEffect(()=>{
  if(!enabled)return;
  let active=true,sequence=0,running=false,received=false;const controller=new AbortController();
  const endpoint=`/api/public?schoolId=${encodeURIComponent(schoolId)}`;
  void readOffline<Data>(endpoint).then(saved=>{if(active&&saved&&!received){setSnapshot({id:schoolId,data:saved.data});setStatus('Сохранённая версия · подключаемся');}});
  async function refresh(){if(running)return;running=true;const request=++sequence;try{
   const response=await fetch(endpoint,{credentials:'omit',cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error();const data=await response.json() as Data;
   if(active&&request===sequence){received=true;setSnapshot({id:schoolId,data});setStatus(data.school?'Подготовка офлайн-показа…':'Учреждение недоступно');}
   await saveOffline(endpoint,data,controller.signal);
   if(active&&data.school)setStatus('Офлайн-копия готова · синхронизация каждые 4 минуты');
  }catch{if(active)setStatus(received&&navigator.onLine?'Не удалось полностью сохранить офлайн-копию. Повторяем загрузку…':'Офлайн · сохранённая версия');}finally{running=false;}}
  const channel=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('stepline-content');
  channel?.addEventListener('message',refresh);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);
  const disconnected=()=>{if(active)setStatus('Офлайн · сохранённая версия');};window.addEventListener('offline',disconnected);
  void refresh();const timer=setInterval(refresh,SYNC_INTERVAL);
  return()=>{active=false;controller.abort();clearInterval(timer);channel?.close();window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);window.removeEventListener('offline',disconnected);};
 },[enabled,schoolId]);
 const matched=snapshot?.id===schoolId;
 return <Context.Provider value={{school:matched?snapshot.data.school:null,items:matched?snapshot.data.items:[],schoolId,ready:matched,status}}>{children}</Context.Provider>;
}
export const usePortalData=()=>useContext(Context);
