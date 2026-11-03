import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { Miniflare } from 'miniflare';

test('files round-trip through actual local D1 bindings without R2', async () => {
  const source = ts.transpileModule(readFileSync(new URL('../build/d1-file-storage.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/^export /gm, '');
  const mf = new Miniflare({
    modules: true,
    compatibilityDate: '2026-05-15',
    d1Databases: { DB: 'd1-files-runtime-test' },
    script: source + `\nexport default {async fetch(request,env){const store=new D1FileStorage(env.DB);if(request.method==='PUT'){await store.put('school-a/test',request.body,{httpMetadata:{contentType:'image/png'}});return new Response('saved');}if(request.method==='DELETE'){await store.delete('school-a/test');return new Response('deleted');}const file=await store.get('school-a/test');return file?new Response(file.body,{headers:{ETag:file.httpEtag}}):new Response('missing',{status:404});}};`,
  });
  try {
    const db = await mf.getD1Database('DB');
    const sql = readFileSync(new URL('../drizzle/0007_d1_file_storage.sql', import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', '');
    await db.batch(sql.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
    const bytes = new Uint8Array(600000).map((_,i)=>i%251);
    assert.equal((await mf.dispatchFetch('http://local.test/file',{method:'PUT',body:bytes})).status,200);
    const response = await mf.dispatchFetch('http://local.test/file');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
    assert.match(response.headers.get('etag'),/^"[a-f0-9]{64}"$/);
    await mf.dispatchFetch('http://local.test/file',{method:'DELETE'});
    assert.equal((await mf.dispatchFetch('http://local.test/file')).status,404);
    // Exercise the compiled application's public-file authorization and shim too.
    for (const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>name.endsWith('.sql')&&!name.startsWith('0007')).sort()) {
      const migration=readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8').replaceAll('--> statement-breakpoint','');
      await db.batch(migration.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    }
    const seed=readFileSync(new URL('../examples/local-development.sql',import.meta.url),'utf8');
    await db.batch(seed.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const {D1FileStorage}=await import('../build/d1-file-storage.ts');
    const image=readFileSync(new URL('../public/hero-school-community.png',import.meta.url));
    await new D1FileStorage(db).put('local-test/hero.png',new Blob([image]).stream(),{httpMetadata:{contentType:'image/png'}});
    const {default:worker}=await import('../dist/server/index.js');
    const env={DB:db,FILE_STORAGE:'d1',AUTH_PROVIDER:'cloudflare-access',ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
    const ctx={waitUntil(){},passThroughOnException(){}};
    const file=await worker.fetch(new Request('https://local.test/api/files/local-test-image'),env,ctx);
    assert.equal(file.status,200);
    assert.deepEqual(new Uint8Array(await file.arrayBuffer()),new Uint8Array(image));
    await db.prepare("UPDATE content_items SET status='draft' WHERE id='local-school-news'").run();
    const hidden=await worker.fetch(new Request('https://local.test/api/files/local-test-image'),env,ctx);
    assert.equal(hidden.status,404);
  } finally { await mf.dispose(); }
});
