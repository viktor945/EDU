import {allowedSections} from './institutions';
import {parseSectionLayouts} from './school-design';
export const portalOrder = ['home','announcements','schedule','safety','events','clubs','teachers','students','achievements','menu','map','news','about','documents','feedback','daily','families','opportunities','programs','practice','research'];
export function sectionEnabled(layouts: unknown, section: string,type:unknown='school') {
  return allowedSections(type).includes(section) && (section === 'home' || parseSectionLayouts(layouts)[section]?.enabled !== false);
}
export const visiblePortalSections = (layouts: unknown,type:unknown='school') => portalOrder.filter(key => key!=='announcements'&&sectionEnabled(layouts, key,type));
