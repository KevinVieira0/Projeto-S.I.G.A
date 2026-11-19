import { NextResponse } from "next/server";
import { authorize, validateMutationOrigin } from "@/lib/auth/authorize";
import {
  SESSION_COOKIE,
  SESSION_COOKIES,
  verifySessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(requisicao) {
  const erroCapturado = validateMutationOrigin(requisicao);
  if (erroCapturado) return erroCapturado;
  let dados;
  try {
    dados = await requisicao.json();
  } catch {
    return NextResponse.json({ mensagem: "JSON inválido." }, { status: 400 });
  }
  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados) ||
    Object.keys(dados).some((chave) => chave !== "perfil") ||
    (dados.perfil !== undefined && !["admin", "empresa"].includes(dados.perfil))
  )
    return NextResponse.json({ mensagem: "Perfil inválido." }, { status: 400 });
  let perfil = dados.perfil;
  if (!perfil) {
    const { error, session } = await authorize(requisicao);
    if (error) return error;
    perfil = session.tipo;
  }
  const resposta = NextResponse.json({ mensagem: "Sessão encerrada." });
  resposta.cookies.set(SESSION_COOKIES[perfil], "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  const legado = requisicao.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(legado)?.tipo === perfil)
    resposta.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
