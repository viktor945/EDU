#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
export STEPLINE_DEPLOY_TARGET=cloudflare
export WRANGLER_LOG_PATH=.wrangler/wrangler.log
export CLOUDFLARE_SEND_METRICS=false
node scripts/configure-cloudflare.mjs
timeout --signal=TERM --kill-after=10s 3m node_modules/.bin/vinext build
node scripts/build-offline-manifest.mjs
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const config = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
assert.equal(config.vars.AUTH_PROVIDER, 'cloudflare-access');
assert.equal(config.d1_databases[0].database_id, process.env.CLOUDFLARE_D1_DATABASE_ID);
if (config.vars.FILE_STORAGE === 'r2') assert.equal(config.r2_buckets[0].bucket_name, process.env.CLOUDFLARE_R2_BUCKET);
else assert.equal(config.r2_buckets?.length || 0, 0);
assert.equal(config.assets.binding, 'ASSETS');
const worker = await import('./dist/server/index.js');
assert.equal(typeof worker.default.fetch, 'function');
console.log('Validated standalone Cloudflare Worker artifact and bindings.');
NODE
