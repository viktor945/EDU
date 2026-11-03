import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { authenticateCloudflareRequest, rejectCrossSiteMutation } from '../worker/cloudflare-access.ts';

const config = { ACCESS_TEAM_DOMAIN: 'stepline-test.cloudflareaccess.com', ACCESS_AUD: 'a'.repeat(64) };
const { privateKey, publicKey } = await generateKeyPair('RS256');
const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'test' }] });
const owner = 'productstep.dep@gmail.com';
const token = (overrides = {}) => new SignJWT({ email: owner, ...overrides.payload })
  .setProtectedHeader({ alg: 'RS256', kid: 'test' })
  .setIssuer(overrides.issuer || `https://${config.ACCESS_TEAM_DOMAIN}`)
  .setAudience(overrides.audience || config.ACCESS_AUD)
  .setSubject('test-user').setIssuedAt()
  .setExpirationTime(overrides.expires || '5m').sign(privateKey);
const request = (headers) => new Request('https://edu.example/admin', { headers });

test('forged identity headers grant no identity', async () => {
  const result = await authenticateCloudflareRequest(request({
    'oai-authenticated-user-email': owner,
    'oai-authenticated-user-full-name': 'Forged',
    'cf-access-authenticated-user-email': owner,
  }), config, keys);
  assert.equal(result.headers.get('oai-authenticated-user-email'), null);
  assert.equal(result.headers.get('oai-authenticated-user-full-name'), null);
  assert.equal(result.headers.get('cf-access-authenticated-user-email'), null);
});

test('only a verified token supplies identity, including API cookie requests', async () => {
  const signed = await token({ payload: { email: 'teacher@example.test' } });
  for (const headers of [{ 'cf-access-jwt-assertion': signed }, { cookie: `other=1; CF_Authorization=${signed}` }]) {
    const result = await authenticateCloudflareRequest(request({ ...headers, 'oai-authenticated-user-email': owner }), config, keys);
    assert.equal(result.headers.get('oai-authenticated-user-email'), 'teacher@example.test');
  }
});

test('expired, wrong audience, wrong issuer, tampered and missing-expiry tokens fail closed', async () => {
  const good = await token();
  const [header, payload] = good.split('.');
  const missingExpiry = await new SignJWT({ email: owner }).setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(`https://${config.ACCESS_TEAM_DOMAIN}`).setAudience(config.ACCESS_AUD).setSubject('user').setIssuedAt().sign(privateKey);
  for (const signed of [await token({ expires: 946684800 }), await token({ audience: 'wrong' }), await token({ issuer: 'https://attacker.test' }), `${header}.${payload}.invalid`, missingExpiry]) {
    const result = await authenticateCloudflareRequest(request({ 'cf-access-jwt-assertion': signed, 'oai-authenticated-user-email': owner }), config, keys);
    assert.equal(result.headers.get('oai-authenticated-user-email'), null);
  }
});

test('missing configuration and unusable signing keys grant no identity', async () => {
  const signed = await token();
  for (const [settings, resolver] of [[{}, keys], [config, async () => { throw new Error('JWKS unavailable'); }]]) {
    const result = await authenticateCloudflareRequest(request({ 'cf-access-jwt-assertion': signed }), settings, resolver);
    assert.equal(result.headers.get('oai-authenticated-user-email'), null);
  }
});

test('cross-site cookie mutations are rejected; same-origin API calls remain allowed', () => {
  const call = headers => new Request('https://edu.example/api/platform', { method: 'POST', headers });
  assert.equal(rejectCrossSiteMutation(call({ origin: 'https://attacker.test' })), true);
  assert.equal(rejectCrossSiteMutation(call({ origin: 'null' })), true);
  assert.equal(rejectCrossSiteMutation(call({ 'sec-fetch-site': 'cross-site' })), true);
  assert.equal(rejectCrossSiteMutation(call({ origin: 'https://edu.example' })), false);
  assert.equal(rejectCrossSiteMutation(new Request('https://edu.example/')), false);
});
