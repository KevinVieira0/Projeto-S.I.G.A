import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "siga_session";
export const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("Configure AUTH_SECRET com pelo menos 32 caracteres.");
  }
  return value;
}

function sign(value) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionToken(tipo, usuario, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    v: 1, sub: usuario.id, tipo,
    exp: Math.floor(now / 1000) + SESSION_SECONDS,
    // Uma troca de senha invalida também os cookies anteriores.
    credential: sign(usuario.senhaHash),
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      data.v !== 1 || !["admin", "empresa"].includes(data.tipo) ||
      typeof data.sub !== "string" || !data.sub ||
      !Number.isInteger(data.exp) || data.exp <= Math.floor(now / 1000) ||
      typeof data.credential !== "string"
    ) return null;
    return data;
  } catch {
    return null;
  }
}

export function matchesCredential(session, senhaHash) {
  return Boolean(senhaHash) && session.credential === sign(senhaHash);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: SESSION_SECONDS,
  };
}

export function setSessionCookie(response, tipo, usuario) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(tipo, usuario), sessionCookieOptions());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
