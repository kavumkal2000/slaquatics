import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { createSessionCookie, getSession, hashAuthToken, publicAuthOrigin } from './auth.ts';
import { getOpsAuthStore, type OpsAuthUser, type OpsPasskey } from './auth-store.ts';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const RP_NAME = 'Shoreline Aquatics';

function base64UrlToBytes(value: string) {
  return Uint8Array.from(Buffer.from(value, 'base64url'));
}

function bytesToBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString('base64url');
}

function rpIDFor(request: Request) {
  return new URL(request.url).hostname;
}

function expectedOriginFor(request: Request) {
  return publicAuthOrigin(request);
}

function parseClientChallenge(response: RegistrationResponseJSON | AuthenticationResponseJSON) {
  const raw = response?.response?.clientDataJSON;
  if (!raw) return '';
  try {
    const payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    return String(payload.challenge || '');
  } catch {
    return '';
  }
}

function challengeExpiresAt() {
  return new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
}

function transportsFor(passkey: OpsPasskey) {
  return passkey.transports
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as any[];
}

export async function createPasskeyRegistrationOptions(request: Request) {
  const session = await getSession(request);
  if (!session) return { error: 'Authentication required.', status: 401 as const };
  if (!['owner', 'developer'].includes(String(session.role || '').toLowerCase())) {
    return { error: 'Owner or developer access required.', status: 403 as const };
  }

  const store = await getOpsAuthStore();
  const existing = await store.listPasskeysForUser(session.id);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpIDFor(request),
    userID: Buffer.from(String(session.id)),
    userName: session.username,
    userDisplayName: session.displayName || session.username,
    attestationType: 'none',
    excludeCredentials: existing.map((passkey) => ({
      id: passkey.credentialId,
      transports: transportsFor(passkey)
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required'
    }
  });
  await store.createChallenge({
    challengeHash: hashAuthToken(options.challenge),
    userId: session.id,
    purpose: 'passkey-registration',
    challenge: options.challenge,
    expiresAt: challengeExpiresAt()
  });
  await store.audit({ event: 'passkey_registration_options', username: session.username, userId: session.id });
  return { options };
}

export async function verifyPasskeyRegistration(request: Request, response: RegistrationResponseJSON) {
  const session = await getSession(request);
  if (!session) return { error: 'Authentication required.', status: 401 as const };
  const challenge = parseClientChallenge(response);
  const store = await getOpsAuthStore();
  const stored = challenge ? await store.findChallenge(hashAuthToken(challenge)) : null;
  if (!stored || stored.userId !== session.id || stored.purpose !== 'passkey-registration' || stored.consumedAt || Date.parse(stored.expiresAt) <= Date.now()) {
    return { error: 'Passkey challenge expired. Try again.', status: 400 as const };
  }

  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: expectedOriginFor(request),
    expectedRPID: rpIDFor(request),
    requireUserVerification: true
  });
  if (!result.verified) return { error: 'Passkey registration failed.', status: 400 as const };

  const credential = result.registrationInfo.credential;
  await store.createPasskey({
    userId: session.id,
    credentialId: credential.id,
    publicKey: bytesToBase64Url(credential.publicKey),
    counter: credential.counter,
    transports: Array.isArray(response.response.transports) ? response.response.transports.join(',') : ''
  });
  await store.consumeChallenge(stored.challengeHash);
  await store.audit({ event: 'passkey_registered', username: session.username, userId: session.id });
  return { ok: true };
}

export async function createPasskeyAuthenticationOptions(request: Request) {
  const store = await getOpsAuthStore();
  const options = await generateAuthenticationOptions({
    rpID: rpIDFor(request),
    userVerification: 'required'
  });
  await store.createChallenge({
    challengeHash: hashAuthToken(options.challenge),
    purpose: 'passkey-authentication',
    challenge: options.challenge,
    expiresAt: challengeExpiresAt()
  });
  return { options };
}

export async function verifyPasskeyAuthentication(request: Request, response: AuthenticationResponseJSON) {
  const store = await getOpsAuthStore();
  const challenge = parseClientChallenge(response);
  const stored = challenge ? await store.findChallenge(hashAuthToken(challenge)) : null;
  if (!stored || stored.purpose !== 'passkey-authentication' || stored.consumedAt || Date.parse(stored.expiresAt) <= Date.now()) {
    return { error: 'Passkey challenge expired. Try again.', status: 400 as const };
  }
  const passkey = await store.findPasskeyByCredentialId(String(response.id || ''));
  if (!passkey) return { error: 'Passkey is not registered.', status: 401 as const };
  const user = await store.findUserById(passkey.userId);
  if (!user || !user.enabled) return { error: 'Passkey is not linked to an enabled user.', status: 401 as const };

  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: expectedOriginFor(request),
    expectedRPID: rpIDFor(request),
    credential: {
      id: passkey.credentialId,
      publicKey: base64UrlToBytes(passkey.publicKey),
      counter: passkey.counter
    },
    requireUserVerification: true
  });
  if (!result.verified) return { error: 'Passkey sign-in failed.', status: 401 as const };

  await store.updatePasskeyCounter(passkey.credentialId, result.authenticationInfo.newCounter);
  await store.consumeChallenge(stored.challengeHash);
  await store.audit({ event: 'passkey_login_success', username: user.username, userId: user.id });
  return { ok: true, user, cookie: await createSessionCookie(user as OpsAuthUser, request, { authMethod: 'passkey' }) };
}
