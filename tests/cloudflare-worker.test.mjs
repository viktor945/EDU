import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import worker from '../dist/server/index.js';

const env = { AUTH_PROVIDER: 'cloudflare-access', ACCESS_TEAM_DOMAIN: 'stepline-test.cloudflareaccess.com', ACCESS_AUD: 'a'.repeat(64), ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };
const standalone = JSON.parse(readFileSync(new URL('../dist/server/wrangler.json', import.meta.url), 'utf8')).vars?.AUTH_PROVIDER === 'cloudflare-access';

if (standalone) test('standalone Worker strips spoofed identity even if the runtime provider variable is removed', async () => {
  const { AUTH_PROVIDER, ...withoutProvider } = env;
  const response = await worker.fetch(new Request('https://edu.example/api/platform', { headers: { 'oai-authenticated-user-email': 'productstep.dep@gmail.com' } }), withoutProvider, ctx);
  assert.equal(response.status, 401);
});

test('built Worker rejects forged owner identity on the protected API', async () => {
  const response = await worker.fetch(new Request('https://edu.example/api/platform', { headers: { 'oai-authenticated-user-email': 'productstep.dep@gmail.com' } }), env, ctx);
  assert.equal(response.status, 401);
});

test('built Worker redirects admin login and logout to Cloudflare Access', async () => {
  const login = await worker.fetch(new Request('https://edu.example/signin-with-chatgpt?return_to=https://attacker.test'), env, ctx);
  assert.equal(login.status, 302);
  assert.equal(login.headers.get('location'), 'https://edu.example/admin');
  const logout = await worker.fetch(new Request('https://edu.example/signout-with-chatgpt'), env, ctx);
  assert.equal(logout.headers.get('location'), '/cdn-cgi/access/logout');
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
});

test('built Worker rejects cross-origin mutation before the API handler', async () => {
  const response = await worker.fetch(new Request('https://edu.example/api/platform', { method: 'POST', headers: { origin: 'https://attacker.test' } }), env, ctx);
  assert.equal(response.status, 403);
});
