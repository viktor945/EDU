import {env} from 'cloudflare:workers';
import {experienceFor,normalizeExperience} from './experience-model';
export async function validateExperience(layouts:unknown,schoolId:string){
 const raw=layouts as Record<string,any>|undefined;if(!raw?.home?.experience)return null;
 const settings=normalizeExperience(raw.home.experience);const ids=Array.from(new Set([...settings.banners.map(b=>b.imageId),...settings.selections.flatMap(s=>s.imageIds)].filter(Boolean)));
 for(const id of ids){const file=await env.DB.prepare('SELECT school_id,mime_type FROM files WHERE id=?').bind(id).first();if(!file||file.school_id!==schoolId||!String(file.mime_type).startsWith('image/'))return 'Изображение баннера или заставки должно принадлежать этому учреждению';}
 raw.home.experience=settings;return null;
}
