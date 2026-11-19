import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { consolidarAlunosPorCurso } from "@/lib/dashboard/alunosPorCurso";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const grupos = await prisma.aluno.groupBy({
      where: { arquivadoEm: null },
      by: ["curso", "periodo"],
      _count: { _all: true },
    });
    return NextResponse.json(consolidarAlunosPorCurso(grupos), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível carregar os alunos por curso." },
      { status: 500 },
    );
  }
}
