import {tr,type Language} from '../i18n';
import {adminCatalog} from './admin-catalog';
const fragmentPattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+Object.keys(adminCatalog).filter(k=>k.length>2).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{N}_])','gu');
export function adminLocale(language?:Language){return language==='KZ'?'kk-KZ':language==='EN'?'en-GB':language==='RU'?'ru-RU':typeof document==='undefined'?'ru-RU':document.documentElement.lang==='kk'?'kk-KZ':document.documentElement.lang==='en'?'en-GB':'ru-RU';}
export function adminText(value:string,language:Language):string {
 if(language==='RU')return value;
 const index=language==='KZ'?0:1;
 const clean=value.trim().replace(/\s+/g,' ');
 const translated=adminCatalog[clean]?.[index]||tr(clean,language);
 if(translated!==clean)return value.replace(value.trim(),translated);
 // Translate known fragments of interpolated notices, preserving values.
 return value.replace(fragmentPattern,key=>adminCatalog[key][index]);
}
