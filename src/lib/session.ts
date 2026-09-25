/** Подпись сессии на Web Crypto, чтобы проверка работала и в proxy, и в Node. */

export const COOKIE_NAME = "dfv_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

type Payload = { sub: string; exp: number };

let cached: { secret: string; key: Promise<CryptoKey> } | null = null;

function readSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

async function hmacKey() {
  const secret = readSecret();
  if (!secret) return null;
  if (!cached || cached.secret !== secret) {
    cached = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      ),
    };
  }
  return cached.key;
}

function bytesToB64url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(value: string) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function cookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function signBody(body: string) {
  const key = await hmacKey();
  if (!key) return null;
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  return `${body}.${bytesToB64url(sig)}`;
}

async function verifyBody(token: string) {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig || token.includes(".", dot + 1)) return null;

  try {
    const key = await hmacKey();
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(body),
    );
    return ok ? body : null;
  } catch {
    return null;
  }
}

export async function signJson(value: unknown) {
  const body = bytesToB64url(new TextEncoder().encode(JSON.stringify(value)));
  return signBody(body);
}

export async function verifyJson(token: string) {
  const body = await verifyBody(token);
  if (!body) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as unknown;
  } catch {
    return null;
  }
}

export async function signSession(userId: string) {
  const payload: Payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  return signJson(payload);
}

export async function verifySessionToken(token: string) {
  const payload = (await verifyJson(token)) as Payload | null;
  if (!payload || typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < Date.now() / 1000) return null;
  return { sub: payload.sub };
}
