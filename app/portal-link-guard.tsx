'use client';
import {useEffect} from 'react';
// This confines links exposed by the portal. OS kiosk restrictions are configured on the device.
export function PortalLinkGuard(){
 useEffect(()=>{
  const isPortal=()=>location.pathname==='/'||location.pathname.startsWith('/section/')||location.pathname.startsWith('/screen/');
  const guard=(event:MouseEvent)=>{
   if(!isPortal())return;
   const target=event.target instanceof Element?event.target.closest('a'):null;
   if(!target)return;
   const url=new URL(target.href,location.href);
   const permitted=url.origin===location.origin&&(url.pathname==='/'||url.pathname.startsWith('/section/')||url.pathname.startsWith('/screen/')||url.pathname==='/student'||!location.pathname.startsWith('/screen/')&&url.pathname==='/admin');
   if(!permitted||event.type==='auxclick'||event.ctrlKey||event.metaKey||event.shiftKey||target.target==='_blank'){
    event.preventDefault();event.stopImmediatePropagation();
    if(permitted&&event.type==='click')location.assign(url.href);
   }
  };
  const context=(event:MouseEvent)=>{if(isPortal()&&event.target instanceof Element&&event.target.closest('a,img'))event.preventDefault();};
  document.addEventListener('click',guard,true);document.addEventListener('auxclick',guard,true);document.addEventListener('contextmenu',context,true);
  return()=>{document.removeEventListener('click',guard,true);document.removeEventListener('auxclick',guard,true);document.removeEventListener('contextmenu',context,true);};
 },[]);return null;
}
