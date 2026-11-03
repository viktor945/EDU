export const D1_FILE_LIMIT = 2 * 1024 * 1024;
const CHUNK_BYTES = 256 * 1024;

export class FileTooLargeError extends Error {
  constructor() { super('Максимальный размер файла в режиме D1 — 2 МБ'); }
}

async function readLimited(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > D1_FILE_LIMIT) { await reader.cancel(); throw new FileTooLargeError(); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return bytes;
}

// A small-file alternative for Workers Free. Existing API access checks remain
// responsible for institution isolation and publication before get() is called.
export class D1FileStorage {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  async put(key: string, stream: ReadableStream<Uint8Array>, options?: { httpMetadata?: { contentType?: string } }) {
    const bytes = await readLimited(stream);
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const etag = '"' + [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('') + '"';
    const statements = [
      this.db.prepare('DELETE FROM d1_file_chunks WHERE object_key=?').bind(key),
      this.db.prepare('INSERT INTO d1_file_objects(object_key,size,content_type,uploaded_at,etag) VALUES (?,?,?,?,?) ON CONFLICT(object_key) DO UPDATE SET size=excluded.size,content_type=excluded.content_type,uploaded_at=excluded.uploaded_at,etag=excluded.etag')
        .bind(key, bytes.byteLength, options?.httpMetadata?.contentType || 'application/octet-stream', new Date().toISOString(), etag),
    ];
    for (let offset = 0, index = 0; offset < bytes.length; offset += CHUNK_BYTES, index++) {
      statements.push(this.db.prepare('INSERT INTO d1_file_chunks(object_key,chunk_index,data) VALUES (?,?,?)').bind(key, index, bytes.slice(offset, offset + CHUNK_BYTES).buffer));
    }
    await this.db.batch(statements);
  }

  async get(key: string) {
    // A single SELECT gives metadata and bytes from the same committed version.
    const rows = await this.db.prepare('SELECT o.size,o.content_type,o.etag,c.data FROM d1_file_objects o LEFT JOIN d1_file_chunks c ON c.object_key=o.object_key WHERE o.object_key=? ORDER BY c.chunk_index').bind(key).all<{ size: number; content_type: string; etag: string; data: number[] | ArrayBuffer | Uint8Array | null }>();
    if (!rows.results.length) return null;
    const meta = rows.results[0];
    const bytes = new Uint8Array(meta.size);
    let offset = 0;
    for (const row of rows.results) {
      if (row.data === null) continue;
      const part = new Uint8Array(row.data as ArrayBuffer);
      bytes.set(part, offset); offset += part.byteLength;
    }
    if (offset !== meta.size) throw new Error('Incomplete D1 file');
    return {
      body: bytes,
      httpEtag: meta.etag,
      writeHttpMetadata(headers: Headers) { headers.set('Content-Type', meta.content_type); },
    };
  }

  async delete(key: string) {
    await this.db.prepare('DELETE FROM d1_file_objects WHERE object_key=?').bind(key).run();
  }

  async list({ prefix = '', limit = 500, cursor = '' }: { prefix?: string; limit?: number; cursor?: string; include?: string[] }) {
    const count = Math.max(1, Math.min(500, limit));
    const { results } = await this.db.prepare('SELECT object_key,size,content_type,uploaded_at FROM d1_file_objects WHERE object_key>=? AND object_key<? AND object_key>? ORDER BY object_key LIMIT ?')
      .bind(prefix, prefix + '\uffff', cursor, count + 1).all<{ object_key: string; size: number; content_type: string; uploaded_at: string }>();
    const page = results.slice(0, count);
    return {
      truncated: results.length > count,
      cursor: page.at(-1)?.object_key,
      objects: page.map(row => ({ key: row.object_key, size: row.size, uploaded: new Date(row.uploaded_at), httpMetadata: { contentType: row.content_type } })),
    };
  }
}
