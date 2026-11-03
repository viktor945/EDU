// Run a temporary copy with CODEX_PRIMARY_RUNTIME_NODE and bundled artifact-tool.
import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const [schemaPath,outputDir,previewDir]=process.argv.slice(2);
const schemas=JSON.parse(await fs.readFile(schemaPath,'utf8'));
await fs.mkdir(previewDir,{recursive:true});
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
let count=0;
for(const spec of schemas){
 const wb=Workbook.create(),sheet=wb.worksheets.add('Данные'),help=wb.worksheets.add('Инструкция');
 const headers=['Название','Описание',...spec.fields.map(f=>f.label)],last=col(headers.length-1);
 sheet.showGridLines=false;sheet.freezePanes.freezeRows(1);sheet.freezePanes.freezeColumns(1);
 sheet.getRange(`A1:${last}16`).format={font:{name:'Arial',size:11},rowHeight:25,columnWidth:27,verticalAlignment:'center'};
 sheet.getRange(`A1:${last}1`).values=[headers];
 sheet.getRange(`A1:${last}1`).format={fill:'#1E5A46',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:58,horizontalAlignment:'center'};
 sheet.getRange(`A2:${last}16`).format.fill='#FFF9E8';
 sheet.getRange('A1:B16').format.columnWidth=36;
 for(const [i,f] of spec.fields.entries()){
  const range=sheet.getRange(`${col(i+2)}2:${col(i+2)}301`);
  if(f.options)range.dataValidation={rule:{type:'list',values:f.options}};
  if(f.type==='checkbox')range.dataValidation={rule:{type:'list',values:['Да','Нет']}};
  range.setNumberFormat(f.type==='date'?'yyyy-mm-dd':f.type==='time'?'hh:mm':f.type==='number'?'0.##':'@');
 }
 const notes=[['STEPLine EDU',`${spec.institution} · ${spec.title}`],['Как заполнить','Вносите записи на лист «Данные» со второй строки. Одна строка — одна карточка. Не меняйте заголовки.'],['Обязательные поля',['Название',...spec.fields.filter(f=>f.required).map(f=>f.label)].join('; ')],['Объём','До 300 заполненных строк за один импорт. Пустые строки пропускаются.'],['Публикация','После выбора файла в админке выберите статус: черновик, согласование или публикация.'],['Формат','Даты: ГГГГ-ММ-ДД. Время: ЧЧ:ММ. Телефоны и названия групп вводите как текст.'],['Преподаватели','Имена в расписании и карточках должны совпадать с заполненными карточками преподавателей. Предмет — с преподаваемыми предметами.'],['Файлы','Фотографии и документы прикрепляются к карточкам в админке после импорта.'],...spec.fields.filter(f=>f.options||f.type==='checkbox').map(f=>[f.label,f.type==='checkbox'?'Да / Нет. Если пусто — данные родителя отображаются.':f.options.join(' / ')])];
 help.showGridLines=false;help.getRange(`A1:B${notes.length}`).values=notes;
 help.getRange(`A1:B${notes.length}`).format={font:{name:'Arial',size:11},rowHeight:48,verticalAlignment:'center',wrapText:true};
 help.getRange(`A1:A${notes.length}`).format.columnWidth=28;help.getRange(`B1:B${notes.length}`).format.columnWidth=98;
 help.getRange('A1:B1').format={font:{name:'Arial',size:14,bold:true,color:'#173F35'},rowHeight:40};
 wb.recalculate();
 const inspect=await wb.inspect({kind:'table',range:`Данные!A1:${last}1`,include:'values',tableMaxRows:1,tableMaxCols:headers.length,maxChars:300});
 if(JSON.stringify(sheet.getRange(`A1:${last}1`).values[0])!==JSON.stringify(headers))throw Error('Header mismatch '+spec.destination);
 const output=path.join(outputDir,spec.destination);await fs.mkdir(path.dirname(output),{recursive:true});
 await (await SpreadsheetFile.exportXlsx(wb)).save(output);
 if(['schedule','safety','students','research','daily','teachers'].includes(spec.section)){
  const png=await wb.render({sheetName:'Данные',range:`A1:${col(Math.min(headers.length-1,8))}4`,scale:1});
  await fs.writeFile(path.join(previewDir,`${spec.type}-${spec.section}.png`),new Uint8Array(await png.arrayBuffer()));
 }
 if(count===0){const png=await wb.render({sheetName:'Инструкция',range:`A1:B${notes.length}`,scale:1});await fs.writeFile(path.join(previewDir,'instructions.png'),new Uint8Array(await png.arrayBuffer()));}
 count++;
}
console.log(`Created ${count} institution templates; headers verified.`);
