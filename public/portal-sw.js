/* Public display only. Admin pages, sessions and private APIs are never cached. */
const STATIC='stepline-static-v39',FILES='stepline-public-files-v1',PAGES='stepline-public-pages-v1';
const publicPage=path=>path==='/'||path==='/student'||path.startsWith('/section/')||path.startsWith('/screen/');
const pageKey=value=>{const u=new URL(value);u.searchParams.delete('lang');u.searchParams.delete('scan');return u.href;};
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-assets.json',{cache:'no-store'});if(!response.ok)throw Error('Missing offline manifest');
 const {assets}=await response.json(),cache=await caches.open(STATIC);let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<assets.length){const url=assets[cursor++],response=await fetch(url,{cache:'reload',credentials:'omit'});if(!response.ok)throw Error('Missing offline asset: '+url);await cache.put(url,response);}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('stepline-static-')&&key!==STATIC)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/admin')||url.pathname.startsWith('/auth'))return;
 if(url.pathname.startsWith('/api/files/')){event.respondWith((async()=>{const stored=await(await caches.open(FILES)).match(request.url,{ignoreVary:true});return stored||fetch(request);})());return;}
 if(url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'&&publicPage(url.pathname)){event.respondWith((async()=>{
  const cache=await caches.open(PAGES),key=pageKey(url.href);
  try{const response=await fetch(request);if(response.ok&&!response.redirected&&response.headers.get('Content-Type')?.includes('text/html'))await cache.put(key,response.clone());return response;}catch{
   return await cache.match(key)||new Response('<!doctype html><html lang="ru"><meta name="viewport" content="width=device-width"><body><p>Первый запуск требует интернет. / Алғашқы іске қосу үшін интернет қажет. / First launch needs internet.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  }
 })());return;}
 if(['image','font','script','style','worker'].includes(request.destination)||url.pathname.startsWith('/assets/')||url.pathname.startsWith('/_next/')||url.pathname.startsWith('/banner-assets/')||url.pathname.startsWith('/class-illustrations/')||url.pathname.startsWith('/meal-assets/')||url.pathname==='/favicon.svg')event.respondWith((async()=>{const cache=await caches.open(STATIC);return await cache.match(request,{ignoreVary:true})||fetch(request);})());
});
