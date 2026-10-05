import { NextResponse } from "next/server";
import { validateMutationOrigin } from "@/lib/auth/authorize";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(requisicao) {
  const erroCapturado = validateMutationOrigin(requisicao);
  if (erroCapturado) return erroCapturado;
  const resposta = NextResponse.json({ mensagem: "Sessão encerrada." });
  resposta.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
