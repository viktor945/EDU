'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {usePortalData} from './portal-data';
import {useLanguage} from './language-context';
const messages:Record<string,[string,string]>={
 'Подготовка офлайн-показа…':['Офлайн көрсету дайындалуда…','Preparing offline display…'],
 'Сохранённая версия · подключаемся':['Сақталған нұсқа · қосылуда','Saved version · connecting'],
 'Офлайн · сохранённая версия':['Офлайн · сақталған нұсқа','Offline · saved version'],
 'Не удалось полностью сохранить офлайн-копию. Повторяем загрузку…':['Офлайн көшірме толық сақталмады. Қайта жүктелуде…','Offline copy is incomplete. Retrying…']
};
export function OfflineStatus(){
 const path=usePathname(),{status}=usePortalData(),{language}=useLanguage();
 const enabled=path==='/'||path==='/student'||path.startsWith('/section/');
 useEffect(()=>{if(!enabled)return;function navigation(event:MouseEvent){if(navigator.onLine||event.defaultPrevented||event.button!==0)return;const anchor=(event.target as Element)?.closest('a');if(!anchor)return;const url=new URL(anchor.href,location.href);if(url.origin!==location.origin||!(url.pathname==='/'||url.pathname==='/student'||url.pathname.startsWith('/section/')))return;event.preventDefault();event.stopPropagation();location.assign(url.href);}document.addEventListener('click',navigation,true);return()=>document.removeEventListener('click',navigation,true);},[enabled]);
 if(!enabled||!messages[status])return null;
 return <aside className="portal-offline-status" role="status">{language==='RU'?status:messages[status][language==='KZ'?0:1]}</aside>;
}
