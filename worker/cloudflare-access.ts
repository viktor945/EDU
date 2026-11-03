import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export type AccessConfig = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
};

const keySets = new Map<string, JWTVerifyGetKey>();

export function accessIssuer(config: AccessConfig): string {
  if (!config.ACCESS_TEAM_DOMAIN || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(config.ACCESS_TEAM_DOMAIN) || !config.ACCESS_AUD) {
    throw new Error('Cloudflare Access is not configured');
  }
  return `https://${config.ACCESS_TEAM_DOMAIN}`;
}

// Existing application guards receive identity only after cryptographic validation.
// The original Sites deployment retains its own trusted hosting boundary.
export async function authenticateCloudflareRequest(
  request: Request,
  config: AccessConfig,
  testKeys?: JWTVerifyGetKey,
): Promise<Request> {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith('oai-authenticated-') || name.toLowerCase() === 'cf-access-authenticated-user-email') headers.delete(name);
  }
  const sanitized = () => new Request(request, { headers });
  const token = request.headers.get('cf-access-jwt-assertion') || request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  if (!token) return sanitized();
  try {
    const issuer = accessIssuer(config);
    let keys = testKeys || keySets.get(issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5000 });
      keySets.set(issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer, audience: config.ACCESS_AUD, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
    });
    if (typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return sanitized();
    headers.set('oai-authenticated-user-email', payload.email.trim().toLowerCase());
    return sanitized();
  } catch {
    // Untrusted/expired tokens and unavailable JWKS grant no identity.
    return sanitized();
  }
}

export function rejectCrossSiteMutation(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  const origin = request.headers.get('origin');
  return (origin !== null && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site';
}
