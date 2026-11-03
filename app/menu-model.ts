import {sectionLayoutFor} from './school-design';
export function mealIsVisible(layouts:unknown,section:unknown,payload:Record<string,unknown>){
 if(section!=='menu')return true;
 const settings=sectionLayoutFor(layouts,'menu').meals;
 return !settings||settings.some(m=>m.visible&&m.name===String(payload.meal||''));
}
