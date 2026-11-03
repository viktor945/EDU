'use client';
import {createContext,useContext,useEffect,useState} from 'react';
const Context=createContext<Date|null>(null);
export function ClockTimeProvider({children}:{children:React.ReactNode}){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
 return <Context.Provider value={now}>{children}</Context.Provider>;
}
export const useClockTime=()=>useContext(Context);
