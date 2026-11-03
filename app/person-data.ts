export function parentIsPublic(payload:Record<string,unknown>,n:number):boolean {
 const flag=payload[`parent${n}Public`];
 return typeof flag==='boolean'?flag:payload.publicContacts!==false;
}
export function ageAt(value:unknown,now=new Date()):number|null {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const date=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return null;
 const [y,m,d]=value.split('-').map(Number);
 const age=now.getFullYear()-y-(now.getMonth()+1<m||(now.getMonth()+1===m&&now.getDate()<d)?1:0);
 return age>=0&&age<=130?age:null;
}
