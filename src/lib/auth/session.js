import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "siga_session";

export const SESSION_SECONDS = 8 * 60 * 60;

function obterSegredo() {
  const valor = process.env.AUTH_SECRET;
  if (!valor || valor.length < 32) {
    throw new Error("Configure AUTH_SECRET com pelo menos 32 caracteres.");
  }
  return valor;
}

function assinar(valor) {
  return createHmac("sha256", obterSegredo()).update(valor).digest("base64url");
}

export function createSessionToken(tipo, usuario, agora = Date.now()) {
  const conteudoToken = Buffer.from(
    JSON.stringify({
      v: 1,
      sub: usuario.id,
      tipo,
      exp: Math.floor(agora / 1000) + SESSION_SECONDS,
      // Uma troca de senha invalida também os cookies anteriores.
      credential: assinar(usuario.senhaHash),
    }),
  ).toString("base64url");
  return `${conteudoToken}.${assinar(conteudoToken)}`;
}

export function verifySessionToken(token, agora = Date.now()) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [conteudoToken, assinatura] = partes;
  const esperado = Buffer.from(assinar(conteudoToken));
  const recebido = Buffer.from(assinatura);
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado))
    return null;
  try {
    const dados = JSON.parse(Buffer.from(conteudoToken, "base64url").toString("utf8"));
    if (
      dados.v !== 1 ||
      !["admin", "empresa"].includes(dados.tipo) ||
      typeof dados.sub !== "string" ||
      !dados.sub ||
      !Number.isInteger(dados.exp) ||
      dados.exp <= Math.floor(agora / 1000) ||
      typeof dados.credential !== "string"
    )
      return null;
    return dados;
  } catch {
    return null;
  }
}

export function matchesCredential(sessao, senhaHash) {
  return Boolean(senhaHash) && sessao.credential === assinar(senhaHash);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export function setSessionCookie(resposta, tipo, usuario) {
  resposta.cookies.set(
    SESSION_COOKIE,
    createSessionToken(tipo, usuario),
    sessionCookieOptions(),
  );
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
