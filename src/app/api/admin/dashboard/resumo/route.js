import { consolidarStatusAlunos } from "@/lib/dashboard/statusAlunos";
import { authorize } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inicioDoPanorama, periodosPanorama } from "@/lib/dashboard/periodoPanorama";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const { searchParams: parametrosBusca } = new URL(requisicao.url);
    const parametroPeriodo = parametrosBusca.get("periodo") || "30";
    const periodo = parametroPeriodo === "todos" ? "todos" : Number(parametroPeriodo);
    const todoPeriodo = periodo === "todos";
    if (!todoPeriodo && !periodosPanorama.includes(periodo)) {
      return NextResponse.json(
        { mensagem: "Período inválido. Utilize todos, 7, 30 ou 90 dias." },
        { status: 400 },
      );
    }
    const inicioDoPeriodo = inicioDoPanorama(periodo);

    // Retrato dos cadastros atualizados no período.
    // Não representa o número de transições no histórico de matrículas.
    const filtroAlunos = todoPeriodo
      ? { arquivadoEm: null }
      : { arquivadoEm: null, ultimaAtualizacao: { gte: inicioDoPeriodo } };
    const filtroEmpresas = todoPeriodo ? {} : { atualizadoEm: { gte: inicioDoPeriodo } };
    const filtroSolicitacoes = todoPeriodo ? {} : { criadoEm: { gte: inicioDoPeriodo } };
    const [alunosPorStatus, empresasPorSituacao, solicitacoes] = await Promise.all([
      prisma.aluno.groupBy({
        by: ["statusIndicacao"],
        where: filtroAlunos,
        _count: { _all: true },
      }),
      prisma.empresa.groupBy({
        by: ["ativa"],
        where: filtroEmpresas,
        _count: { _all: true },
      }),
      prisma.solicitacao.aggregate({
        where: filtroSolicitacoes,
        _count: { _all: true },
        _sum: { quantidadeVagas: true },
      }),
    ]);
    const statusAlunos = consolidarStatusAlunos(alunosPorStatus);
    const empresasAtivas = empresasPorSituacao.find((grupo) => grupo.ativa)?._count._all ?? 0;
    const empresasInativas = empresasPorSituacao.find((grupo) => !grupo.ativa)?._count._all ?? 0;
    return NextResponse.json(
      {
        periodo,
        criterio: {
          alunos: todoPeriodo ? "todos" : "ultimaAtualizacao",
          empresas: todoPeriodo ? "todos" : "atualizadoEm",
          solicitacoes: todoPeriodo ? "todos" : "criadoEm",
        },
        alunos: statusAlunos,
        empresas: {
          total: empresasAtivas + empresasInativas,
          categorias: [
            {
              id: "ativas",
              label: "Ativas",
              valor: empresasAtivas,
            },
            { id: "inativas", label: "Inativas", valor: empresasInativas },
          ],
          resumo: {
            solicitacoes: solicitacoes._count._all,
            vagas: solicitacoes._sum.quantidadeVagas ?? 0,
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erroCapturado) {
    console.error("Erro ao carregar o resumo do dashboard:", erroCapturado);
    return NextResponse.json(
      { mensagem: "Não foi possível carregar os dados da visão geral." },
      { status: 500 },
    );
  }
}
