const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,require:p=>load(path.resolve(path.dirname(file),p)+'.ts'),Date});return module.exports;}
const profiles=load('app/institutions.ts'),model=load('app/content-model.ts');
const templates=profiles.institutionTypes.flatMap(type=>profiles.allowedSections(type).map(section=>({type,section,title:profiles.sectionTitles(type)[section],institution:profiles.institutionProfiles[type].name,fields:model.fieldsFor(section,type),destination:`${type}/${section}.xlsx`})));
for(const section of ['safety','announcements',...profiles.extraSections])templates.push({type:'school',section,title:model.sectionLabels[section],institution:'STEPLine EDU',fields:model.sectionFields[section],destination:`${section}.xlsx`});
fs.writeFileSync(process.argv[2],JSON.stringify(templates));
