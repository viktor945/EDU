import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist/client');
const assets=[];
async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name),relative=path.relative(root,full).split(path.sep).join('/');if(item.isDirectory()){if(['templates','.vite'].includes(item.name))continue;await walk(full);}else if(/\.(?:js|mjs|css|png|jpe?g|webp|svg|gif|avif|ico|woff2?|ttf|otf|wasm|json)$/.test(relative)&&relative!=='portal-sw.js'&&relative!=='offline-assets.json'&&!relative.startsWith('.'))assets.push('/'+relative);}}
await walk(root);await fs.writeFile(path.join(root,'offline-assets.json'),JSON.stringify({version:39,assets:assets.sort()}));
console.log(`Offline manifest: ${assets.length} resources.`);
