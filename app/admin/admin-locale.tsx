'use client';
import {createElement,Children,type ComponentPropsWithRef,type JSX,type ReactNode} from 'react';
import {useLanguage} from '../language-context';
import {adminText} from './admin-text';
export {adminText} from './admin-text';

export function Localized<T extends keyof JSX.IntrinsicElements>({as,...props}:{as:T}&ComponentPropsWithRef<T>) {
 const {language}=useLanguage();
 const p={...props} as Record<string,unknown>;
 for(const key of ['placeholder','title','aria-label','alt'])if(typeof p[key]==='string')p[key]=adminText(p[key] as string,language);
 // Display language must never change stored option values.
 if(as==='option'&&p.value===undefined&&typeof p.children==='string')p.value=p.children;
 const children=Children.map(p.children as ReactNode,child=>typeof child==='string'&&p.translate!=='no'?adminText(child,language):child);
 return createElement(as,p,children);
}
