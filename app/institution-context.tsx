'use client';
import {createContext,useContext} from 'react';
import {institutionType,institutionTerms,sectionTitles,institutionProfiles} from './institutions';
import {tr,Language} from './i18n';
const Context=createContext<ReturnType<typeof institutionType>>('school');
export function InstitutionProvider({type,children}:{type:unknown;children:React.ReactNode}){return <Context.Provider value={institutionType(type)}>{children}</Context.Provider>;}
export const useInstitution=()=>useContext(Context);
export function institutionText(text:string,type:unknown,language:Language='RU'){const mapped=institutionTerms(type)[text]||text;const p=institutionProfiles[institutionType(type)];if(mapped===`Цифровой центр · ${p.name}`)return `${tr('Цифровой центр',language)} · ${tr(p.name,language)}`;return tr(mapped,language);}
export function useInstitutionText(){const type=useInstitution();return(text:string,language:Language='RU')=>institutionText(text,type,language);}
export function institutionLabels(type:unknown,language:Language='RU'){return Object.fromEntries(Object.entries(sectionTitles(type)).map(([key,label])=>[key,tr(label,language)]));}
