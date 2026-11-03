import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const generator = fileURLToPath(new URL('../scripts/configure-cloudflare.mjs', import.meta.url));
const valid = {
  CLOUDFLARE_D1_DATABASE_ID: '11111111-1111-4111-8111-111111111111',
  CLOUDFLARE_R2_BUCKET: 'stepline-test-files',
  CLOUDFLARE_WORKER_NAME: 'stepline-test',
  ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com',
  ACCESS_AUD: 'a'.repeat(64),
  CLOUDFLARE_CUSTOM_DOMAIN: '',
};
function generate(overrides, check) {
  const dir = mkdtempSync(join(tmpdir(), 'stepline-cf-config-'));
  try {
    const result = spawnSync(process.execPath, [generator], { cwd: dir, env: { ...process.env, ...valid, ...overrides }, encoding: 'utf8' });
    check(result, dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('deployment configuration refuses local placeholder and incomplete Access settings', () => {
  for (const overrides of [
    { CLOUDFLARE_D1_DATABASE_ID: '00000000-0000-4000-8000-000000000000' },
    { ACCESS_AUD: '' }, { ACCESS_TEAM_DOMAIN: 'attacker.example' },
    { CLOUDFLARE_R2_BUCKET: '' }, { CLOUDFLARE_CUSTOM_DOMAIN: 'https://edu.example' },
  ]) generate(overrides, result => assert.notEqual(result.status, 0));
});

test('custom-domain configuration disables workers.dev and contains no Sites project metadata', () => {
  generate({ CLOUDFLARE_CUSTOM_DOMAIN: 'edu.example.com' }, (result, dir) => {
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(readFileSync(join(dir, '.wrangler/cloudflare.json')));
    assert.equal(config.workers_dev, false);
    assert.deepEqual(config.routes, [{ pattern: 'edu.example.com', custom_domain: true }]);
    assert.equal(config.vars.AUTH_PROVIDER, 'cloudflare-access');
    assert.equal(JSON.stringify(config).includes('project_id'), false);
  });
});
