import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function required(name, pattern) {
  const value = process.env[name]?.trim();
  if (!value || !pattern.test(value)) throw new Error(`Set a valid ${name} before building for Cloudflare`);
  return value;
}

const databaseId = required('CLOUDFLARE_D1_DATABASE_ID', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
if (databaseId === '00000000-0000-4000-8000-000000000000') throw new Error('The local placeholder database cannot be deployed');
const bucket = required('CLOUDFLARE_R2_BUCKET', /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/);
const team = required('ACCESS_TEAM_DOMAIN', /^[a-z0-9-]+\.cloudflareaccess\.com$/);
const audience = required('ACCESS_AUD', /^[a-f0-9]{64}$/i);
const name = process.env.CLOUDFLARE_WORKER_NAME || 'stepline-edu';
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new Error('Invalid CLOUDFLARE_WORKER_NAME');
const domain = process.env.CLOUDFLARE_CUSTOM_DOMAIN?.trim();
if (domain && !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) throw new Error('Invalid CLOUDFLARE_CUSTOM_DOMAIN');

const config = {
  name, main: resolve('worker/index.ts'),
  compatibility_date: '2026-05-15', compatibility_flags: ['nodejs_compat'],
  workers_dev: !domain,
  ...(domain ? { routes: [{ pattern: domain, custom_domain: true }] } : {}),
  vars: { AUTH_PROVIDER: 'cloudflare-access', ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: audience },
  d1_databases: [{ binding: 'DB', database_name: 'stepline-edu', database_id: databaseId, migrations_dir: resolve('drizzle') }],
  r2_buckets: [{ binding: 'BUCKET', bucket_name: bucket }],
  assets: { binding: 'ASSETS', run_worker_first: true },
  images: { binding: 'IMAGES' },
  observability: { enabled: true },
};
mkdirSync('.wrangler', { recursive: true });
writeFileSync('.wrangler/cloudflare.json', JSON.stringify(config, null, 2) + '\n');
console.log('Prepared standalone Cloudflare configuration (no Sites project ID).');
