import {env} from 'cloudflare:workers';
import {languages,Localizable,variants,translatableFields} from './i18n';
export async function validateTranslations(data:Record<string,unknown>){
 const c=data as unknown as Localizable;
 const source=c.payload?._sourceLanguage;
 if(source!==undefined&&!languages.includes(source as never))return 'Укажите RU, KZ или EN как язык оригинала';
 const versions=variants(c);if(!versions||typeof versions!=='object'||Array.isArray(versions))return 'Неверный формат языковых версий';
 for(const [language,v] of Object.entries(versions)){
  if(!languages.includes(language as never)||!v||typeof v.title!=='string'||typeof v.description!=='string'||typeof v.sourceStamp!=='string'||typeof v.enabled!=='boolean'||!['manual','auto'].includes(v.origin)||!v.fields||typeof v.fields!=='object'||Array.isArray(v.fields))return 'Неверный формат перевода';
  if(Object.entries(v.fields).some(([k,x])=>typeof x!=='string'||!translatableFields(c.section).some(f=>f.key===k)))return 'Неверные поля перевода';
  if(v.enabled&&(!v.title.trim()||v.fileId&&!v.imageReviewed))return 'Проверьте текст и файл языковой версии';
 }
 const gallery=c.payload.galleryIds;
 if(gallery!==undefined&&(!Array.isArray(gallery)||gallery.length>20||gallery.some(id=>typeof id!=='string')))return 'В галерее допускается до 20 изображений';
 const ids=[...(Array.isArray(gallery)?gallery:[]),c.fileId,...Object.values(versions).map(v=>v?.fileId)].filter(Boolean);
 for(const id of ids){if(typeof id!=='string'||!await env.DB.prepare('SELECT id FROM files WHERE id=? AND school_id=?').bind(id,data.schoolId).first())return 'Файл не найден в выбранной школе';}
 return null;
}
