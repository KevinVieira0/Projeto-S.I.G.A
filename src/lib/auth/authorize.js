import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_COOKIES,
  verifySessionToken,
  matchesCredential,
} from "./session";

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
  if (
    !administrador?.ativo ||
    !matchesCredential(declaracoes, administrador.senhaHash)
  )
    return null;
  const { ativo, senhaHash, ...dados } = administrador;
  return { tipo: "admin", dados: { ...dados, role: "admin" } };
}

export async function resolveProfileSession(armazenamento, perfil) {
  const nome = SESSION_COOKIES[perfil];
  if (typeof nome !== "string") return null;
  // O cookie específico prevalece, inclusive quando inválido, para não reativar uma sessão antiga.
  const token =
    armazenamento.get(nome)?.value ?? armazenamento.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)?.tipo !== perfil) return null;
  return resolveSession(token);
}

async function sessoesAtivas(armazenamento) {
  return (
    await Promise.all(
      Object.keys(SESSION_COOKIES).map((perfil) =>
        resolveProfileSession(armazenamento, perfil),
      ),
    )
  ).filter(Boolean);
}

export async function getCurrentSession(perfil) {
  if (perfil) return resolveProfileSession(cookies(), perfil);
  const ativas = await sessoesAtivas(cookies());
  return ativas.length === 1 ? ativas[0] : null;
}

export function validateMutationOrigin(
  requisicao,
  tipoConteudo = "application/json",
) {
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
    requisicao.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase() !== tipoConteudo
  ) {
    return NextResponse.json(
      {
        message:
          tipoConteudo === "application/json"
            ? "Envie os dados em JSON."
            : "Envie o arquivo por formulário.",
        mensagem:
          tipoConteudo === "application/json"
            ? "Envie os dados em JSON."
            : "Envie o arquivo por formulário.",
      },
      { status: 415 },
    );
  }
  return null;
}

export async function authorize(requisicao, tipo, { tipoConteudo } = {}) {
  if (!["GET", "HEAD"].includes(requisicao.method)) {
    const erroCapturado = validateMutationOrigin(requisicao, tipoConteudo);
    if (erroCapturado) return { error: erroCapturado };
  }
  const ativas = tipo
    ? [await resolveProfileSession(requisicao.cookies, tipo)].filter(Boolean)
    : await sessoesAtivas(requisicao.cookies);
  if (!tipo && ativas.length > 1)
    return {
      error: NextResponse.json(
        {
          mensagem: "Informe o perfil da sessão nesta operação.",
          message: "Informe o perfil da sessão nesta operação.",
        },
        { status: 409 },
      ),
    };
  const sessao = ativas[0];
  if (!sessao) {
    if (tipo && (await sessoesAtivas(requisicao.cookies)).length)
      return {
        error: NextResponse.json(
          {
            mensagem: "Acesso não permitido para este perfil.",
            message: "Acesso não permitido para este perfil.",
          },
          { status: 403 },
        ),
      };
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
