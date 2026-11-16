import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { consolidarAlunosPorCurso } from "@/lib/dashboard/alunosPorCurso";
import { filtroAlunosDisponiveis } from "@/lib/dashboard/statusAlunos";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const status =
      new URL(requisicao.url).searchParams.get("status") ?? "todos";
    if (!["todos", "disponiveis"].includes(status)) {
      return NextResponse.json(
        { mensagem: "Recorte de alunos inválido." },
        { status: 400 },
      );
    }
    const grupos = await prisma.aluno.groupBy({
      where:
        status === "disponiveis"
          ? filtroAlunosDisponiveis
          : { arquivadoEm: null },
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
