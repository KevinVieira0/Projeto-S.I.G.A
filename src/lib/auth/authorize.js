import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken, matchesCredential } from "./session";

export async function resolveSession(token) {
  const claims = verifySessionToken(token);
  if (!claims) return null;
  if (claims.tipo === "empresa") {
    const empresa = await prisma.empresa.findUnique({
      where: { id: claims.sub },
      select: { id: true, cnpj: true, razaoSocial: true, nomeFantasia: true, ativa: true, autorizada: true, senhaHash: true },
    });
    if (!empresa?.ativa || !empresa.autorizada || !matchesCredential(claims, empresa.senhaHash)) return null;
    const { ativa, autorizada, senhaHash, ...dados } = empresa;
    return { tipo: "empresa", dados: { ...dados, role: "empresa" } };
  }
  const admin = await prisma.administrador.findUnique({
    where: { id: claims.sub },
    select: { id: true, nome: true, email: true, ativo: true, senhaHash: true },
  });
  if (!admin?.ativo || !matchesCredential(claims, admin.senhaHash)) return null;
  const { ativo, senhaHash, ...dados } = admin;
  return { tipo: "admin", dados: { ...dados, role: "admin" } };
}

export async function getCurrentSession() {
  return resolveSession(cookies().get(SESSION_COOKIE)?.value);
}

export function validateMutationOrigin(request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next pode usar o hostname interno em request.url durante o desenvolvimento.
  const expected = process.env.APP_ORIGIN || url.protocol + "//" + (request.headers.get("host") || url.host);
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected)) {
    return NextResponse.json({ message: "Origem da requisição não permitida.", mensagem: "Origem da requisição não permitida." }, { status: 403 });
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ message: "Envie os dados em JSON.", mensagem: "Envie os dados em JSON." }, { status: 415 });
  }
  return null;
}

export async function authorize(request, tipo) {
  if (!["GET", "HEAD"].includes(request.method)) {
    const error = validateMutationOrigin(request);
    if (error) return { error };
  }
  const session = await resolveSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return { error: NextResponse.json({ message: "Sua sessão expirou. Entre novamente.", mensagem: "Sua sessão expirou. Entre novamente." }, { status: 401 }) };
  }
  if (tipo && session.tipo !== tipo) {
    return { error: NextResponse.json({ message: "Acesso não permitido para este perfil.", mensagem: "Acesso não permitido para este perfil." }, { status: 403 }) };
  }
  return { session };
}
