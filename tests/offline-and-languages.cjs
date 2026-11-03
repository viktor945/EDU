const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),xlsx=require('xlsx');
const cacheModules=new Map();let currentLanguage='EN',network=true,missing='',calls=[];
const cacheStores=new Map(),origin='https://portal.test';
const requestKey=value=>new URL(typeof value==='string'?value:value.url,origin).href;
const caches={async open(name){if(!cacheStores.has(name))cacheStores.set(name,new Map());const store=cacheStores.get(name);return {async match(request){return store.get(requestKey(request))?.clone();},async put(request,response){store.set(requestKey(request),response.clone());},async delete(request){return store.delete(requestKey(request));},async keys(){return [...store.keys()].map(url=>new Request(url));}};},async keys(){return [...cacheStores.keys()];},async delete(name){return cacheStores.delete(name);}};
const registration={update:async()=>{}},navigator={serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration)},storage:{persist:async()=>true}};
async function fetchMock(request){const url=requestKey(request);calls.push(url);if(!network)throw Error('offline');if(url.includes(missing)&&missing)return new Response('missing',{status:404});if(url.endsWith('/offline-assets.json'))return Response.json({assets:['/assets/app.js','/images/classes/primary.png']});if(url.includes('/api/files/'))return new Response('file bytes');return new Response('<html>shell</html>',{headers:{'Content-Type':'text/html'}});}
const location={origin,href:origin+'/screen/panel?lang=EN'};
function load(file){file=path.resolve(file);if(cacheModules.has(file))return cacheModules.get(file);if(file.endsWith('language-context.tsx'))return {useLanguage:()=>({language:currentLanguage})};const m={exports:{}};cacheModules.set(file,m.exports);function req(p){if(!p.startsWith('.'))return require(p);const base=path.resolve(path.dirname(file),p);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');}vm.runInNewContext(ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}),{exports:m.exports,require:req,Date,Intl,console,Response,Headers,URL,AbortSignal,caches,navigator,window:{caches},location,fetch:fetchMock});cacheModules.set(file,m.exports);return m.exports;}

async function main(){
 const {adminText}=load('app/admin/admin-text.ts'),{Localized}=load('app/admin/admin-locale.tsx');
 for(const [lang,expected]of [['RU','Сохранить'],['KZ','Сақтау'],['EN','Save']]){currentLanguage=lang;const html=renderToStaticMarkup(React.createElement(Localized,{as:'button'},'Сохранить'));assert(html.includes(expected));}
 currentLanguage='EN';let html=renderToStaticMarkup(React.createElement(Localized,{as:'option'},'Понедельник'));assert(html.includes('value="Понедельник"'));assert(html.includes('Monday'));html=renderToStaticMarkup(React.createElement(Localized,{as:'input',value:'Мой исходный текст',placeholder:'Название',onChange(){}}));assert(html.includes('value="Мой исходный текст"'));assert(html.includes('placeholder="Title"'));
 assert.equal(adminText('Строка 2: «Телефон»: обязательное поле','EN'),'Row 2: «Phone»: required field');
 const {institutionTypes,allowedSections}=load('app/institutions.ts'),{fieldsFor}=load('app/content-model.ts');
 for(const type of institutionTypes)for(const section of allowedSections(type))for(const language of ['RU','KZ','EN']){
  const file=`public/templates/${type}/${language}/${section}.xlsx`;const wb=xlsx.read(fs.readFileSync(file),{type:'buffer'}),sheet=language==='RU'?'Данные':language==='KZ'?'Деректер':'Data';assert(wb.SheetNames.includes(sheet),file);const headers=xlsx.utils.sheet_to_json(wb.Sheets[sheet],{header:1})[0],expected=['Название','Описание',...fieldsFor(section,type).map(f=>f.label)].map(s=>adminText(s,language));assert.deepEqual(headers,expected,file);
 }
 const {editingLanguage}=load('app/admin/editing-language.ts'),i18n=load('app/i18n.ts');
 const original={section:'events',title:'Собрание',description:'Описание',fileId:'photo',payload:{_sourceLanguage:'RU',place:'Актовый зал',date:'2027-03-01'}};
 const sourceStamp=i18n.sourceStamp(original);original.payload._translations={KZ:{title:'Жиналыс',description:'Ақпарат',fields:{place:'Мәжіліс залы'},enabled:true,origin:'auto',sourceStamp}};
 const edited=editingLanguage(original,'KZ');assert.equal(edited.title,'Жиналыс');assert.equal(edited.payload._sourceLanguage,'KZ');assert.equal(i18n.localize(edited,'RU').title,'Собрание');assert.equal(edited.payload.date,'2027-03-01');assert.equal(i18n.localize(editingLanguage(edited,'EN'),'KZ').title,'Жиналыс');
 const {normalizeExperience}=load('app/experience-model.ts');assert.equal(normalizeExperience({selections:[{id:'a',text:'x'.repeat(1000)}]}).selections[0].text.length,270);
 const offline=load('app/offline-cache.ts');assert.equal(offline.SYNC_INTERVAL,240000);
 const first={school:{id:'school',home_layout:JSON.stringify([{imageId:'home-photo'}])},profile:{sections:['home','events']},items:[{file_id:'photo',payload:{galleryIds:['gallery'],_translations:{EN:{fileId:'translated'}}}}],settings:{banners:[{imageId:'banner'}],selections:[{imageIds:['slide']}]}};
 assert.deepEqual(Array.from(offline.offlineFileUrls(first)).sort(),['banner','gallery','home-photo','photo','slide','translated'].map(id=>'/api/files/'+id).sort());
 await offline.saveOffline('/api/screen?id=panel',first);const saved=await offline.readOffline('/api/screen?id=panel');assert.equal(saved.data.items[0].file_id,'photo');
 missing='/api/files/missing';const second={...first,items:[...first.items,{file_id:'missing',payload:{}}]};await assert.rejects(()=>offline.saveOffline('/api/screen?id=panel',second));assert.equal((await offline.readOffline('/api/screen?id=panel')).data.items.length,1);
 missing='';calls=[];await offline.saveOffline('/api/screen?id=panel',second);assert.equal((await offline.readOffline('/api/screen?id=panel')).data.items.length,2);assert.equal(calls.filter(s=>s.includes('/api/files/photo')).length,0);
 network=false;assert.equal((await offline.readOffline('/api/screen?id=panel')).data.items.length,2);assert.equal(await offline.readOffline('/api/screen?id=other'),null);
 const listeners={},self={location:{origin},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}};vm.runInNewContext(fs.readFileSync('public/portal-sw.js','utf8'),{self,caches,fetch:fetchMock,Response,URL});
 async function serve(url,{mode='cors',destination=''}={}){let response;listeners.fetch({request:{url:origin+url,method:'GET',mode,destination},respondWith:r=>response=r});return response?await response:undefined;}
 assert.equal(await(await serve('/api/files/photo')).text(),'file bytes');assert.equal(await(await serve('/screen/panel?lang=KZ',{mode:'navigate'})).text(),'<html>shell</html>');assert.equal(await serve('/admin',{mode:'navigate'}),undefined);assert.equal(await serve('/api/platform'),undefined);
 network=true;let install;listeners.install({waitUntil:p=>install=p});await install;network=false;assert.equal((await serve('/images/classes/primary.png',{destination:'image'})).status,200);
 await offline.forgetOffline('/api/screen?id=panel');assert.equal(await offline.readOffline('/api/screen?id=panel'),null);
 console.log('Passed 204 localized templates, canonical option values, input preservation, language rebasing, 270-character cap, atomic offline saves, incremental file downloads, isolated devices, offline navigation/assets and admin cache exclusion.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
