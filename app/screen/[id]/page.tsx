import ScreenPlayer from './player';
export default async function ScreenPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ScreenPlayer id={id}/>;}
