import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {actorFromRequest,canAccessSchool,hasPermission} from '../../access-policy';
import {languages,Language,Localizable} from '../../i18n';
import {googleConfigured,googleTranslate,translationUsage} from '../../google-translation';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){
 const actor=await actorFromRequest(r);if(!actor||!hasPermission(actor,'content.edit'))return NextResponse.json({error:'Требуется вход'},{status:401});
 try{return NextResponse.json({configured:googleConfigured(),provider:'Google Cloud Translation',...(await translationUsage())},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Не удалось загрузить состояние переводчика'},{status:503});}
}
export async function POST(r:NextRequest){
 const actor=await actorFromRequest(r);if(!actor)return NextResponse.json({error:'Требуется вход'},{status:401});
 try{
 const raw=await r.text();if(raw.length>60000)throw Error('Слишком большой материал');
 const body=JSON.parse(raw) as {mode:string;target:Language;schoolId:string;content:Localizable};
 if(!hasPermission(actor,'content.edit')||!canAccessSchool(actor,body.schoolId))return NextResponse.json({error:'Недостаточно прав'},{status:403});
 if(body.mode!=='text')throw Error('Загрузите готовую языковую версию изображения. Автоперевод картинок отключён.');
 if(!languages.includes(body.target)||!body.content||typeof body.content.title!=='string'||typeof body.content.description!=='string'||!body.content.payload||typeof body.content.payload!=='object')throw Error('Некорректный запрос');
 if(!await env.DB.prepare('SELECT id FROM schools WHERE id=?').bind(body.schoolId).first())throw Error('Школа не найдена');
 const translation=await googleTranslate(body.schoolId,body.content,body.target);
 return NextResponse.json({translation,usage:await translationUsage()});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Не удалось выполнить перевод'},{status:googleConfigured()?400:503});}
}
