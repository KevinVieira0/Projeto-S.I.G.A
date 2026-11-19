import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  try {
    const [turmas, empresas] = await Promise.all([
      prisma.turma.findMany({
        where: {
          quantidadeTermos: { gt: 0 },
          dataInicio: { not: null },
          dataFim: { not: null },
        },
        select: {
          id: true,
          codigo: true,
          turno: true,
          quantidadeTermos: true,
          curso: { select: { nome: true, tipoCurso: true } },
        },
        orderBy: [{ curso: { nome: "asc" } }, { codigo: "asc" }],
      }),
      prisma.empresa.findMany({
        select: { id: true, razaoSocial: true, nomeFantasia: true, ativa: true },
        orderBy: { razaoSocial: "asc" },
      }),
    ]);
    return NextResponse.json(
      { turmas, empresas },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível carregar as opções de cadastro." },
      { status: 500 },
    );
  }
}
