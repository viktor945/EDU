export const SYNC_INTERVAL=4*60*1000;
export const DATA_CACHE='stepline-public-data-v1';
export const FILE_CACHE='stepline-public-files-v1';
export const PAGE_CACHE='stepline-public-pages-v1';
export const STATIC_CACHE='stepline-static-v39';
type Snapshot<T>={data:T;savedAt:number};
export function publicPageKey(value:string){const url=new URL(value,location.origin);url.searchParams.delete('lang');url.searchParams.delete('scan');return url.href;}
export function offlineFileUrls(value:unknown):string[]{
 const ids=new Set<string>();
 function walk(v:unknown,key=''){if(typeof v==='string'&&/^(home_layout|section_layouts)$/.test(key)){try{walk(JSON.parse(v));}catch{}}else if(typeof v==='string'&&/^(file_id|fileId|imageId|galleryIds|imageIds)$/.test(key)&&v)ids.add(v);else if(Array.isArray(v))v.forEach(x=>walk(x,key));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,k));}
 walk(value);return [...ids].map(id=>'/api/files/'+encodeURIComponent(id));
}
export async function readOffline<T>(endpoint:string):Promise<Snapshot<T>|null>{
 try{const response=await(await caches.open(DATA_CACHE)).match(endpoint);return response?await response.json():null;}catch{return null;}
}
export async function forgetOffline(endpoint:string){try{await(await caches.open(DATA_CACHE)).delete(endpoint);}catch{}}
async function parallel<T>(values:T[],job:(value:T)=>Promise<void>){let index=0;await Promise.all(Array.from({length:Math.min(4,values.length)},async()=>{while(index<values.length)await job(values[index++]);}));}
export async function cacheFiles(value:unknown,signal?:AbortSignal){
 const cache=await caches.open(FILE_CACHE);
 await parallel(offlineFileUrls(value),async url=>{
  if(await cache.match(url))return;const response=await fetch(url,{credentials:'omit',cache:'no-store',signal});
  if(!response.ok||response.redirected)throw Error('Offline file unavailable');
  await cache.put(url,response);
 });
}
let installation:Promise<void>|null=null;
export function installOffline(){
 if(typeof window==='undefined'||!('serviceWorker' in navigator)||!('caches' in window))return Promise.reject(Error('Offline storage unavailable'));
 installation??=(async()=>{const registration=await navigator.serviceWorker.register('/portal-sw.js',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready;void navigator.storage?.persist?.().catch(()=>false);void registration.update().catch(()=>{});})();
 return installation;
}
async function cachePages(value:unknown,signal?:AbortSignal){
 const record=value as {school?:{id?:string;institution_type?:string};profile?:unknown};
 const cache=await caches.open(PAGE_CACHE),current=publicPageKey(location.href);
 const paths=new Set([current]);
 if(!record.profile&&record.school?.id){
  const {allowedSections}=await import('./institutions');const suffix='?schoolId='+encodeURIComponent(record.school.id);
  paths.add(location.origin+'/'+suffix);paths.add(location.origin+'/student'+suffix);
  for(const section of allowedSections(record.school.institution_type))if(section!=='home'&&section!=='announcements')paths.add(location.origin+'/section/'+section+suffix);
 }
 await parallel([...paths],async url=>{
  const previous=await cache.match(url);if(previous?.headers.get('X-STEPLine-Offline-Version')==='39')return;
  const response=await fetch(url,{headers:{Accept:'text/html'},credentials:'omit',cache:'no-store',signal});
  if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||response.redirected)throw Error('Offline page unavailable');
  const headers=new Headers(response.headers);headers.set('X-STEPLine-Offline-Version','39');headers.delete('Content-Encoding');headers.delete('Content-Length');
  await cache.put(url,new Response(await response.arrayBuffer(),{headers,status:response.status}));
 });
}
export async function saveOffline<T>(endpoint:string,data:T,signal?:AbortSignal):Promise<number>{
 await installOffline();await cacheFiles(data,signal);await cachePages(data,signal);
 // Commit the snapshot only after every referenced file and page is stored.
 const savedAt=Date.now();await(await caches.open(DATA_CACHE)).put(endpoint,new Response(JSON.stringify({data,savedAt}),{headers:{'Content-Type':'application/json'}}));
 return savedAt;
}
