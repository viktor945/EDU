'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {Language,languages,languageNames,normalizeLanguage} from './i18n';
const Context=createContext({language:'RU' as Language,setLanguage:(_v:Language)=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguage]=useState<Language>('RU');
 useEffect(()=>{let saved:string|null=null;try{saved=localStorage.getItem('portal-language');}catch{}const v=normalizeLanguage(new URLSearchParams(location.search).get('lang')||saved);setLanguage(v);document.documentElement.lang=v==='KZ'?'kk':v.toLowerCase();},[]);
 function choose(v:Language){setLanguage(v);try{localStorage.setItem('portal-language',v);}catch{}const url=new URL(location.href);url.searchParams.set('lang',v);history.replaceState(history.state,'',url);document.documentElement.lang=v==='KZ'?'kk':v.toLowerCase();}
 return <Context.Provider value={{language,setLanguage:choose}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function LanguageSwitch(){const {language,setLanguage}=useLanguage();return <div className="language-switch">{languages.map(v=><button type="button" key={v} aria-label={languageNames[v]} aria-pressed={v===language} className={v===language?'is-active':''} onClick={()=>setLanguage(v)}>{v}</button>)}</div>;}
