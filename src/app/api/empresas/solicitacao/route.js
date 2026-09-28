import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/authorize";
import { lerCursosDaPlanilha } from "@/lib/googleSheets";
import { createSolicitacaoSchema, parseCivilDate } from "@/lib/validations/solicitacaoSchema";

export const runtime = "nodejs";

function invalid(result) {
  return NextResponse.json({ message: "Dados de solicitação inválidos.", errors: result.error.flatten() }, { status: 400 });
}

export async function POST(request) {
  try {
    const { session, error } = await authorize(request, "empresa");
    if (error) return error;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
    }
    // Rejeita idEmpresa e outros campos extras antes de consultar a planilha.
    const basic = createSolicitacaoSchema().safeParse(body);
    if (!basic.success) return invalid(basic);
    let cursos;
    try {
      cursos = await lerCursosDaPlanilha();
    } catch {
      return NextResponse.json({ message: "Não foi possível validar os cursos. Tente novamente em instantes." }, { status: 503 });
    }
    const result = createSolicitacaoSchema(cursos).safeParse(basic.data);
    if (!result.success) return invalid(result);
    const { inicio, fim, ...values } = result.data;
    const solicitacao = await prisma.solicitacao.create({
      data: {
        ...values, inicio: parseCivilDate(inicio), fim: parseCivilDate(fim),
        empresa: { connect: { id: session.dados.id } },
      },
      select: { id: true, criadoEm: true },
    });
    return NextResponse.json({ message: "Solicitação criada com sucesso.", solicitacao }, { status: 201 });
  } catch {
    console.error("Falha ao persistir solicitação.");
    return NextResponse.json({ message: "Não foi possível gravar a solicitação. Tente novamente." }, { status: 500 });
  }
}
