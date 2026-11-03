#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
mkdir -p .wrangler
export WRANGLER_LOG_PATH=.wrangler/wrangler.log
export CLOUDFLARE_SEND_METRICS=false

# Only a local placeholder database. This script never uses --remote.
node --input-type=module <<'NODE'
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
writeFileSync('.wrangler/local.json', JSON.stringify({
  name: 'stepline-edu-local',
  compatibility_date: '2026-11-03',
  d1_databases: [{
    binding: 'DB', database_name: 'site-creator-d1',
    database_id: '00000000-0000-4000-8000-000000000000',
    migrations_dir: resolve('drizzle'),
  }],
  r2_buckets: [{ binding: 'BUCKET', bucket_name: 'site-creator-r2' }],
}, null, 2) + '\n');
NODE

node_modules/.bin/wrangler d1 migrations apply DB --local --config .wrangler/local.json --persist-to .wrangler/state </dev/null
node_modules/.bin/wrangler d1 execute DB --local --config .wrangler/local.json --persist-to .wrangler/state --file examples/local-development.sql
node_modules/.bin/wrangler r2 object put site-creator-r2/local-test/hero.png --local --config .wrangler/local.json --persist-to .wrangler/state --file public/hero-school-community.png
