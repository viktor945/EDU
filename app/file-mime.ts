export function fileMime(type:unknown,name:unknown){
 const mime=String(type||'').toLowerCase().split(';')[0];
 if(mime&&mime!=='application/octet-stream'&&!['application/x-excel','application/excel','application/x-msexcel','application/xls','application/xlsx'].includes(mime))return mime==='image/jpg'?'image/jpeg':mime;
 const ext=String(name||'').split('.').pop()?.toLowerCase()||'';
 return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsb:'application/vnd.ms-excel.sheet.binary.macroEnabled.12',xlsm:'application/vnd.ms-excel.sheet.macroEnabled.12',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',txt:'text/plain'} as Record<string,string>)[ext]||mime||'application/octet-stream';
}
