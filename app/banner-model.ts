import type {PublicItem} from './public-content';
import type {Experience,HomeBanner} from './experience-model';
export function resolvedHomeBanners(items:PublicItem[],settings:Experience):HomeBanner[]{
 const legacy=items.filter(i=>i.section==='home'&&i.payload._bannerEnabled!==false).map(i=>({id:`content:${i.id}`,title:i.title,text:i.description,imageId:i.file_id&&i.file_mime_type?.startsWith('image/')?i.file_id:String(i.payload.galleryIds?.[0]||''),art:'discovery',targetId:String(i.payload.bannerTargetId||''),enabled:true,seconds:Math.max(5,Math.min(120,Number(i.payload.bannerSeconds)||12))}));
 return [...settings.banners.filter(b=>b.enabled),...legacy];
}
