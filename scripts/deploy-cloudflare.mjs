import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export function validateDeploymentConfig(config) {
  const db = config.d1_databases?.find(binding => binding.binding === 'DB');
  const bucket = config.r2_buckets?.find(binding => binding.binding === 'BUCKET');
  if (config.vars?.AUTH_PROVIDER !== 'cloudflare-access' ||
      !db?.database_id || db.database_id === '00000000-0000-4000-8000-000000000000' ||
      !['d1', 'r2'].includes(config.vars?.FILE_STORAGE) ||
      (config.vars?.FILE_STORAGE === 'r2' && (!bucket?.bucket_name || bucket.bucket_name === 'site-creator-r2')) ||
      (config.vars?.FILE_STORAGE === 'd1' && config.r2_buckets?.length)) {
    throw new Error('Refusing to deploy a local/Sites build. Set real Cloudflare resource variables and run npm run build:cloudflare first.');
  }
  if (process.env.CLOUDFLARE_WORKER_NAME && config.name !== process.env.CLOUDFLARE_WORKER_NAME) {
    throw new Error('Worker name differs from CLOUDFLARE_WORKER_NAME. Rebuild before deploying.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--dry-run')) throw new Error('Only --dry-run is supported as an extra argument.');
    const configPath = resolve('dist/server/wrangler.json');
    validateDeploymentConfig(JSON.parse(readFileSync(configPath, 'utf8')));
    const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', configPath, ...args], { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
