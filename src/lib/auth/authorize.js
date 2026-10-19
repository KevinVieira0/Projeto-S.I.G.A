import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken, matchesCredential } from "./session";

export async function resolveSession(token) {
  const declaracoes = verifySessionToken(token);
  if (!declaracoes) return null;
  if (declaracoes.tipo === "empresa") {
    const empresa = await prisma.empresa.findUnique({
      where: { id: declaracoes.sub },
      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        nomeFantasia: true,
        ativa: true,
        autorizada: true,
        senhaHash: true,
      },
    });
    if (
      !empresa?.ativa ||
      !empresa.autorizada ||
      !matchesCredential(declaracoes, empresa.senhaHash)
    )
      return null;
    const { ativa, autorizada, senhaHash, ...dados } = empresa;
    return { tipo: "empresa", dados: { ...dados, role: "empresa" } };
  }
  const administrador = await prisma.administrador.findUnique({
    where: { id: declaracoes.sub },
    select: { id: true, nome: true, email: true, ativo: true, senhaHash: true },
  });
  if (!administrador?.ativo || !matchesCredential(declaracoes, administrador.senhaHash))
    return null;
  const { ativo, senhaHash, ...dados } = administrador;
  return { tipo: "admin", dados: { ...dados, role: "admin" } };
}

export async function getCurrentSession() {
  return resolveSession(cookies().get(SESSION_COOKIE)?.value);
}

export function validateMutationOrigin(requisicao) {
  const origin = requisicao.headers.get("origin");
  const url = new URL(requisicao.url);
  // Next pode usar o hostname interno em request.url durante o desenvolvimento.
  const esperado =
    process.env.APP_ORIGIN ||
    url.protocol + "//" + (requisicao.headers.get("host") || url.host);
  if (
    requisicao.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && origin !== esperado)
  ) {
    return NextResponse.json(
      {
        message: "Origem da requisição não permitida.",
        mensagem: "Origem da requisição não permitida.",
      },
      { status: 403 },
    );
  }
  if (
    requisicao.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return NextResponse.json(
      { message: "Envie os dados em JSON.", mensagem: "Envie os dados em JSON." },
      { status: 415 },
    );
  }
  return null;
}

export async function authorize(requisicao, tipo) {
  if (!["GET", "HEAD"].includes(requisicao.method)) {
    const erroCapturado = validateMutationOrigin(requisicao);
    if (erroCapturado) return { error: erroCapturado };
  }
  const sessao = await resolveSession(requisicao.cookies.get(SESSION_COOKIE)?.value);
  if (!sessao) {
    return {
      error: NextResponse.json(
        {
          message: "Sua sessão expirou. Entre novamente.",
          mensagem: "Sua sessão expirou. Entre novamente.",
        },
        { status: 401 },
      ),
    };
  }
  if (tipo && sessao.tipo !== tipo) {
    return {
      error: NextResponse.json(
        {
          message: "Acesso não permitido para este perfil.",
          mensagem: "Acesso não permitido para este perfil.",
        },
        { status: 403 },
      ),
    };
  }
  return { session: sessao };
}
