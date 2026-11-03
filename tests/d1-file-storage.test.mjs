import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { D1FileStorage, D1_FILE_LIMIT } from '../build/d1-file-storage.ts';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(readFileSync(new URL('../drizzle/0007_d1_file_storage.sql', import.meta.url), 'utf8'));
  let fail = false;
  const db = {
    prepare(sql) {
      let args = [];
      const statement = {
        bind(...values) { args = values.map(v => v instanceof ArrayBuffer ? new Uint8Array(v) : v); return statement; },
        async run() { if (fail && sql.startsWith('INSERT INTO d1_file_chunks')) throw Error('Injected chunk failure'); return sqlite.prepare(sql).run(...args); },
        async all() { return { results: sqlite.prepare(sql).all(...args) }; },
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const results=[]; for (const s of statements) results.push(await s.run()); sqlite.exec('COMMIT'); return results; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  return { storage: new D1FileStorage(db), sqlite, failWrites() { fail = true; } };
}
const stream = bytes => new Blob([bytes]).stream();

test('multi-chunk D1 files preserve exact bytes, content type and stable ETag', async () => {
  const { storage, sqlite } = setup();
  const original = new Uint8Array(700000).map((_, i) => i % 251);
  await storage.put('school-a/photo', stream(original), { httpMetadata: { contentType: 'image/png' } });
  const object = await storage.get('school-a/photo');
  assert.deepEqual(object.body, original);
  const headers = new Headers(); object.writeHttpMetadata(headers);
  assert.equal(headers.get('content-type'), 'image/png');
  const etag = object.httpEtag;
  await storage.put('school-a/photo', stream(original));
  assert.equal((await storage.get('school-a/photo')).httpEtag, etag);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM d1_file_chunks').get().n, 3);
});

test('list pagination and institution prefixes preserve recovery boundaries', async () => {
  const { storage } = setup();
  for (const key of ['school-a/1', 'school-a/2', 'school-b/1']) await storage.put(key, stream('test'));
  const page = await storage.list({ prefix: 'school-a/', limit: 1 });
  assert.equal(page.truncated, true);
  assert.equal(page.objects[0].key, 'school-a/1');
  const next = await storage.list({ prefix: 'school-a/', cursor: page.cursor, limit: 1 });
  assert.deepEqual(next.objects.map(x => x.key), ['school-a/2']);
  assert.equal(next.truncated, false);
});

test('failed replacement rolls back metadata and chunks; deletion removes all bytes', async () => {
  const { storage, sqlite, failWrites } = setup();
  await storage.put('school-a/test', stream('original'));
  failWrites();
  await assert.rejects(storage.put('school-a/test', stream('replacement')));
  assert.equal(new TextDecoder().decode((await storage.get('school-a/test')).body), 'original');
  await storage.delete('school-a/test');
  assert.equal(await storage.get('school-a/test'), null);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM d1_file_chunks').get().n, 0);
});

test('oversized upload preserves the old file and empty files round-trip', async () => {
  const { storage } = setup();
  await storage.put('test', stream('original'));
  await assert.rejects(storage.put('test', stream(new Uint8Array(D1_FILE_LIMIT + 1))), /2 МБ/);
  assert.equal(new TextDecoder().decode((await storage.get('test')).body), 'original');
  await storage.put('empty', stream(''));
  assert.equal((await storage.get('empty')).body.length, 0);
});
